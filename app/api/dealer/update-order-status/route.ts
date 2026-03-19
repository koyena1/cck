import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

// POST - Update order status by dealer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, dealerId, status, remarks } = body;

    if (!orderId || !dealerId || !status) {
      return NextResponse.json(
        { success: false, error: 'Order ID, Dealer ID, and Status are required' },
        { status: 400 }
      );
    }

    // Validate status transition
    const validStatuses = ['Allocated', 'In_Transit', 'Delivered', 'Installation_Pending', 'Completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Verify the order belongs to this dealer
    const verifyQuery = 'SELECT order_id FROM orders WHERE order_id = $1 AND assigned_dealer_id = $2';
    const verifyResult = await pool.query(verifyQuery, [orderId, dealerId]);

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not assigned to this dealer' },
        { status: 404 }
      );
    }

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Update order status
      const updateQuery = `
        UPDATE orders 
        SET 
          status = $1,
          updated_at = CURRENT_TIMESTAMP,
          ${status === 'Delivered' ? 'actual_delivery_date = CURRENT_TIMESTAMP,' : ''}
          ${status === 'Completed' ? 'installation_date = CURRENT_TIMESTAMP,' : ''}
          installation_notes = CASE 
            WHEN $2::TEXT IS NOT NULL AND $2::TEXT != '' THEN 
              COALESCE(installation_notes, '') || E'\\n' || '[' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYY-MM-DD HH24:MI') || '] ' || $2::TEXT
            ELSE installation_notes 
          END
        WHERE order_id = $3
        RETURNING order_id, order_number, status
      `;

      const updateResult = await pool.query(updateQuery, [status, remarks || '', orderId]);

      // Fetch customer info for status-update email
      const emailMeta = await pool.query(
        `SELECT order_number, order_token, customer_name, customer_email
         FROM orders
         WHERE order_id = $1
         LIMIT 1`,
        [orderId]
      );

      // Insert into order status history
      const historyQuery = `
        INSERT INTO order_status_history (order_id, status, remarks, updated_by_dealer, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      `;

      await pool.query(historyQuery, [orderId, status, remarks || null, dealerId]);

      // Commit transaction
      await pool.query('COMMIT');

      // Send customer email after successful commit
      if (emailMeta.rows.length > 0) {
        const o = emailMeta.rows[0];
        if (o.customer_email && o.order_token) {
          try {
            await sendOrderStatusUpdateEmail(
              o.customer_email,
              o.customer_name || 'Customer',
              o.order_number,
              o.order_token,
              status,
              remarks || `Your order status is now ${status}.`
            );
          } catch (emailError) {
            console.error('Failed to send dealer status update email:', emailError);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Order status updated successfully',
        order: updateResult.rows[0]
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update order status' },
      { status: 500 }
    );
  }
}
