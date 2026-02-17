import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, name, email, password, username } = body;
    const pool = getPool();

    // Verify that OTP was verified for this email
    const otpCheck = await pool.query(
      `SELECT is_verified FROM customer_otp_verification 
       WHERE email = $1 AND is_verified = true AND verified_at > NOW() - INTERVAL '1 hour'
       ORDER BY verified_at DESC LIMIT 1`,
      [email]
    );

    if (otpCheck.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email verification required. Please verify your email address using OTP.' 
      }, { status: 400 });
    }

    // Only allow dealer and admin registration
    if (role === 'dealer') {
      await pool.query(
        `INSERT INTO dealers (full_name, email, phone_number, business_name, business_address, gstin, registration_number, serviceable_pincodes, password_hash, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [name, email, body.phone, body.businessName || null, body.businessLocation || null, body.gstNumber || null, body.registrationNumber || null, body.serviceablePincodes || null, password, 'Pending Approval']
      );
      
      // Clean up OTP record after successful registration
      await pool.query(
        `DELETE FROM customer_otp_verification WHERE email = $1`,
        [email]
      );
      
      return NextResponse.json({ success: true, requiresApproval: true, message: 'Dealer registration submitted. Waiting for admin approval.' });

    } else if (role === 'admin') {
      // Use username from body for admin registration
      const adminUsername = username || name;
      await pool.query(
        'INSERT INTO admins (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [adminUsername, email, password, body.adminRole || 'admin']
      );
      
      // Clean up OTP record after successful registration
      await pool.query(
        `DELETE FROM customer_otp_verification WHERE email = $1`,
        [email]
      );
      
      return NextResponse.json({ success: true, message: 'Admin account created successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid role. Only dealer and admin registration allowed.' }, { status: 400 });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ success: false, message: err.message || 'Database error or user already exists' }, { status: 500 });
  }
}