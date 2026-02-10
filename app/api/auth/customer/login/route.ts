import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    console.log('Customer login attempt for:', email);
    
    const pool = getPool();

    // Check Customer table
    const res = await pool.query(
      'SELECT * FROM customers WHERE email = $1 AND is_active = true', 
      [email]
    );
    
    console.log('Customer query result:', res.rows.length, 'records found');
    
    if (res.rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }

    const customer = res.rows[0];

    // Check password (in production, use bcrypt)
    if (customer.password_hash !== password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid email or password' 
      }, { status: 401 });
    }

    // Return customer data with token
    return NextResponse.json({ 
      success: true, 
      token: `customer_${customer.customer_id}_${Date.now()}`, // Simple token for demo
      customer: {
        id: customer.customer_id,
        full_name: customer.full_name,
        email: customer.email,
        phone: customer.phone_number,
        address: customer.address,
        pincode: customer.pincode
      }
    });

  } catch (err: any) {
    console.error('Customer login error:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    return NextResponse.json({ 
      success: false, 
      error: 'Server error. Please try again.',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
