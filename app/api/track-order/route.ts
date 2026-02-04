import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { orderNumber, phone } = await request.json();

    if (!orderNumber || !phone) {
      return NextResponse.json(
        { success: false, error: 'Order number and phone are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    const result = await pool.query(
      `SELECT 
        order_id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        installation_address,
        city,
        state,
        pincode,
        total_amount,
        status,
        payment_method,
        payment_status,
        created_at,
        updated_at,
        expected_delivery_date,
        installation_date
      FROM orders 
      WHERE order_number = $1 AND customer_phone = $2
      LIMIT 1`,
      [orderNumber, phone]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found or phone number does not match' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Error tracking order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track order' },
      { status: 500 }
    );
  }
}
