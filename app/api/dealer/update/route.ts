import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// PUT - Update dealer information
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      dealerId,
      full_name,
      business_name,
      email,
      phone,
      address,
      location,
      gst_number,
      registration_number
    } = body;

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Update dealer information
    const updateQuery = `
      UPDATE dealers
      SET 
        full_name = COALESCE($1, full_name),
        business_name = COALESCE($2, business_name),
        email = COALESCE($3, email),
        phone_number = COALESCE($4, phone_number),
        business_address = COALESCE($5, business_address),
        location = COALESCE($6, location),
        gstin = COALESCE($7, gstin),
        registration_number = COALESCE($8, registration_number)
      WHERE dealer_id = $9 AND status = 'Active'
      RETURNING 
        dealer_id,
        full_name,
        business_name,
        email,
        phone_number,
        business_address,
        location,
        gstin,
        registration_number,
        status,
        rating,
        completed_jobs,
        created_at
    `;

    const result = await pool.query(updateQuery, [
      full_name || null,
      business_name || null,
      email || null,
      phone || null,
      address || null,
      location || null,
      gst_number || null,
      registration_number || null,
      dealerId
    ]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer not found or not active' },
        { status: 404 }
      );
    }

    // Map database columns to frontend-expected field names
    const dealerData = result.rows[0];
    const dealer = {
      dealer_id: dealerData.dealer_id,
      full_name: dealerData.full_name,
      business_name: dealerData.business_name,
      email: dealerData.email,
      phone: dealerData.phone_number,
      address: dealerData.business_address,
      location: dealerData.location,
      gst_number: dealerData.gstin,
      registration_number: dealerData.registration_number,
      status: dealerData.status,
      rating: dealerData.rating,
      completed_jobs: dealerData.completed_jobs,
      created_at: dealerData.created_at
    };

    return NextResponse.json({
      success: true,
      dealer,
      message: 'Profile updated successfully'
    });

  } catch (error: any) {
    console.error('Error updating dealer profile:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
