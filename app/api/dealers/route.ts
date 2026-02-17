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

// PATCH - Update dealer status
export async function PATCH(request: Request) {
  try {
    const { dealerId, status } = await request.json();
    
    if (!dealerId || !status) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID and status are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const query = `
      UPDATE dealers 
      SET status = $1
      WHERE dealer_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [status, dealerId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      dealer: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating dealer status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dealer status' },
      { status: 500 }
    );
  }
}
