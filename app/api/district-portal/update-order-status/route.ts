import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status, notes, district } = body;

    if (!orderId || !status || !district) {
      return NextResponse.json(
        { success: false, error: 'Order ID, status and district are required' },
        { status: 400 }
      );
    }

    const accessCheck = await pool.query(
      `SELECT 1
       FROM orders o
       JOIN pincode_master pm ON pm.pincode = o.pincode
       WHERE o.order_id = $1
         AND pm.district = $2
       LIMIT 1`,
      [orderId, district]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found in your district' },
        { status: 403 }
      );
    }

    // Update the order status
    const updateResult = await pool.query(
      `UPDATE orders 
       SET status = $1, 
           updated_at = NOW()
       WHERE order_id = $2
       RETURNING order_id, order_number, status`,
      [status, orderId]
    );

    if (updateResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // If there are notes, log them in order_status_history
    if (notes) {
      await pool.query(
        `INSERT INTO order_status_history (order_id, status, remarks, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [orderId, status, `District Portal (${district}): ${notes}`]
      );
    } else {
      await pool.query(
        `INSERT INTO order_status_history (order_id, status, remarks, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [orderId, status, `Updated by District Portal (${district})`]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully',
      order: updateResult.rows[0]
    });
  } catch (error) {
    console.error('Failed to update order status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status' },
      { status: 500 }
    );
  }
}
