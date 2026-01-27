// app/api/track-order/send-otp/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { orderNumber, phoneNumber } = await request.json();

    if (!orderNumber || !phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order number and phone number are required' 
      }, { status: 400 });
    }

    const pool = getPool();

    // Verify order exists and phone matches
    const orderResult = await pool.query(
      'SELECT order_id, customer_phone FROM orders WHERE order_number = $1',
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Order not found' 
      }, { status: 404 });
    }

    const order = orderResult.rows[0];
    
    // Check if phone number matches
    if (order.customer_phone !== phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phone number does not match our records' 
      }, { status: 403 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in database
    await pool.query(
      `INSERT INTO order_tracking_otps (order_number, phone_number, otp_code, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [orderNumber, phoneNumber, otpCode, expiresAt]
    );

    // TODO: Integrate SMS gateway (Twilio, MSG91, etc.)
    // For now, we'll return the OTP in development (remove in production)
    console.log(`OTP for ${phoneNumber}: ${otpCode}`);

    // In production, send SMS here
    // await sendSMS(phoneNumber, `Your order tracking OTP is: ${otpCode}. Valid for 10 minutes.`);

    return NextResponse.json({ 
      success: true, 
      message: 'OTP sent successfully',
      // Remove this in production:
      devOtp: process.env.NODE_ENV === 'development' ? otpCode : undefined
    });

  } catch (err: any) {
    console.error('Send OTP Error:', err);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to send OTP' 
    }, { status: 500 });
  }
}
