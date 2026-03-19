import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { calculateDistance } from '@/lib/distance-calculator';
import { acceptOrderTask, ensureOrderTaskAcceptanceColumns, formatAcceptanceSummary } from '@/lib/order-task-acceptance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const district = searchParams.get('district');
    const includeAll = searchParams.get('includeAll') === 'true';

    if (!orderId || !district) {
      return NextResponse.json({ success: false, error: 'orderId and district are required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureOrderTaskAcceptanceColumns(pool);

    const accessCheck = await pool.query(
      `SELECT o.order_id, o.assigned_dealer_id, o.pincode, d.latitude AS ref_lat, d.longitude AS ref_lng
       FROM orders o
       JOIN pincode_master pm ON pm.pincode = o.pincode
       LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
       WHERE o.order_id = $1
         AND pm.district = $2`,
      [orderId, district]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found in your district' }, { status: 404 });
    }

    const order = accessCheck.rows[0];
    const contactedResult = await pool.query(
      `SELECT dealer_id FROM dealer_order_requests WHERE order_id = $1`,
      [orderId]
    );
    const contactedIds: number[] = contactedResult.rows.map((row: any) => row.dealer_id);

    const dealersResult = await pool.query(
      `SELECT
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
         AND LOWER(COALESCE(district, '')) = LOWER($1)
         ${!includeAll && contactedIds.length > 0 ? `AND dealer_id != ALL($2::INTEGER[])` : ''}`,
      !includeAll && contactedIds.length > 0 ? [district, contactedIds] : [district]
    );

    const refLat = parseFloat(order.ref_lat);
    const refLng = parseFloat(order.ref_lng);

    const withDistance = dealersResult.rows.map((dealer: any) => {
      let distance_km: number | null = null;
      if (!isNaN(refLat) && !isNaN(refLng) && dealer.latitude && dealer.longitude) {
        distance_km = calculateDistance(
          { latitude: refLat, longitude: refLng },
          { latitude: parseFloat(dealer.latitude), longitude: parseFloat(dealer.longitude) }
        );
      }
      return { ...dealer, distance_km, already_contacted: contactedIds.includes(dealer.dealer_id) };
    });

    withDistance.sort((a: any, b: any) => {
      if (a.distance_km === null && b.distance_km === null) return 0;
      if (a.distance_km === null) return 1;
      if (b.distance_km === null) return -1;
      return a.distance_km - b.distance_km;
    });

    return NextResponse.json({ success: true, dealers: withDistance });
  } catch (error: any) {
    console.error('Error fetching district dealers for reassignment:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { orderId, dealerId, district, actorName, username } = await request.json();

    if (!orderId || !dealerId || !district) {
      return NextResponse.json({ success: false, error: 'orderId, dealerId and district are required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureOrderTaskAcceptanceColumns(pool);

    const accessCheck = await pool.query(
      `SELECT 1
       FROM orders o
       JOIN pincode_master pm ON pm.pincode = o.pincode
       WHERE o.order_id = $1
         AND pm.district = $2`,
      [orderId, district]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found in your district' }, { status: 403 });
    }

    const dealerScope = await pool.query(
      `SELECT unique_dealer_id
       FROM dealers
       WHERE dealer_id = $1
         AND LOWER(COALESCE(district, '')) = LOWER($2)`,
      [dealerId, district]
    );

    if (dealerScope.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Dealer not found in your district' }, { status: 404 });
    }

    const settingsResult = await pool.query(
      `SELECT setting_value FROM order_allocation_settings WHERE setting_key = 'dealer_response_timeout_hours'`
    );
    const timeoutHours = parseInt(settingsResult.rows[0]?.setting_value || '6', 10);
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + timeoutHours);

    const seqResult = await pool.query(
      `SELECT COALESCE(MAX(request_sequence), 0) + 1 AS next_seq
       FROM dealer_order_requests WHERE order_id = $1`,
      [orderId]
    );
    const nextSeq = seqResult.rows[0].next_seq;

    await pool.query('BEGIN');
    try {
      const acceptance = await acceptOrderTask(pool, {
        orderId,
        actorPortal: 'district',
        actorName: actorName || 'District Manager',
        actorDetails: { district, username: username || null },
      });

      if (!acceptance.accepted) {
        await pool.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          error: `Task already accepted by ${formatAcceptanceSummary(acceptance.existing)}`,
          alreadyAcceptedBy: acceptance.existing,
        }, { status: 409 });
      }

      await pool.query(
        `UPDATE dealer_order_requests
         SET request_status = 'reassigned'
         WHERE order_id = $1
           AND request_status = 'accepted'
           AND dealer_id != $2`,
        [orderId, dealerId]
      );

      await pool.query(
        `INSERT INTO dealer_order_requests (
           order_id, dealer_id, request_sequence, stock_verified, stock_available, response_deadline
         ) VALUES ($1, $2, $3, false, false, $4)
         ON CONFLICT (order_id, dealer_id) DO NOTHING`,
        [orderId, dealerId, nextSeq, responseDeadline]
      );

      await pool.query(
        `UPDATE orders
         SET assigned_dealer_id = $1,
             assigned_at = CURRENT_TIMESTAMP,
             status = 'Awaiting Dealer Confirmation'
         WHERE order_id = $2`,
        [dealerId, orderId]
      );

      const newDealerUid = dealerScope.rows[0]?.unique_dealer_id;
      if (newDealerUid) {
        await pool.query(
          `UPDATE orders
           SET order_number = CASE
             WHEN order_number ~ '^PR-[0-9]{6}-[0-9]+-[0-9]+$'
               THEN REGEXP_REPLACE(order_number, '-[0-9]+$', '') || '-' || $1
             ELSE order_number || '-' || $1
           END
           WHERE order_id = $2
             AND order_number NOT LIKE '%-' || $1`,
          [newDealerUid, orderId]
        );
      }

      await pool.query(
        `INSERT INTO order_status_history (order_id, status, remarks, created_at)
         VALUES ($1, 'Awaiting Dealer Confirmation', $2, CURRENT_TIMESTAMP)`,
        [orderId, `Manually reassigned by district manager (${district})`]
      );

      await pool.query(
        `INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
         VALUES ($1, $2, 'request_sent', 'District manager manually reassigned order to dealer', $3)`,
        [orderId, dealerId, JSON.stringify({ sequence: nextSeq, reason: 'district_manual_reassign', district })]
      );

      await pool.query('COMMIT');
      return NextResponse.json({ success: true, message: 'Order reassigned successfully' });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    console.error('Error reassigning district order:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}