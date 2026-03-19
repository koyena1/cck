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
      district,
      state,
      pincode,
      serviceable_pincodes,
      gst_number,
      registration_number,
      latitude,
      longitude
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
        district = COALESCE($7, district),
        state = COALESCE($8, state),
        pincode = COALESCE($9, pincode),
        serviceable_pincodes = COALESCE($10, serviceable_pincodes),
        gstin = COALESCE($11, gstin),
        registration_number = COALESCE($12, registration_number),
        latitude = COALESCE($13, latitude),
        longitude = COALESCE($14, longitude)
      WHERE dealer_id = $15 AND status = 'Active'
      RETURNING 
        dealer_id,
        full_name,
        business_name,
        email,
        phone_number,
        business_address,
        location,
        district,
        state,
        pincode,
        serviceable_pincodes,
        gstin,
        registration_number,
        latitude,
        longitude,
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
      district || null,
      state || null,
      pincode || null,
      serviceable_pincodes || null,
      gst_number || null,
      registration_number || null,
      latitude !== undefined ? latitude : null,
      longitude !== undefined ? longitude : null,
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
      district: dealerData.district,
      state: dealerData.state,
      pincode: dealerData.pincode,
      serviceable_pincodes: dealerData.serviceable_pincodes || '',
      gst_number: dealerData.gstin,
      registration_number: dealerData.registration_number,
      latitude: dealerData.latitude,
      longitude: dealerData.longitude,
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
