import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch orders for a dealer
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

    // Fetch all accepted orders assigned to this dealer
    const query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.installation_address,
        o.pincode,
        o.city,
        o.state,
        o.total_amount,
        o.status,
        o.expected_delivery_date,
        o.actual_delivery_date,
        o.installation_date,
        o.assigned_at as accepted_at,
        o.updated_at,
        COALESCE(
          json_agg(
            json_build_object(
              'item_id', oi.id,
              'item_name', oi.item_name,
              'product_code', COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')),
              'quantity', oi.quantity,
              'unit_price', ${salePriceExpr},
              'total_price', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END,
              'dealer_price', ${salePriceExpr},
              'dealer_total', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END
            )
          ) FILTER (WHERE oi.id IS NOT NULL),
          '[]'
        ) as order_items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN dealer_products dp ON (
        (oi.product_id IS NOT NULL AND dp.id = oi.product_id)
        OR (oi.product_id IS NULL AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name)))
      )
      ${pricingJoin}
      WHERE o.assigned_dealer_id = $1
        AND o.status IN ('Allocated', 'In_Transit', 'Delivered', 'Installation_Pending', 'Completed')
      GROUP BY o.order_id
      ORDER BY 
        CASE 
          WHEN o.status = 'Allocated' THEN 1
          WHEN o.status = 'In_Transit' THEN 2
          WHEN o.status = 'Delivered' THEN 3
          WHEN o.status = 'Installation_Pending' THEN 4
          WHEN o.status = 'Completed' THEN 5
          ELSE 6
        END,
        o.updated_at DESC
    `;

    const result = await pool.query(query, [dealerId]);

    return NextResponse.json({
      success: true,
      orders: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching dealer orders:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
