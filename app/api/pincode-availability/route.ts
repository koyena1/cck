import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const pincode = String(request.nextUrl.searchParams.get('pincode') || '').trim();

    if (!/^\d{6}$/.test(pincode)) {
      return NextResponse.json(
        { success: false, error: 'Valid 6-digit pincode is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const result = await pool.query(
      `
        WITH checks AS (
          SELECT
            EXISTS (
              SELECT 1
              FROM dealers d
              WHERE d.status = 'Active'
                AND (
                  COALESCE(CAST(d.service_pin AS TEXT), '') = $1
                  OR $1 = ANY(
                    regexp_split_to_array(
                      regexp_replace(COALESCE(d.serviceable_pincodes, ''), '\\s+', '', 'g'),
                      ','
                    )
                  )
                )
            ) AS dealer_available,
            EXISTS (
              SELECT 1
              FROM pincode_master pm
              WHERE pm.pincode = $1
                AND LOWER(COALESCE(pm.state, '')) = 'west bengal'
            ) AS wb_master_available,
            (
              CAST($1 AS INTEGER) BETWEEN 700000 AND 743999
            ) AS wb_range_available
        )
        SELECT
          dealer_available,
          wb_master_available,
          wb_range_available,
          (dealer_available OR wb_master_available OR wb_range_available) AS available
        FROM checks
      `,
      [pincode]
    );

    const available = Boolean(result.rows[0]?.available);
    return NextResponse.json({
      success: true,
      pincode,
      available,
      message: available ? 'Available' : 'Not Available',
    });
  } catch (error) {
    console.error('Error checking pincode availability:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check pincode availability' },
      { status: 500 }
    );
  }
}
