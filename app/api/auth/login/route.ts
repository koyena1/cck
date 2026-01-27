import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email and password are required' 
      }, { status: 400 });
    }

    console.log('Login attempt for:', email);
    
    const pool = getPool();

    // 1. Check Admin (with role)
    let res = await pool.query('SELECT * FROM admins WHERE email = $1 AND is_active = true', [email]);
    console.log('Admin query result:', res.rows.length, 'records found');
    if (res.rows[0] && res.rows[0].password_hash === password) {
      const admin = res.rows[0];
      return NextResponse.json({ 
        success: true, 
        role: 'admin',
        user: {
          id: admin.admin_id,
          name: admin.username,
          email: admin.email,
          adminRole: admin.role
        }
      });
    }

    // 2. Check Dealer
    res = await pool.query('SELECT * FROM dealers WHERE email = $1', [email]);
    const dealer = res.rows[0];
    if (dealer && dealer.password_hash === password) {
      if (dealer.status !== 'Active' && dealer.status !== 'Approved') {
        return NextResponse.json({ 
          success: false, 
          message: `Account ${dealer.status}. Please contact admin for approval.` 
        }, { status: 403 });
      }
      return NextResponse.json({ 
        success: true, 
        role: 'dealer',
        user: {
          id: dealer.dealer_id,
          name: dealer.full_name,
          email: dealer.email,
          phone: dealer.phone_number,
          businessName: dealer.business_name
        }
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid email or password' }, { status: 401 });
  } catch (err: any) {
    console.error('Login error details:', {
      message: err.message,
      code: err.code,
      detail: err.detail
    });
    return NextResponse.json({ 
      success: false, 
      message: 'Server error: ' + (err.message || 'Database connection failed'),
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}