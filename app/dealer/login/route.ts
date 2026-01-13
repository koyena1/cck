export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
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
  } catch (err) {
    return NextResponse.json({ success: false, message: "Database connection error" }, { status: 500 });
  }
}