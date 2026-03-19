import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Check for expired order requests and auto-escalate
export async function GET(request: Request) {
  try {
    const pool = getPool();

    // Step 1: Find all expired pending requests
    const expiredResult = await pool.query(`
      SELECT dor.*, o.order_number, o.customer_pincode, o.pincode
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      WHERE dor.request_status = 'pending'
        AND dor.response_deadline < NOW()
    `);

    const expiredRequests = expiredResult.rows;
    const escalatedOrders = [];
    const adminEscalatedOrders = [];

    console.log(`Found ${expiredRequests.length} expired requests`);

    // Process each expired request
    for (const request of expiredRequests) {
      await pool.query('BEGIN');

      try {
        // Mark request as expired
        await pool.query(`
          UPDATE dealer_order_requests
          SET request_status = 'expired',
              expired_at = CURRENT_TIMESTAMP
          WHERE id = $1
        `, [request.id]);

        // Record expiry in status history
        await pool.query(`
          INSERT INTO order_status_history (order_id, status, remarks, created_at)
          VALUES ($1, 'Dealer Timeout', $2, CURRENT_TIMESTAMP)
        `, [request.order_id,
          `Dealer #${request.dealer_id} did not respond within the deadline`]);

        // Log expiration
        await pool.query(`
          INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
          VALUES ($1, $2, 'expired', 'Dealer request expired - no response within deadline', $3)
        `, [request.order_id, request.dealer_id, JSON.stringify({
          request_id: request.id,
          sequence: request.request_sequence,
          deadline: request.response_deadline
        })]);

        const customerPincode = request.customer_pincode || request.pincode || '';
        const nextSequence = request.request_sequence + 1;

        // Check max attempts
        const maxAttemptsResult = await pool.query(`
          SELECT setting_value FROM order_allocation_settings
          WHERE setting_key = 'max_dealer_attempts'
        `);
        const maxAttempts = parseInt(maxAttemptsResult.rows[0]?.setting_value || '3');

        if (nextSequence > maxAttempts) {
          await pool.query(`
            UPDATE orders SET status = 'Pending Admin Review', assigned_dealer_id = NULL
            WHERE order_id = $1
          `, [request.order_id]);
          await pool.query(`
            INSERT INTO order_status_history (order_id, status, remarks, created_at)
            VALUES ($1, 'Pending Admin Review', 'Maximum dealer attempts reached - manual assignment required', CURRENT_TIMESTAMP)
          `, [request.order_id]);
          await pool.query(`
            INSERT INTO order_allocation_log (order_id, log_type, message, details)
            VALUES ($1, 'escalated_to_admin', 'Max dealer attempts reached - sent to admin', $2)
          `, [request.order_id, JSON.stringify({ max_attempts: maxAttempts })]);
          adminEscalatedOrders.push({ order_id: request.order_id, order_number: request.order_number });
          await pool.query('COMMIT');
          continue;
        }

        // Get all dealers already contacted for this order
        const contactedResult = await pool.query(
          'SELECT dealer_id FROM dealer_order_requests WHERE order_id = $1',
          [request.order_id]
        );
        const contactedIds = contactedResult.rows.map((r: any) => r.dealer_id);

        // Find next nearest active dealer by geographic distance — no service-area filter.
        const nextDealerResult = await pool.query(`
          SELECT
            d.dealer_id, d.business_name, d.unique_dealer_id,
            d.service_pin, d.latitude, d.longitude,
            CASE
              WHEN d.latitude IS NOT NULL AND pm.latitude IS NOT NULL THEN
                ROUND((6371 * acos(LEAST(1,
                  cos(radians(pm.latitude)) * cos(radians(d.latitude::NUMERIC)) *
                  cos(radians(d.longitude::NUMERIC) - radians(pm.longitude)) +
                  sin(radians(pm.latitude)) * sin(radians(d.latitude::NUMERIC))
                )))::NUMERIC, 2)
              ELSE 9999
            END AS distance_km
          FROM dealers d
          LEFT JOIN pincode_master pm ON pm.pincode = $1
          WHERE d.status = 'Active'
            AND d.dealer_id != ALL($2::INTEGER[])
          ORDER BY distance_km ASC
          LIMIT 1
        `, [customerPincode, contactedIds]);

        // Get timeout setting
        const settingsResult = await pool.query(`
          SELECT setting_value FROM order_allocation_settings
          WHERE setting_key = 'dealer_response_timeout_hours'
        `);
        const timeoutHours = parseInt(settingsResult.rows[0]?.setting_value || '6');

        if (nextDealerResult.rows.length > 0) {
          const nextDealer = nextDealerResult.rows[0];
          const nextDeadline = new Date();
          nextDeadline.setHours(nextDeadline.getHours() + timeoutHours);

          await pool.query(`
            INSERT INTO dealer_order_requests (
              order_id, dealer_id, request_sequence,
              stock_verified, stock_available,
              response_deadline, dealer_distance_km, customer_pincode, dealer_service_pin
            )
            VALUES ($1, $2, $3, false, false, $4, $5, $6, $7)
          `, [
            request.order_id, nextDealer.dealer_id, nextSequence,
            nextDeadline, nextDealer.distance_km,
            customerPincode, nextDealer.service_pin
          ]);

          await pool.query(`
            UPDATE orders
            SET assigned_dealer_id = $1,
                assigned_at = CURRENT_TIMESTAMP,
                status = 'Awaiting Dealer Confirmation'
            WHERE order_id = $2
          `, [nextDealer.dealer_id, request.order_id]);

          // Replace dealer UID in order number with the new dealer's UID
          if (nextDealer.unique_dealer_id) {
            await pool.query(`
              UPDATE orders
              SET order_number = CASE
                WHEN order_number ~ '^PR-[0-9]{6}-[0-9]+-[0-9]+$'
                  THEN REGEXP_REPLACE(order_number, '-[0-9]+$', '') || '-' || $1
                ELSE order_number || '-' || $1
              END
              WHERE order_id = $2
                AND order_number NOT LIKE '%-' || $1
            `, [nextDealer.unique_dealer_id, request.order_id]);
          }

          await pool.query(`
            INSERT INTO order_status_history (order_id, status, remarks, created_at)
            VALUES ($1, 'Awaiting Dealer Confirmation', $2, CURRENT_TIMESTAMP)
          `, [request.order_id,
            `Auto-escalated to #${nextDealer.unique_dealer_id} ${nextDealer.business_name} (${nextDealer.distance_km} km) after dealer timeout`]);

          await pool.query(`
            INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
            VALUES ($1, $2, 'request_sent', 'Order auto-escalated to next nearest dealer after timeout', $3)
          `, [request.order_id, nextDealer.dealer_id, JSON.stringify({
            sequence: nextSequence,
            previous_dealer_id: request.dealer_id,
            distance_km: nextDealer.distance_km,
            reason: 'timeout_expired'
          })]);

          escalatedOrders.push({
            order_id: request.order_id,
            order_number: request.order_number,
            from_dealer_id: request.dealer_id,
            to_dealer_id: nextDealer.dealer_id,
            to_dealer_name: nextDealer.business_name,
            distance_km: nextDealer.distance_km
          });

        } else {
          // No more dealers in area - escalate to admin
          await pool.query(`
            UPDATE orders SET status = 'Pending Admin Review', assigned_dealer_id = NULL
            WHERE order_id = $1
          `, [request.order_id]);

          await pool.query(`
            INSERT INTO order_status_history (order_id, status, remarks, created_at)
            VALUES ($1, 'Pending Admin Review', 'No more available dealers in area - manual assignment required', CURRENT_TIMESTAMP)
          `, [request.order_id]);

          await pool.query(`
            INSERT INTO order_allocation_log (order_id, log_type, message, details)
            VALUES ($1, 'escalated_to_admin', 'No more dealers available after timeout - sent to admin', $2)
          `, [request.order_id, JSON.stringify({
            dealers_tried: contactedIds.length,
            last_dealer_id: request.dealer_id,
            customer_pincode: customerPincode
          })]);

          adminEscalatedOrders.push({
            order_id: request.order_id,
            order_number: request.order_number,
            dealers_tried: contactedIds.length
          });
        }

        await pool.query('COMMIT');

      } catch (error) {
        await pool.query('ROLLBACK');
        console.error(`Error processing expired request ${request.id}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: expiredRequests.length,
      escalated_to_dealers: escalatedOrders.length,
      escalated_to_admin: adminEscalatedOrders.length,
      escalations: escalatedOrders,
      admin_escalations: adminEscalatedOrders,
      message: `Processed ${expiredRequests.length} expired requests`
    });

  } catch (error: any) {
    console.error('Error processing expired requests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process expired requests' },
      { status: 500 }
    );
  }
}
