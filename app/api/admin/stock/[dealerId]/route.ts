import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/admin/stock/[dealerId]
// Returns full product-level stock for a specific dealer including urgency flags
export async function GET(
  _request: Request,
  context: { params: Promise<{ dealerId: string }> }
) {
  try {
    const params = await context.params;
    const dealerId = parseInt(params.dealerId);
    if (isNaN(dealerId)) {
      return NextResponse.json({ success: false, error: 'Invalid dealer ID' }, { status: 400 });
    }

    const pool = getPool();

    const query = `
      SELECT
        dp.id AS product_id,
        COALESCE(to_jsonb(dp)->>'product_code', 'PIC' || LPAD(dp.id::text, 3, '0')) AS product_code,
        dp.company,
        dp.segment,
        dp.model_number,
        dp.product_type,
        dp.description,
        dp.dealer_purchase_price,
        COALESCE(di.quantity_available, 0) AS quantity_available,
        COALESCE(di.quantity_purchased, 0) AS quantity_purchased,
        COALESCE(di.quantity_sold, 0) AS quantity_sold,
        di.updated_at AS last_updated,
        COALESCE(di.quantity_available, 0) * dp.dealer_purchase_price::NUMERIC AS item_stock_value,
        asuf.flag_type,
        asuf.note AS flag_note,
        asuf.flagged_at,
        asuf.is_active AS is_flagged
      FROM dealer_products dp
      LEFT JOIN dealer_inventory di ON di.product_id = dp.id AND di.dealer_id = $1
      LEFT JOIN admin_stock_urgency_flags asuf ON asuf.product_id = dp.id AND asuf.dealer_id = $1 AND asuf.is_active = TRUE
      WHERE dp.is_active = TRUE
      ORDER BY dp.company, dp.model_number
    `;

    const result = await pool.query(query, [dealerId]);

    return NextResponse.json({
      success: true,
      products: result.rows,
    });
  } catch (error) {
    console.error('Error fetching dealer stock detail:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer stock detail' },
      { status: 500 }
    );
  }
}
