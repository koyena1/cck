// app/api/track-order/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { orderNumber, phoneNumber, otpCode } = await request.json();

    if (!orderNumber || !phoneNumber || !otpCode) {
      return NextResponse.json({ 
        success: false, 
        message: 'All fields are required' 
      }, { status: 400 });
    }

    const pool = getPool();

    // Verify OTP
    const otpResult = await pool.query(
      `SELECT * FROM order_tracking_otps 
       WHERE order_number = $1 
       AND phone_number = $2 
       AND otp_code = $3 
       AND is_verified = false 
       AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [orderNumber, phoneNumber, otpCode]
    );

    if (otpResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired OTP' 
      }, { status: 401 });
    }

    // Mark OTP as verified
    await pool.query(
      'UPDATE order_tracking_otps SET is_verified = true WHERE otp_id = $1',
      [otpResult.rows[0].otp_id]
    );

    // Fetch complete order details
    const orderResult = await pool.query(
      `SELECT 
        o.*,
        d.full_name as dealer_name,
        d.phone_number as dealer_phone
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      WHERE o.order_number = $1`,
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Fetch order status history
    const historyResult = await pool.query(
      `SELECT status, remarks, created_at 
       FROM order_status_history 
       WHERE order_id = $1 
       ORDER BY created_at ASC`,
      [order.order_id]
    );

    return NextResponse.json({ 
      success: true,
      order: {
        ...order,
        history: historyResult.rows
      }
    });

  } catch (err: any) {
    console.error('Verify OTP Error:', err);
    return NextResponse.json({ 
      success: false, 
      message: 'Verification failed' 
    }, { status: 500 });
  }
}
