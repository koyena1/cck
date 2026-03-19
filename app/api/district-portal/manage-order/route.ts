import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { acceptOrderTask, ensureOrderTaskAcceptanceColumns, formatAcceptanceSummary } from '@/lib/order-task-acceptance';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

// POST: Accept or reject order from district portal
export async function POST(req: Request) {
  try {
    const { orderId, action, notes, districtManagerName, district, username } = await req.json();

    if (!orderId || !action) {
      return NextResponse.json(
        { success: false, error: 'Order ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    await ensureOrderTaskAcceptanceColumns(pool);

    // Get order details
    const orderResult = await pool.query(
      `SELECT o.*, d.business_name as dealer_business_name
       FROM orders o
       LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
       WHERE o.order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    // Start transaction
    await pool.query('BEGIN');

    try {
      if (action === 'accept') {
        const acceptance = await acceptOrderTask(pool, {
          orderId,
          actorPortal: 'district',
          actorName: districtManagerName || username || 'District Manager',
          actorDetails: {
            district: district || null,
            username: username || null,
          },
        });

        if (!acceptance.accepted) {
          await pool.query('ROLLBACK');
          return NextResponse.json(
            {
              success: false,
              error: `Task already accepted by ${formatAcceptanceSummary(acceptance.existing)}`,
              alreadyAcceptedBy: acceptance.existing,
            },
            { status: 409 }
          );
        }

        // Accept order - mark as confirmed/allocated
        const newStatus = order.status === 'Awaiting Dealer Confirmation' ? 'Allocated' : 'Confirmed';
        
        await pool.query(
          `UPDATE orders
           SET status = $1,
               updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $2`,
          [newStatus, orderId]
        );

        // Add status history
        await pool.query(
          `INSERT INTO order_status_history (order_id, status, remarks)
           VALUES ($1, $2, $3)`,
          [orderId, newStatus, `Order accepted by district management (${districtManagerName || username || 'District Manager'}). ${notes || ''}`]
        );

        // Update dealer order request if exists
        await pool.query(
          `UPDATE dealer_order_requests
           SET request_status = 'accepted',
               dealer_response_at = CURRENT_TIMESTAMP,
               dealer_notes = $1
           WHERE order_id = $2 AND request_status = 'pending'`,
          [notes || 'Accepted by district management', orderId]
        );

      } else {
        // Reject order
        await pool.query(
          `UPDATE orders
           SET status = 'Cancelled',
               assigned_dealer_id = NULL,
               assigned_at = NULL,
               updated_at = CURRENT_TIMESTAMP
           WHERE order_id = $1`,
          [orderId]
        );

        // Add status history
        await pool.query(
          `INSERT INTO order_status_history (order_id, status, remarks)
           VALUES ($1, $2, $3)`,
          [orderId, 'Cancelled', `Order rejected by district management. Reason: ${notes || 'Not specified'}`]
        );

        // Update dealer order request if exists
        await pool.query(
          `UPDATE dealer_order_requests
           SET request_status = 'rejected',
               dealer_response_at = CURRENT_TIMESTAMP,
               dealer_notes = $1
           WHERE order_id = $2 AND request_status = 'pending'`,
          [notes || 'Rejected by district management', orderId]
        );

        // Log rejection
        await pool.query(
          `INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
           VALUES ($1, $2, 'district_rejection', 'Order rejected by district management', $3)`,
          [
            orderId,
            order.assigned_dealer_id,
            JSON.stringify({ reason: notes || 'Not specified', rejected_at: new Date() })
          ]
        );
      }

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Order ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
        order_status: action === 'accept' ? 'Allocated' : 'Cancelled'
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Failed to manage order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process order action' },
      { status: 500 }
    );
  }
}
