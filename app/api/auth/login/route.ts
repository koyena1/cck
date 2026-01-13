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
    const { email, password } = await request.json();
    let pool = await sql.connect(sqlConfig);
    
    // 1. First, check for Admin credentials (for your admin@gmail.com account)
    let result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Admins WHERE Email = @email');

    let user = result.recordset[0];

    if (user && user.PasswordHash === password) {
      return NextResponse.json({ 
        success: true, 
        role: 'admin', 
        message: 'Admin login successful' 
      });
    }

    // 2. If no admin found, check for Dealer credentials
    result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM Dealers WHERE Email = @email');

    user = result.recordset[0];

    if (user && user.PasswordHash === password) {
      return NextResponse.json({ 
        success: true, 
        role: 'dealer', 
        message: 'Dealer login successful' 
      });
    }

    // 3. If neither, return error
    return NextResponse.json(
      { success: false, message: 'Invalid credentials' }, 
      { status: 401 }
    );

  } catch (err) {
    console.error("Database Error:", err);
    return NextResponse.json(
      { success: false, message: 'Could not connect to database' }, 
      { status: 500 }
    );
  }
}