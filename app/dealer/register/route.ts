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
    const { name, email, phone, password } = await request.json();
    let pool = await sql.connect(sqlConfig);
    
    // Insert the new dealer into the database
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('password', sql.NVarChar, password) // Note: In production, hash this password
      .query('INSERT INTO Dealers (FullName, Email, PhoneNumber, PasswordHash) VALUES (@name, @email, @phone, @password)');

    return NextResponse.json({ success: true, message: "Dealer registered successfully" });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Registration failed" }, { status: 500 });
  }
}