// app/api/track-order/send-otp/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ 
        success: false, 
        message: 'Phone number is required' 
      }, { status: 400 });
    }

    const pool = getPool();

    // Check if phone number has any orders
    const orderResult = await pool.query(
      'SELECT COUNT(*)::int as order_count FROM orders WHERE customer_phone = $1',
      [phoneNumber]
    );

    console.log(`Phone: ${phoneNumber}, Order Count: ${orderResult.rows[0].order_count}`);

    if (orderResult.rows[0].order_count === 0 || orderResult.rows[0].order_count === '0') {
      return NextResponse.json({ 
        success: false, 
        message: 'No orders found for this phone number' 
      }, { status: 404 });
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration to 10 minutes from now
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in database
    // Temporarily use 'PHONE-ONLY' as order_number until migration is run
    await pool.query(
      `INSERT INTO order_tracking_otps (order_number, phone_number, otp_code, expires_at)
       VALUES ($1, $2, $3, $4)`,
      ['PHONE-ONLY', phoneNumber, otpCode, expiresAt]
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
    console.error('Error details:', err.message, err.stack);
    return NextResponse.json({ 
      success: false, 
      message: err.message || 'Failed to send OTP',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}