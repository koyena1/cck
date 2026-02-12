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
        o.order_number,
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
        o.updated_at,
        d.full_name as dealer_name,
        d.phone_number as dealer_phone
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
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
        id as item_id,
        product_id,
        item_type,
        item_name,
        quantity,
        unit_price,
        total_price
      FROM order_items
      WHERE order_id = $1
      ORDER BY id`,
      [order.order_id]
    );

    // Fetch order status history (optional - may not exist for all orders)
    let statusHistory = [];
    try {
      const historyResult = await pool.query(
        `SELECT 
          status,
          remarks,
          created_at,
          updated_by,
          updated_by_dealer
        FROM order_status_history
        WHERE order_id = $1
        ORDER BY created_at DESC`,
        [order.order_id]
      );
      statusHistory = historyResult.rows;
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
