import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password are required" 
      }, { status: 400 });
    }

    const pool = getPool();
    
    const result = await pool.query(
      'SELECT * FROM dealers WHERE email = $1 AND password_hash = $2',
      [email, password]
    );

    if (result.rows.length > 0) {
      return NextResponse.json({ success: true, user: result.rows[0] });
    } else {
      return NextResponse.json({ success: false, message: "Invalid email or password" }, { status: 401 });
    }
  } catch (err: any) {
    console.error("Login Error:", err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || "Database connection error" 
    }, { status: 500 });
  }
}