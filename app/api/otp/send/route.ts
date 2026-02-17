import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendOTPEmail } from '@/lib/email';

const DEV_MODE = process.env.OTP_DEV_MODE === 'true';
const DEV_OTP = '123456'; // Fixed OTP for testing

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    console.log('📋 OTP_DEV_MODE environment variable:', process.env.OTP_DEV_MODE);
    console.log('🔍 DEV_MODE is:', DEV_MODE);

    if (!email) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email address is required' 
      }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email address format' 
      }, { status: 400 });
    }

    const pool = getPool();

    // Generate 6-digit OTP
    const otpCode = DEV_MODE ? DEV_OTP : Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiration time (10 minutes from now)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Delete any old OTPs for this email (expired or not)
    await pool.query(
      `DELETE FROM customer_otp_verification 
       WHERE email = $1`,
      [email]
    );

    // Store new OTP in database
    await pool.query(
      `INSERT INTO customer_otp_verification (email, otp_code, expires_at)
       VALUES ($1, $2, $3)`,
      [email, otpCode, expiresAt]
    );

    // Send OTP via email
    const emailSent = await sendOTPEmail(email, otpCode);

    if (!emailSent && !DEV_MODE) {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to send OTP email. Please try again.' 
      }, { status: 500 });
    }

    console.log(`✅ OTP ${otpCode} sent to ${email}`);

    // Developer Mode: Return OTP in response
    if (DEV_MODE) {
      return NextResponse.json({ 
        success: true, 
        message: `DEV MODE: OTP sent to ${email}`,
        devMode: true,
        devOtp: DEV_OTP
      });
    }

    // Production Mode: Don't reveal OTP
    return NextResponse.json({ 
      success: true, 
      message: `OTP sent successfully to ${email}. Please check your email inbox.`
    });

  } catch (err: any) {
    console.error('Send OTP error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to send OTP. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
