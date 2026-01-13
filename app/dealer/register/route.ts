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
    const { name, email, phone, businessName, gstin, location, password } = await request.json();
    
    // Validate required fields
    if (!name || !email || !phone || !businessName || !gstin || !location || !password) {
      return NextResponse.json({ 
        success: false, 
        message: "All fields are required" 
      }, { status: 400 });
    }

    let pool = await sql.connect(sqlConfig);
    
    // Check if email already exists
    const checkResult = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT Email FROM Dealers WHERE Email = @email');

    if (checkResult.recordset.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: "Email already registered" 
      }, { status: 409 });
    }
    
    // Insert the new dealer into the database
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('email', sql.NVarChar, email)
      .input('phone', sql.NVarChar, phone)
      .input('businessName', sql.NVarChar, businessName)
      .input('gstin', sql.NVarChar, gstin)
      .input('location', sql.NVarChar, location)
      .input('password', sql.NVarChar, password)
      .query('INSERT INTO Dealers (FullName, Email, PhoneNumber, BusinessName, GSTIN, Location, PasswordHash) VALUES (@name, @email, @phone, @businessName, @gstin, @location, @password)');

    return NextResponse.json({ success: true, message: "Dealer registered successfully" });
  } catch (err: any) {
    console.error("Registration Error:", err);
    return NextResponse.json({ 
      success: false, 
      message: err.message || "Registration failed. Please try again." 
    }, { status: 500 });
  }
}