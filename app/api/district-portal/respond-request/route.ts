import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
});

// POST: Accept or reject dealer order request
export async function POST(req: Request) {
  try {
    const { requestId, action, notes } = await req.json();

    if (!requestId || !action) {
      return NextResponse.json(
        { success: false, error: 'Request ID and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "accept" or "reject"' },
        { status: 400 }
      );
    }

    // Get request details
    const requestResult = await pool.query(
      `SELECT dor.*, o.order_number, d.business_name
       FROM dealer_order_requests dor
       JOIN orders o ON dor.order_id = o.order_id
       JOIN dealers d ON dor.dealer_id = d.dealer_id
       WHERE dor.id = $1`,
      [requestId]
    );

    if (requestResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }

    const request = requestResult.rows[0];

    // Check if already responded
    if (request.request_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Request already ${request.request_status}` },
        { status: 400 }
      );
    }

    const newStatus = action === 'accept' ? 'accepted' : 'rejected';
    const orderStatus = action === 'accept' ? 'Allocated' : 'Pending';

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Update dealer request
      await pool.query(
        `UPDATE dealer_order_requests
         SET request_status = $1,
             dealer_response_at = CURRENT_TIMESTAMP,
             dealer_notes = $2
         WHERE id = $3`,
        [newStatus, notes || null, requestId]
      );

      // Update order status
      if (action === 'accept') {
        await pool.query(
          `UPDATE orders
           SET status = $1,
               assigned_dealer_id = $2,
               assigned_at = CURRENT_TIMESTAMP
           WHERE order_id = $3`,
          [orderStatus, request.dealer_id, request.order_id]
        );

        // Add status history
        await pool.query(
          `INSERT INTO order_status_history (order_id, status, remarks)
           VALUES ($1, $2, $3)`,
          [request.order_id, orderStatus, `Order accepted by dealer: ${request.business_name}`]
        );
      } else {
        // If rejected, update order status to pending (will be re-allocated)
        await pool.query(
          `UPDATE orders
           SET status = 'Pending',
               assigned_dealer_id = NULL,
               assigned_at = NULL
           WHERE order_id = $1`,
          [request.order_id]
        );

        // Add status history
        await pool.query(
          `INSERT INTO order_status_history (order_id, status, remarks)
           VALUES ($1, $2, $3)`,
          [request.order_id, 'Pending', `Order rejected by dealer: ${request.business_name}. Reason: ${notes || 'Not specified'}`]
        );

        // Log rejection for re-allocation
        await pool.query(
          `INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
           VALUES ($1, $2, 'request_rejected', 'Dealer rejected order request', $3)`,
          [
            request.order_id,
            request.dealer_id,
            JSON.stringify({ reason: notes || 'Not specified', rejected_at: new Date() })
          ]
        );
      }

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Order ${action === 'accept' ? 'accepted' : 'rejected'} successfully`,
        request_status: newStatus,
        order_status: orderStatus
      });

    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Failed to process dealer request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
