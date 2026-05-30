import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Fetch pincodes for a district (and optional state)
export async function GET(req: NextRequest) {
  try {
    const district = String(req.nextUrl.searchParams.get('district') || '').trim();
    const state = String(req.nextUrl.searchParams.get('state') || '').trim();

    if (!district) {
      return NextResponse.json(
        { success: false, error: 'district is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `SELECT DISTINCT pm.pincode
       FROM pincode_master pm
       WHERE LOWER(TRIM(COALESCE(pm.district, ''))) = LOWER(TRIM($1))
         AND ($2 = '' OR LOWER(TRIM(COALESCE(pm.state, ''))) = LOWER(TRIM($2)))
       ORDER BY pm.pincode ASC`,
      [district, state]
    );

    const pincodes = result.rows.map((row: { pincode: string }) => row.pincode);

    return NextResponse.json({
      success: true,
      pincodes,
    });
  } catch (error) {
    console.error('Failed to fetch district pincodes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch district pincodes' },
      { status: 500 }
    );
  }
}
