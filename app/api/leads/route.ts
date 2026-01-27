import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Get all orders (for admin dashboard)
export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT 
        order_id, order_number, customer_name, customer_phone, 
        order_type, status, total_amount, pincode, city,
        assigned_dealer_id, created_at, expected_delivery_date
      FROM orders 
      ORDER BY created_at DESC`
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Database error in /api/leads:', err);
    return NextResponse.json({ error: 'Failed to fetch orders', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}