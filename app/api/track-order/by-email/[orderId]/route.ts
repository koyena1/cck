import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const numericOrderId = parseInt(orderId, 10);
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (Number.isNaN(numericOrderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const pool = getPool();

    const orderResult = await pool.query(
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
      WHERE order_id = $1
        AND customer_email = $2
      LIMIT 1`,
      [numericOrderId, email]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const statusHistoryResult = await pool.query(
      `SELECT
        status,
        COALESCE(NULLIF(TRIM(remarks), ''), 'Status updated.') AS remarks,
        created_at
      FROM order_status_history
      WHERE order_id = $1
      ORDER BY created_at DESC`,
      [numericOrderId]
    );

    const progressUpdatesResult = await pool.query(
      `SELECT
        opu.id,
        opu.status_label,
        opu.notes,
        opu.estimated_days,
        opu.is_delivery_done,
        opu.created_at,
        d.business_name AS dealer_name,
        COALESCE(d.unique_dealer_id, LPAD(d.dealer_id::TEXT, 3, '0')) AS dealer_uid
      FROM order_progress_updates opu
      LEFT JOIN dealers d ON d.dealer_id = opu.dealer_id
      WHERE opu.order_id = $1
      ORDER BY opu.created_at ASC`,
      [numericOrderId]
    );

    return NextResponse.json({
      success: true,
      order: {
        ...orderResult.rows[0],
        statusHistory: statusHistoryResult.rows,
        progressUpdates: progressUpdatesResult.rows,
      },
    });
  } catch (error) {
    console.error('Error fetching order details by email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
