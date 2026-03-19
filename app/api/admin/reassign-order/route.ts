import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { calculateDistance } from '@/lib/distance-calculator';
import { acceptOrderTask, ensureOrderTaskAcceptanceColumns, formatAcceptanceSummary } from '@/lib/order-task-acceptance';

/**
 * GET  /api/admin/reassign-order?orderId=X
 *   Returns available dealers sorted by distance from the currently-assigned
 *   (declined) dealer, excluding already-contacted dealers.
 *
 * POST /api/admin/reassign-order
 *   Body: { orderId, dealerId }
 *   Manually reassigns the order to the chosen dealer and updates order_number prefix.
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const includeAll = searchParams.get('includeAll') === 'true';

    if (!orderId) {
      return NextResponse.json({ success: false, error: 'orderId is required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureOrderTaskAcceptanceColumns(pool);

    // Get the order + currently assigned dealer coordinates (used as distance reference)
    const orderResult = await pool.query(`
      SELECT 
        o.order_id,
        o.assigned_dealer_id,
        o.pincode,
        d.latitude  AS ref_lat,
        d.longitude AS ref_lng
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // IDs of dealers already contacted for this order
    const contactedResult = await pool.query(`
      SELECT dealer_id FROM dealer_order_requests WHERE order_id = $1
    `, [orderId]);
    const contactedIds: number[] = contactedResult.rows.map((r: any) => r.dealer_id);

    // When includeAll=true (admin View Details manual assign), return ALL active dealers
    // When false (decline flow), exclude already-contacted dealers
    const dealersResult = await pool.query(`
      SELECT 
        dealer_id,
        full_name,
        business_name,
        unique_dealer_id,
        COALESCE(unique_dealer_id, LPAD(dealer_id::TEXT, 3, '0')) AS display_uid,
        phone_number,
        location,
        latitude,
        longitude
      FROM dealers
      WHERE status = 'Active'
        ${!includeAll && contactedIds.length > 0 ? `AND dealer_id != ALL($1::INTEGER[])` : ''}
    `, (!includeAll && contactedIds.length > 0) ? [contactedIds] : []);

    const dealers = dealersResult.rows;

    // Sort by distance from the assigned dealer (if we have coordinates)
    const refLat = parseFloat(order.ref_lat);
    const refLng = parseFloat(order.ref_lng);

    const withDistance = dealers.map((d: any) => {
      let distance_km: number | null = null;
      if (!isNaN(refLat) && !isNaN(refLng) && d.latitude && d.longitude) {
        distance_km = calculateDistance(
          { latitude: refLat, longitude: refLng },
          { latitude: parseFloat(d.latitude), longitude: parseFloat(d.longitude) }
        );
      }
      // Mark whether this dealer was already contacted
      return { ...d, distance_km, already_contacted: contactedIds.includes(d.dealer_id) };
    });

    // Dealers with known distance first, sorted ascending; then those without
    withDistance.sort((a: any, b: any) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });

    return NextResponse.json({ success: true, dealers: withDistance });
  } catch (error: any) {
    console.error('Error fetching dealers for reassignment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { orderId, dealerId } = await request.json();

    if (!orderId || !dealerId) {
      return NextResponse.json({ success: false, error: 'orderId and dealerId are required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureOrderTaskAcceptanceColumns(pool);

    // Get timeout setting
    const settingsResult = await pool.query(`
      SELECT setting_value FROM order_allocation_settings WHERE setting_key = 'dealer_response_timeout_hours'
    `);
    const timeoutHours = parseInt(settingsResult.rows[0]?.setting_value || '6');
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + timeoutHours);

    // Next sequence number for this order
    const seqResult = await pool.query(`
      SELECT COALESCE(MAX(request_sequence), 0) + 1 AS next_seq
      FROM dealer_order_requests WHERE order_id = $1
    `, [orderId]);
    const nextSeq = seqResult.rows[0].next_seq;

    await pool.query('BEGIN');
    try {
      const acceptance = await acceptOrderTask(pool, {
        orderId,
        actorPortal: 'admin',
        actorName: 'Protechtur Admin',
        actorDetails: { source: 'admin-orders' },
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

      // Mark any previously accepted dealer as reassigned so they lose access
      await pool.query(`
        UPDATE dealer_order_requests
        SET request_status = 'reassigned'
        WHERE order_id = $1
          AND request_status = 'accepted'
          AND dealer_id != $2
      `, [orderId, dealerId]);

      // Insert new dealer request
      await pool.query(`
        INSERT INTO dealer_order_requests (
          order_id, dealer_id, request_sequence,
          stock_verified, stock_available,
          response_deadline
        ) VALUES ($1, $2, $3, false, false, $4)
        ON CONFLICT (order_id, dealer_id) DO NOTHING
      `, [orderId, dealerId, nextSeq, responseDeadline]);

      // Update order
      await pool.query(`
        UPDATE orders
        SET assigned_dealer_id = $1,
            assigned_at = CURRENT_TIMESTAMP,
            status = 'Awaiting Dealer Confirmation'
        WHERE order_id = $2
      `, [dealerId, orderId]);

      // Replace dealer UID in order number with the newly assigned dealer's UID
      const newDealerUidResult = await pool.query(
        'SELECT unique_dealer_id FROM dealers WHERE dealer_id = $1',
        [dealerId]
      );
      const newDealerUid = newDealerUidResult.rows[0]?.unique_dealer_id;
      if (newDealerUid) {
        await pool.query(`
          UPDATE orders
          SET order_number = CASE
            WHEN order_number ~ '^PR-[0-9]{6}-[0-9]+-[0-9]+$'
              THEN REGEXP_REPLACE(order_number, '-[0-9]+$', '') || '-' || $1
            ELSE order_number || '-' || $1
          END
          WHERE order_id = $2
            AND order_number NOT LIKE '%-' || $1
        `, [newDealerUid, orderId]);
      }

      // Record in status history so Admin portal reflects it
      await pool.query(`
        INSERT INTO order_status_history (order_id, status, remarks, created_at)
        VALUES ($1, 'Awaiting Dealer Confirmation', 'Manually reassigned by admin after Protechtur Admin accepted the task', CURRENT_TIMESTAMP)
      `, [orderId]);

      // Log manual reassignment
      await pool.query(`
        INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
        VALUES ($1, $2, 'request_sent', 'Admin manually reassigned order to dealer', $3)
      `, [orderId, dealerId, JSON.stringify({ sequence: nextSeq, reason: 'admin_manual_reassign' })]);

      await pool.query('COMMIT');

      return NextResponse.json({ success: true, message: 'Order reassigned successfully' });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    console.error('Error reassigning order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
