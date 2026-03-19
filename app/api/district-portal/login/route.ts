import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const normalizedUsername = String(username || '').trim();

    if (!normalizedUsername || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Fetch user from database
    const result = await pool.query(
      `SELECT * FROM district_users WHERE LOWER(username) = LOWER($1) AND is_active = true`,
      [normalizedUsername]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    if (!user.password_hash) {
      return NextResponse.json(
        { success: false, error: 'Account is not configured correctly. Contact admin.' },
        { status: 500 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Update last login
    await pool.query(
      'UPDATE district_users SET last_login = CURRENT_TIMESTAMP WHERE district_user_id = $1',
      [user.district_user_id]
    );

    // Activity logging should not block successful login.
    try {
      await pool.query(
        `INSERT INTO district_user_activity_log (district_user_id, activity_type, description, ip_address)
         VALUES ($1, $2, $3, $4)`,
        [
          user.district_user_id,
          'login',
          'User logged in successfully',
          req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
        ]
      );
    } catch (logError) {
      console.warn('District login activity log failed:', logError);
    }

    // Generate simple session token (in production, use JWT or proper session management)
    const token = crypto.randomBytes(32).toString('hex');

    // Return user data (excluding password_hash)
    const userData = {
      district_user_id: user.district_user_id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      phone_number: user.phone_number,
      district: user.district,
      state: user.state,
      can_view_dealers: user.can_view_dealers,
      can_view_orders: user.can_view_orders,
      can_contact_dealers: user.can_contact_dealers
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userData,
      token: token
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
