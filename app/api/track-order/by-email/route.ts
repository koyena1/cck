import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Fetch all orders for the given email
    const result = await pool.query(
      `SELECT 
        order_id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        installation_address,
        city,
        state,
        pincode,
        total_amount,
        status,
        payment_method,
        payment_status,
        created_at,
        updated_at,
        expected_delivery_date,
        installation_date
      FROM orders 
      WHERE customer_email = $1
      ORDER BY created_at DESC`,
      [email]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows
    });

  } catch (error) {
    console.error('Error fetching orders by email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders', message: 'Database error occurred' },
      { status: 500 }
    );
  }
}
