import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get('district');

    if (!district) {
      return NextResponse.json(
        { success: false, error: 'District parameter is required' },
        { status: 400 }
      );
    }

    // Fetch all dealers in the specified district
    const result = await pool.query(
      `SELECT 
        dealer_id,
        full_name,
        email,
        phone_number,
        business_name,
        business_address,
        location,
        district,
        state,
        status,
        unique_dealer_id,
        gstin,
        rating,
        completed_jobs,
        serviceable_pincodes,
        created_at
      FROM dealers
      WHERE LOWER(TRIM(COALESCE(district, ''))) = LOWER(TRIM($1))
      ORDER BY created_at DESC`,
      [district]
    );

    return NextResponse.json({
      success: true,
      dealers: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Failed to fetch dealers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const district = body?.district;
    const action = body?.action;

    if (!district) {
      return NextResponse.json({ success: false, error: 'District is required' }, { status: 400 });
    }

    if (action !== 'next-uid') {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }

    const maxResult = await pool.query(
      `SELECT unique_dealer_id FROM dealers
       WHERE unique_dealer_id ~ '^[0-9]+$'
       ORDER BY CAST(unique_dealer_id AS INTEGER) DESC
       LIMIT 1`
    );
    const maxId = maxResult.rows.length > 0 ? parseInt(maxResult.rows[0].unique_dealer_id) : 100;
    const nextId = String(maxId + 1);

    return NextResponse.json({ success: true, nextUniqueId: nextId });
  } catch (error) {
    console.error('Failed to generate district next dealer unique ID:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate next unique ID' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { dealerId, status, uniqueDealerId, district } = await req.json();

    if (!dealerId || !status || !district) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID, status, and district are required' },
        { status: 400 }
      );
    }

    const dealerScope = await pool.query(
      `SELECT dealer_id, district FROM dealers WHERE dealer_id = $1`,
      [dealerId]
    );

    if (dealerScope.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
    }

    if ((dealerScope.rows[0].district || '').trim().toLowerCase() !== String(district).trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'Access denied: dealer is outside your district' },
        { status: 403 }
      );
    }

    if (status === 'Active') {
      let finalUniqueId = uniqueDealerId;

      if (!finalUniqueId) {
        const maxResult = await pool.query(
          `SELECT unique_dealer_id FROM dealers
           WHERE unique_dealer_id ~ '^[0-9]+$'
           ORDER BY CAST(unique_dealer_id AS INTEGER) DESC
           LIMIT 1`
        );
        const maxId = maxResult.rows.length > 0 ? parseInt(maxResult.rows[0].unique_dealer_id) : 100;
        finalUniqueId = String(maxId + 1);
      }

      const duplicateCheck = await pool.query(
        `SELECT dealer_id FROM dealers WHERE unique_dealer_id = $1 AND dealer_id != $2`,
        [finalUniqueId, dealerId]
      );

      if (duplicateCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: `Unique Dealer ID "${finalUniqueId}" is already taken.` },
          { status: 409 }
        );
      }

      const updated = await pool.query(
        `UPDATE dealers SET status = $1, unique_dealer_id = $2 WHERE dealer_id = $3 RETURNING *`,
        [status, finalUniqueId, dealerId]
      );

      return NextResponse.json({ success: true, dealer: updated.rows[0], assignedUniqueId: finalUniqueId });
    }

    const updated = await pool.query(
      `UPDATE dealers SET status = $1 WHERE dealer_id = $2 RETURNING *`,
      [status, dealerId]
    );

    return NextResponse.json({ success: true, dealer: updated.rows[0] });
  } catch (error) {
    console.error('Failed to update district dealer status:', error);
    return NextResponse.json({ success: false, error: 'Failed to update dealer status' }, { status: 500 });
  }
}
