import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER || 'localhost',
  options: { encrypt: true, trustServerCertificate: true },
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { role, name, email, password } = body;
    let pool = await sql.connect(sqlConfig);

    if (role === 'customer') {
      await pool.request()
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, body.phone)
        .input('pass', sql.NVarChar, password)
        .query('INSERT INTO Customers (FullName, Email, PhoneNumber, PasswordHash) VALUES (@name, @email, @phone, @pass)');
      
      return NextResponse.json({ success: true, message: 'Customer registered' });

    } else if (role === 'dealer') {
      await pool.request()
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, email)
        .input('phone', sql.NVarChar, body.phone)
        .input('bizName', sql.NVarChar, body.businessName)
        .input('loc', sql.NVarChar, body.businessLocation)
        .input('gst', sql.NVarChar, body.gstNumber)
        .input('regNo', sql.NVarChar, body.registrationNumber)
        .input('pass', sql.NVarChar, password)
        .query(`
          INSERT INTO Dealers (FullName, Email, PhoneNumber, BusinessName, BusinessAddress, GSTIN, RegistrationNumber, PasswordHash, Status) 
          VALUES (@name, @email, @phone, @bizName, @loc, @gst, @regNo, @pass, 'Pending Approval')
        `);
      
      return NextResponse.json({ success: true, requiresApproval: true });

    } else if (role === 'admin') {
      await pool.request()
        .input('name', sql.NVarChar, name)
        .input('email', sql.NVarChar, email)
        .input('pass', sql.NVarChar, password)
        .query('INSERT INTO Admins (Username, Email, PasswordHash) VALUES (@name, @email, @pass)');
      
      return NextResponse.json({ success: true, message: 'Admin created' });
    }

    return NextResponse.json({ success: false, message: 'Invalid role' }, { status: 400 });
  } catch (err) {
    console.error("Auth Error:", err);
    return NextResponse.json({ success: false, message: 'Database error or user exists' }, { status: 500 });
  }
}