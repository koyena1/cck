import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const district = new URL(request.url).searchParams.get('district');

    if (!district) {
      return NextResponse.json({ success: false, error: 'District is required' }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `SELECT
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
       WHERE d.status = 'Active'
         AND LOWER(COALESCE(d.district, '')) = LOWER($1)
         AND dp.is_active = TRUE
       GROUP BY d.dealer_id, d.unique_dealer_id, d.full_name, d.business_name, d.status
       ORDER BY stock_value ASC`,
      [district]
    );

    const dealers = result.rows.map((r) => ({
      dealerId: r.dealer_id,
      uniqueDealerId: r.unique_dealer_id,
      dealerName: r.dealer_name,
      businessName: r.business_name,
      status: r.status,
      stockValue: parseFloat(r.stock_value),
      lastUpdated: r.last_updated,
      totalProducts: parseInt(r.total_products, 10),
      outOfStockCount: parseInt(r.out_of_stock_count, 10),
      lowStockCount: parseInt(r.low_stock_count, 10),
      flaggedCount: parseInt(r.flagged_count, 10),
      daysSinceUpdate: r.days_since_update ? Math.floor(parseFloat(r.days_since_update)) : null,
    }));

    return NextResponse.json({
      success: true,
      totalStockValue: dealers.reduce((sum, dealer) => sum + dealer.stockValue, 0),
      dealers,
    });
  } catch (error) {
    console.error('Error fetching district stock overview:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch district stock overview' }, { status: 500 });
  }
}