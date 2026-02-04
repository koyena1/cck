import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, name, email, password, username } = body;
    const pool = getPool();

    // Only allow dealer and admin registration
    if (role === 'dealer') {
      await pool.query(
        `INSERT INTO dealers (full_name, email, phone_number, business_name, business_address, gstin, registration_number, password_hash, status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [name, email, body.phone, body.businessName || null, body.businessLocation || null, body.gstNumber || null, body.registrationNumber || null, password, 'Pending Approval']
      );
      
      return NextResponse.json({ success: true, requiresApproval: true, message: 'Dealer registration submitted. Waiting for admin approval.' });

    } else if (role === 'admin') {
      // Use username from body for admin registration
      const adminUsername = username || name;
      await pool.query(
        'INSERT INTO admins (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        [adminUsername, email, password, body.adminRole || 'admin']
      );
      
      return NextResponse.json({ success: true, message: 'Admin account created successfully' });
    }

    return NextResponse.json({ success: false, message: 'Invalid role. Only dealer and admin registration allowed.' }, { status: 400 });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ success: false, message: err.message || 'Database error or user already exists' }, { status: 500 });
  }
}