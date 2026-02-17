import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const DEV_MODE = process.env.OTP_DEV_MODE === 'true';
const DEV_OTP = '123456'; // Fixed OTP for testing

export async function POST(request: Request) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email address and OTP are required' 
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

    // Validate OTP format
    if (!/^[0-9]{6}$/.test(otp)) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid OTP format. Must be 6 digits.' 
      }, { status: 400 });
    }

    const pool = getPool();

    // Developer Mode: Accept fixed OTP without database check
    if (DEV_MODE) {
      if (otp === DEV_OTP) {
        console.log(`🧪 DEV MODE: OTP verified successfully for ${email}`);
        
        // Mark as verified in database (if exists)
        await pool.query(
          `UPDATE customer_otp_verification 
           SET is_verified = true, verified_at = NOW()
           WHERE email = $1 AND otp_code = $2`,
          [email, otp]
        );

        return NextResponse.json({ 
          success: true, 
          message: 'Email verified successfully (DEV MODE)',
          devMode: true
        });
      } else {
        return NextResponse.json({ 
          success: false, 
          error: `Invalid OTP. Use ${DEV_OTP} in dev mode.` 
        }, { status: 401 });
      }
    }

    // Production Mode: Verify OTP from database
    // Check if OTP exists, is not expired, and matches
    const result = await pool.query(
      `SELECT id, email, otp_code, expires_at, is_verified, attempts
       FROM customer_otp_verification
       WHERE email = $1 AND otp_code = $2
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, otp]
    );

    if (result.rows.length === 0) {
      // Increment failed attempts
      await pool.query(
        `UPDATE customer_otp_verification 
         SET attempts = attempts + 1
         WHERE email = $1 AND expires_at > NOW()`,
        [email]
      );

      return NextResponse.json({ 
        success: false, 
        error: 'Invalid OTP. Please check and try again.' 
      }, { status: 401 });
    }

    const otpRecord = result.rows[0];

    // Check if already verified
    if (otpRecord.is_verified) {
      return NextResponse.json({ 
        success: false, 
        error: 'OTP has already been used. Please request a new one.' 
      }, { status: 400 });
    }

    // Check if expired
    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ 
        success: false, 
        error: 'OTP has expired. Please request a new one.' 
      }, { status: 400 });
    }

    // Check attempts limit (max 5 attempts)
    if (otpRecord.attempts >= 5) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many failed attempts. Please request a new OTP.' 
      }, { status: 429 });
    }

    // OTP is valid - mark as verified
    await pool.query(
      `UPDATE customer_otp_verification 
       SET is_verified = true, verified_at = NOW()
       WHERE id = $1`,
      [otpRecord.id]
    );

    console.log(`✅ OTP verified successfully for ${email}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Email verified successfully! You can now complete your registration.'
    });

  } catch (err: any) {
    console.error('Verify OTP error:', err);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to verify OTP. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
