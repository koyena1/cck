import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER || 'localhost', // This ensures it falls back to localhost
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    let pool = await sql.connect(sqlConfig);
    
    // Check for admin credentials
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Admins WHERE Email = @email');

    const admin = result.recordset[0];

    if (admin && admin.PasswordHash === password) {
      // Logic for successful login
      return NextResponse.json({ success: true, message: 'Login successful' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Invalid Admin credentials' }, 
        { status: 401 }
      );
    }
  } catch (err) {
    console.error("Database Error:", err);
    return NextResponse.json(
      { success: false, message: 'Could not connect to database' }, 
      { status: 500 }
    );
  }
}