import { NextResponse } from 'next/server';
import { getPool, resetPool } from '@/lib/db';

const RECOVERABLE_DB_ERROR_CODES = new Set([
  '57P01', // admin_shutdown
  '57P02', // crash_shutdown
  '57P03', // cannot_connect_now
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE'
]);

async function queryWithReconnect(sql: string, params: any[]) {
  const pool = getPool();

  try {
    return await pool.query(sql, params);
  } catch (err: any) {
    if (!RECOVERABLE_DB_ERROR_CODES.has(err?.code)) {
      throw err;
    }

    console.warn('Transient DB error during login. Recreating pool and retrying once.', {
      code: err?.code,
      message: err?.message
    });

    await resetPool();
    return getPool().query(sql, params);
  }
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const loginId = String(email || '').trim();
    
    if (!loginId || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Email/ID and password are required' 
      }, { status: 400 });
    }

    console.log('Login attempt for:', loginId);
    
    // 1. Check Admin (by email or username)
    let res = await queryWithReconnect(
      `SELECT * FROM admins
       WHERE is_active = true
         AND (
           LOWER(TRIM(email)) = LOWER(TRIM($1))
           OR LOWER(TRIM(username)) = LOWER(TRIM($1))
         )
       LIMIT 1`,
      [loginId]
    );
    console.log('Admin query result:', res.rows.length, 'records found');
    if (res.rows[0] && res.rows[0].password_hash === password) {
      const admin = res.rows[0];
      return NextResponse.json({ 
        success: true, 
        role: 'admin',
        token: `admin_${admin.admin_id}_${Date.now()}`,
        name: admin.username,
        user: {
          id: admin.admin_id,
          name: admin.username,
          email: admin.email,
          adminRole: admin.role
        }
      });
    }

    // 2. Check Dealer by email OR unique_dealer_id
    res = await queryWithReconnect(
      `SELECT * FROM dealers
       WHERE LOWER(TRIM(email)) = LOWER(TRIM($1))
          OR TRIM(COALESCE(unique_dealer_id, '')) = TRIM($1)
       LIMIT 1`,
      [loginId]
    );
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
        token: `dealer_${dealer.dealer_id}_${Date.now()}`,
        user: {
          id: dealer.dealer_id,
          name: dealer.full_name,
          email: dealer.email,
          phone: dealer.phone_number,
          businessName: dealer.business_name
        }
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid email/ID or password' }, { status: 401 });
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