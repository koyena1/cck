import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, email, phone, businessName, gstin, location, password } = await request.json();
    
    // Validate required fields
    if (!name || !email || !phone || !businessName || !gstin || !location || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "All fields are required" 
      }, { status: 400 });
    }

    const pool = getPool();
    
    // Check if email already exists
    const checkResult = await pool.query(
      'SELECT email FROM dealers WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Email already registered" 
      }, { status: 409 });
    }
    
    // Insert the new dealer into the database
    await pool.query(
      'INSERT INTO dealers (full_name, email, phone_number, business_name, gstin, location, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [name, email, phone, businessName, gstin, location, password]
    );

    return NextResponse.json({ success: true, message: "Dealer registered successfully" });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || "Registration failed. Please try again." 
    }, { status: 500 });
  }
}