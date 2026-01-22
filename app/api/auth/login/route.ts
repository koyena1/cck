export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    let pool = await sql.connect(sqlConfig);

    // 1. Check Admin
    let res = await pool.request().input('e', sql.NVarChar, email).query('SELECT * FROM Admins WHERE Email = @e');
    if (res.recordset[0] && res.recordset[0].PasswordHash === password) {
      return NextResponse.json({ success: true, role: 'admin' });
    }

    // 2. Check Customer
    res = await pool.request().input('e', sql.NVarChar, email).query('SELECT * FROM Customers WHERE Email = @e');
    if (res.recordset[0] && res.recordset[0].PasswordHash === password) {
      return NextResponse.json({ success: true, role: 'customer' });
    }

    // 3. Check Dealer
    res = await pool.request().input('e', sql.NVarChar, email).query('SELECT * FROM Dealers WHERE Email = @e');
    const dealer = res.recordset[0];
    if (dealer && dealer.PasswordHash === password) {
      if (dealer.Status !== 'Approved') {
        return NextResponse.json({ success: false, message: 'Account pending admin approval' }, { status: 403 });
      }
      return NextResponse.json({ success: true, role: 'dealer' });
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}