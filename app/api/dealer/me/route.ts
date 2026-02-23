import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch current dealer information
export async function GET(request: Request) {
  try {
    // In a real app, this would come from session/JWT token
    // For now, we'll use a header or default to dealer_id from query params
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId') || request.headers.get('x-dealer-id');

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID not provided' },
        { status: 400 }
      );
    }

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
        location,
        service_pin,
        status,
        rating,
        completed_jobs,
        created_at
      FROM dealers
      WHERE dealer_id = $1 AND status = 'Active'
    `;

    const result = await pool.query(query, [dealerId]);

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
      service_pin: dealerData.service_pin,
      status: dealerData.status,
      rating: dealerData.rating,
      completed_jobs: dealerData.completed_jobs,
      created_at: dealerData.created_at
    };

    return NextResponse.json({
      success: true,
      dealer
    });

  } catch (error) {
    console.error('Error fetching dealer info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer information' },
      { status: 500 }
    );
  }
}
