import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER || 'localhost',
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();
    let pool = await sql.connect(sqlConfig);
    
    // Insert new admin into the database
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .query('INSERT INTO Admins (Username, Email, PasswordHash) VALUES (@name, @email, @password)');

    return NextResponse.json({ success: true, message: 'Admin registered successfully' });
  } catch (err) {
    console.error("Registration Error:", err);
    return NextResponse.json(
      { success: false, message: 'Email already exists or database error' }, 
      { status: 500 }
    );
  }
}