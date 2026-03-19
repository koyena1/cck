// app/api/guest-track-order/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderToken } = body;

    console.log('🔍 Guest Track Order - Token:', orderToken);

    // Validation
    if (!orderToken) {
      return NextResponse.json({
        success: false,
        message: 'Order tracking token is required'
      }, { status: 400 });
    }

    const pool = getPool();

    // Fetch order details using order token
    const orderResult = await pool.query(
      `SELECT 
        o.order_id,
        -- Strip dealer UID suffix only if present (PR-DDMMYY-SEQ-DEALERID → PR-DDMMYY-SEQ)
        CASE
          WHEN o.order_number ~ '^PR-[0-9]+-[0-9]+-[0-9]+$'
            THEN REGEXP_REPLACE(o.order_number, '-[0-9]+$', '')
          ELSE o.order_number
        END AS order_number,
        o.order_token,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.order_type,
        o.installation_address,
        o.pincode,
        o.city,
        o.state,
        o.subtotal,
        o.installation_charges,
        o.delivery_charges,
        o.tax_amount,
        o.discount_amount,
        o.total_amount,
        o.status,
        o.payment_status,
        o.payment_method,
        o.advance_amount,
        o.expected_delivery_date,
        o.actual_delivery_date,
        o.installation_date,
        o.created_at,
        o.updated_at
      FROM orders o
      WHERE o.order_token = $1 AND o.is_guest_order = true`,
      [orderToken]
    );

    console.log('📦 Order query result:', orderResult.rows.length, 'rows');

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found for token:', orderToken);
      return NextResponse.json({
        success: false,
        message: 'Order not found. Please check your tracking token.'
      }, { status: 404 });
    }

    const order = orderResult.rows[0];
    console.log('✅ Order found:', order.order_number);

    // Fetch order items
    const itemsResult = await pool.query(
      `SELECT 
        oi.id as item_id,
        COALESCE(oi.product_id, resolved_dp.id) AS product_id,
        COALESCE(
          resolved_dp.product_code,
          CASE
            WHEN COALESCE(oi.product_id, resolved_dp.id) IS NOT NULL
            THEN 'PIC' || LPAD(COALESCE(oi.product_id, resolved_dp.id)::text, 3, '0')
          END,
          'PIC' || LPAD(oi.id::text, 3, '0')
        ) AS product_code,
        oi.item_type,
        oi.item_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price
      FROM order_items oi
      LEFT JOIN LATERAL (
        SELECT
          dp.id,
          to_jsonb(dp)->>'product_code' AS product_code
        FROM dealer_products dp
        WHERE dp.id = oi.product_id
           OR (
             oi.product_id IS NULL
             AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name))
           )
        ORDER BY CASE WHEN dp.id = oi.product_id THEN 0 ELSE 1 END, dp.id
        LIMIT 1
      ) resolved_dp ON TRUE
      WHERE order_id = $1
      ORDER BY oi.id`,
      [order.order_id]
    );

    // Fetch order status history (optional - may not exist for all orders)
    let statusHistory: Array<{
      status: string;
      remarks: string;
      created_at: string | Date;
    }> = [];
    try {
      const historyResult = await pool.query(
        `SELECT
          status,
          created_at
        FROM order_status_history
        WHERE order_id = $1
          AND status IN ('Accepted', 'Awaiting Dealer Confirmation')
        ORDER BY created_at DESC`,
        [order.order_id]
      );
      // Map to customer-friendly messages, never exposing dealer identity
      statusHistory = historyResult.rows.map((row: any) => {
        let remarks = '';
        if (row.status === 'Accepted') {
          remarks = 'Your order has been accepted and is being processed.';
        } else if (row.status === 'Awaiting Dealer Confirmation') {
          remarks = 'Your order has been assigned and is awaiting confirmation.';
        }
        return { status: row.status, remarks, created_at: row.created_at };
      });
    } catch (historyError) {
      console.log('No status history found for order:', order.order_id);
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: itemsResult.rows,
        statusHistory: statusHistory,
      }
    });

  } catch (err: any) {
    console.error('❌ Guest track order error:', err);
    console.error('   Message:', err.message);
    console.error('   Stack:', err.stack);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch order details',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
