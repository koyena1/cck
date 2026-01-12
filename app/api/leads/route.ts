import { NextResponse } from 'next/server';
import sql from 'mssql';

const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER || 'localhost',
  options: { encrypt: true, trustServerCertificate: true },
};

export async function GET() {
  try {
    let pool = await sql.connect(sqlConfig);
    const result = await pool.request()
      .query('SELECT * FROM CustomerLeads ORDER BY CreatedAt DESC');
    return NextResponse.json(result.recordset);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
  }
}