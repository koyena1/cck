import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch all dealers
export async function GET() {
  try {
    const pool = getPool();
    const query = `
      SELECT 
        dealer_id,
        full_name,
        email,
        phone_number,
        business_name,
        business_address,
        gstin,
        registration_number,
        serviceable_pincodes,
        location,
        status,
        unique_dealer_id,
        rating,
        completed_jobs,
        created_at
      FROM dealers
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      dealers: result.rows
    });
  } catch (error) {
    console.error('Error fetching dealers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}

// GET next available auto unique dealer ID (e.g. "003")
export async function GET_next_uid() {
  // Helper - not exported as route, called internally
}

// PATCH - Update dealer status (supports uniqueDealerId assignment on approval)
export async function PATCH(request: Request) {
  try {
    const { dealerId, status, uniqueDealerId } = await request.json();
    
    if (!dealerId || !status) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID and status are required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // If approving, handle unique dealer ID
    if (status === 'Active') {
      let finalUniqueId = uniqueDealerId;

      if (!finalUniqueId) {
        // Auto-generate: find the highest existing numeric unique_dealer_id and increment
        const maxResult = await pool.query(
          `SELECT unique_dealer_id FROM dealers 
           WHERE unique_dealer_id ~ '^[0-9]+$' 
           ORDER BY CAST(unique_dealer_id AS INTEGER) DESC 
           LIMIT 1`
        );
        const maxId = maxResult.rows.length > 0 ? parseInt(maxResult.rows[0].unique_dealer_id) : 100;
        finalUniqueId = String(maxId + 1);
      }

      // Check uniqueness
      const dupCheck = await pool.query(
        `SELECT dealer_id FROM dealers WHERE unique_dealer_id = $1 AND dealer_id != $2`,
        [finalUniqueId, dealerId]
      );
      if (dupCheck.rows.length > 0) {
        return NextResponse.json(
          { success: false, error: `Unique Dealer ID "${finalUniqueId}" is already taken. Please choose another.` },
          { status: 409 }
        );
      }

      const result = await pool.query(
        `UPDATE dealers SET status = $1, unique_dealer_id = $2 WHERE dealer_id = $3 RETURNING *`,
        [status, finalUniqueId, dealerId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
      }

      return NextResponse.json({ success: true, dealer: result.rows[0], assignedUniqueId: finalUniqueId });
    }

    // For reject or other status changes (no unique ID needed)
    const result = await pool.query(
      `UPDATE dealers SET status = $1 WHERE dealer_id = $2 RETURNING *`,
      [status, dealerId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, dealer: result.rows[0] });
  } catch (error) {
    console.error('Error updating dealer status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dealer status' },
      { status: 500 }
    );
  }
}

// GET next auto unique dealer ID as a separate helper endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.action !== 'next-uid') {
      return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
    }
    const pool = getPool();
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
    console.error('Error getting next unique dealer ID:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate next unique ID' }, { status: 500 });
  }
}
