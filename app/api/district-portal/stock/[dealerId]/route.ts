import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  request: Request,
  context: { params: Promise<{ dealerId: string }> }
) {
  try {
    const district = new URL(request.url).searchParams.get('district');
    const params = await context.params;
    const dealerId = parseInt(params.dealerId, 10);

    if (!district) {
      return NextResponse.json({ success: false, error: 'District is required' }, { status: 400 });
    }

    if (Number.isNaN(dealerId)) {
      return NextResponse.json({ success: false, error: 'Invalid dealer ID' }, { status: 400 });
    }

    const pool = getPool();
    const dealerScope = await pool.query(
      `SELECT dealer_id FROM dealers WHERE dealer_id = $1 AND LOWER(COALESCE(district, '')) = LOWER($2)`,
      [dealerId, district]
    );

    if (dealerScope.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Dealer not found in your district' }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT
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
       ORDER BY dp.company, dp.model_number`,
      [dealerId]
    );

    return NextResponse.json({ success: true, products: result.rows });
  } catch (error) {
    console.error('Error fetching district dealer stock detail:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dealer stock detail' }, { status: 500 });
  }
}