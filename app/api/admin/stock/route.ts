import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/admin/stock
// Returns total stock value + per-dealer breakdown (sorted asc by value)
export async function GET() {
  try {
    const pool = getPool();

    // Aggregate each dealer's total stock value and metadata.
    // CROSS JOIN with all active products so counts match the dealer portal:
    // - total_products = all active products (not just those with inventory rows)
    // - out_of_stock_count includes products with no inventory entry (implicitly qty=0)
    // - low_stock_count = products with 1-4 units available
    const query = `
      SELECT
        d.dealer_id,
        d.unique_dealer_id,
        d.full_name AS dealer_name,
        d.business_name,
        d.status,
        COUNT(dp.id) AS total_products,
        COALESCE(SUM(COALESCE(di.quantity_available, 0)::NUMERIC * dp.dealer_purchase_price::NUMERIC), 0) AS stock_value,
        MAX(di.updated_at) AS last_updated,
        COUNT(CASE WHEN COALESCE(di.quantity_available, 0) = 0 THEN 1 END) AS out_of_stock_count,
        COUNT(CASE WHEN COALESCE(di.quantity_available, 0) > 0 AND COALESCE(di.quantity_available, 0) < 5 THEN 1 END) AS low_stock_count,
        (SELECT COUNT(*) FROM admin_stock_urgency_flags asuf WHERE asuf.dealer_id = d.dealer_id AND asuf.is_active = TRUE) AS flagged_count,
        EXTRACT(DAY FROM (NOW() - MAX(di.updated_at))) AS days_since_update
      FROM dealers d
      CROSS JOIN dealer_products dp
      LEFT JOIN dealer_inventory di ON d.dealer_id = di.dealer_id AND di.product_id = dp.id
      WHERE d.status = 'Active' AND dp.is_active = TRUE
      GROUP BY d.dealer_id, d.unique_dealer_id, d.full_name, d.business_name, d.status
      ORDER BY stock_value ASC
    `;

    const result = await pool.query(query);

    const dealers = result.rows.map((r) => ({
      dealerId: r.dealer_id,
      uniqueDealerId: r.unique_dealer_id,
      dealerName: r.dealer_name,
      businessName: r.business_name,
      status: r.status,
      stockValue: parseFloat(r.stock_value),
      lastUpdated: r.last_updated,
      totalProducts: parseInt(r.total_products),
      outOfStockCount: parseInt(r.out_of_stock_count),
      lowStockCount: parseInt(r.low_stock_count),
      flaggedCount: parseInt(r.flagged_count),
      daysSinceUpdate: r.days_since_update ? Math.floor(parseFloat(r.days_since_update)) : null,
    }));

    const totalStockValue = dealers.reduce((sum, d) => sum + d.stockValue, 0);

    return NextResponse.json({
      success: true,
      totalStockValue,
      dealers,
    });
  } catch (error) {
    console.error('Error fetching admin stock overview:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock overview' },
      { status: 500 }
    );
  }
}
