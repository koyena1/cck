import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch orders assigned to (accepted by) a specific dealer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const overridesTableCheck = await pool.query(
      "SELECT to_regclass('public.dealer_product_pricing_overrides') IS NOT NULL AS exists"
    );
    const hasPricingOverrides = overridesTableCheck.rows[0]?.exists === true;
    const salePriceExpr = hasPricingOverrides
      ? 'COALESCE(dpo.dealer_sale_price, dp.dealer_sale_price)'
      : 'dp.dealer_sale_price';
    const pricingJoin = hasPricingOverrides
      ? 'LEFT JOIN dealer_product_pricing_overrides dpo ON dpo.dealer_id = $1 AND dpo.product_id = dp.id'
      : '';

    // Fetch orders that this dealer has accepted
    const ordersResult = await pool.query(`
      SELECT 
        dor.id as request_id,
        dor.order_id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.pincode,
        o.installation_address,
        o.total_amount,
        o.status as order_status,
        dor.request_status,
        dor.accepted_at,
        dor.dealer_notes,
        dor.dealer_distance_km,
        -- Calculate time since acceptance
        EXTRACT(EPOCH FROM (NOW() - dor.accepted_at)) / 3600 as hours_since_acceptance,
        -- Order items
        (SELECT json_agg(json_build_object(
            'item_name', item_name,
            'product_code', COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')),
            'quantity', quantity,
          'unit_price', ${salePriceExpr},
          'total_price', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END,
          'dealer_price', ${salePriceExpr},
          'dealer_total', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END
        ))
        FROM order_items oi
        LEFT JOIN dealer_products dp ON (
          (oi.product_id IS NOT NULL AND dp.id = oi.product_id)
          OR (oi.product_id IS NULL AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name)))
        )
        ${pricingJoin}
        WHERE oi.order_id = o.order_id) as order_items
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      WHERE dor.dealer_id = $1 
        AND dor.request_status = 'accepted'
        AND o.status NOT IN ('Completed', 'Cancelled')
      ORDER BY dor.accepted_at DESC
    `, [dealerId]);

    return NextResponse.json({
      success: true,
      orders: ordersResult.rows,
      count: ordersResult.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching assigned orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch assigned orders' },
      { status: 500 }
    );
  }
}
