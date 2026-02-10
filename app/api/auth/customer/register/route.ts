import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('📥 Registration request received:', body);
    
    const { fullName, email, phone, password, address, pincode } = body;

    // Validation
    if (!fullName || !email || !phone || !password) {
      console.log('❌ Validation failed - missing required fields');
      return NextResponse.json({ 
        success: false, 
        error: 'Full name, email, phone, and password are required' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      console.log('❌ Validation failed - password too short');
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 6 characters' 
      }, { status: 400 });
    }

    console.log('✅ Validation passed for:', email);
    console.log('📞 Attempting database connection...');
    
    const pool = getPool();
    console.log('✅ Database pool obtained');

    // Check if email already exists
    console.log('🔍 Checking if email exists:', email);
    const existingUser = await pool.query(
      'SELECT customer_id FROM customers WHERE email = $1',
      [email]
    );
    console.log('🔍 Existing user check result:', existingUser.rows.length, 'rows');

    if (existingUser.rows.length > 0) {
      console.log('❌ Email already exists');
      return NextResponse.json({ 
        success: false, 
        error: 'Email already registered' 
      }, { status: 409 });
    }

    // Insert new customer (in production, hash the password with bcrypt)
    console.log('💾 Inserting new customer into database...');
    const result = await pool.query(
      `INSERT INTO customers (full_name, email, phone_number, password_hash, address, pincode, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, true) 
       RETURNING customer_id, full_name, email, phone_number`,
      [fullName, email, phone, password, address || null, pincode || null]
    );

    const newCustomer = result.rows[0];
    console.log('✅ Customer registered successfully:', newCustomer.customer_id);

    return NextResponse.json({ 
      success: true, 
      message: 'Registration successful! You can now login.',
      customer: {
        id: newCustomer.customer_id,
        full_name: newCustomer.full_name,
        email: newCustomer.email,
        phone: newCustomer.phone_number
      }
    });

  } catch (err: any) {
    console.error('❌ REGISTRATION ERROR:', {
      message: err.message,
      code: err.code,
      detail: err.detail,
      stack: err.stack
    });

    // Handle unique constraint violations
    if (err.code === '23505') {
      return NextResponse.json({ 
        success: false, 
        error: 'Email or phone number already exists' 
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: false, 
      error: 'Registration failed: ' + err.message,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
