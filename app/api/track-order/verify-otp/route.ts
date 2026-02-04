// app/api/track-order/verify-otp/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phoneNumber, otpCode } = await request.json();

    if (!phoneNumber || !otpCode) {
      return NextResponse.json({ 
        success: false, 
        message: 'All fields are required' 
      }, { status: 400 });
    }

    const pool = getPool();

    // Verify OTP (updated to work with current table structure)
    const otpResult = await pool.query(
      `SELECT * FROM order_tracking_otps 
       WHERE phone_number = $1 
       AND otp_code = $2 
       AND is_verified = false 
       AND expires_at > NOW()
       ORDER BY created_at DESC 
       LIMIT 1`,
      [phoneNumber, otpCode]
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

    // Fetch all orders for this phone number
    const ordersResult = await pool.query(
      `SELECT 
        o.*,
        d.full_name as dealer_name,
        d.phone_number as dealer_phone
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      WHERE o.customer_phone = $1
      ORDER BY o.created_at DESC`,
      [phoneNumber]
    );

    if (ordersResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No orders found' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      orders: ordersResult.rows
    });

  } catch (err: any) {
    console.error('Verify OTP Error:', err);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to verify OTP' 
    }, { status: 500 });
  }
}
