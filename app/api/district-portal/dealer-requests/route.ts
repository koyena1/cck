import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

// GET: Fetch dealer order requests for a district
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get('district');

    if (!district) {
      return NextResponse.json(
        { success: false, error: 'District parameter is required' },
        { status: 400 }
      );
    }

    // Fetch all dealer order requests in the specified district
    const result = await pool.query(
      `SELECT 
        dor.id as request_id,
        dor.order_id,
        dor.dealer_id,
        dor.request_status,
        dor.response_deadline,
        dor.dealer_distance_km,
        dor.stock_verified,
        dor.stock_available,
        dor.dealer_response_at,
        dor.dealer_notes,
        dor.created_at,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.installation_address,
        o.pincode,
        o.total_amount,
        o.status as order_status,
        d.business_name as dealer_business_name,
        d.full_name as dealer_name,
        d.phone_number as dealer_phone,
        d.email as dealer_email
      FROM dealer_order_requests dor
      JOIN dealers d ON dor.dealer_id = d.dealer_id
      JOIN orders o ON dor.order_id = o.order_id
      WHERE LOWER(TRIM(COALESCE(d.district, ''))) = LOWER(TRIM($1))
      ORDER BY dor.created_at DESC`,
      [district]
    );

    return NextResponse.json({
      success: true,
      requests: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Failed to fetch dealer requests:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer requests' },
      { status: 500 }
    );
  }
}
