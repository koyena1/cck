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
    const { email, password } = await request.json();
    
    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "Email and password are required" 
      }, { status: 400 });
    }

    let pool = await sql.connect(sqlConfig);
    
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .input('password', sql.NVarChar, password)
      .query('SELECT * FROM Dealers WHERE Email = @email AND PasswordHash = @password');

    if (result.recordset.length > 0) {
      return NextResponse.json({ success: true, user: result.recordset[0] });
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