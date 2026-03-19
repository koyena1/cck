import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

const PROGRESS_FLOW = [
  'In Progress',
  'Order Packing Done',
  'Order Dispatch',
  'Order Delivery Done',
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderId = parseInt(searchParams.get('orderId') || '0');
  if (!orderId) {
    return NextResponse.json({ success: false, error: 'orderId required' }, { status: 400 });
  }

  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT opu.*,
              d.business_name AS dealer_name,
              COALESCE(d.unique_dealer_id, LPAD(d.dealer_id::TEXT, 3, '0')) AS dealer_uid
       FROM order_progress_updates opu
       LEFT JOIN dealers d ON d.dealer_id = opu.dealer_id
       WHERE opu.order_id = $1
       ORDER BY opu.created_at ASC`,
      [orderId]
    );
    return NextResponse.json({ success: true, updates: result.rows });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { orderId, dealerId, statusLabel, notes, estimatedDays } = body;

  if (!orderId || !dealerId || !statusLabel) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
  }

  const pool = getPool();
  try {
    // Prevent update if already delivery done
    const check = await pool.query(
      'SELECT id FROM order_progress_updates WHERE order_id = $1 AND is_delivery_done = true',
      [orderId]
    );
    if (check.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Order already marked as delivery done. No further updates allowed.' },
        { status: 400 }
      );
    }

    // Enforce strict step-by-step sequence
    const lastUpdateResult = await pool.query(
      `SELECT status_label
       FROM order_progress_updates
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId]
    );

    const lastLabel = lastUpdateResult.rows[0]?.status_label || null;
    const lastIndex = lastLabel ? PROGRESS_FLOW.indexOf(lastLabel) : -1;
    const expectedIndex = Math.max(0, lastIndex + 1);
    const expectedLabel = PROGRESS_FLOW[Math.min(expectedIndex, PROGRESS_FLOW.length - 1)];

    if (statusLabel !== expectedLabel) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid status sequence. Next allowed status is "${expectedLabel}".`,
          nextAllowedStatus: expectedLabel,
        },
        { status: 400 }
      );
    }

    const isFlowDeliveryDone = statusLabel === 'Order Delivery Done';

    // Insert progress update
    const result = await pool.query(
      `INSERT INTO order_progress_updates (order_id, dealer_id, status_label, notes, estimated_days, is_delivery_done)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [orderId, dealerId, statusLabel, notes || null, estimatedDays || null, isFlowDeliveryDone]
    );

    const remark = isFlowDeliveryDone
      ? `Delivery completed by dealer.${notes ? ' ' + notes : ''}`
      : `[Dealer Update] ${statusLabel}${notes ? ': ' + notes : ''}${estimatedDays ? `. ETA: ${estimatedDays} day(s)` : ''}`;

    if (isFlowDeliveryDone) {
      // Close the order
      await pool.query(
        `UPDATE orders SET status = 'Completed', updated_at = NOW() WHERE order_id = $1`,
        [orderId]
      );
    } else {
      // Keep order in-progress while intermediate steps are posted
      await pool.query(
        `UPDATE orders SET status = 'In Progress', updated_at = NOW() WHERE order_id = $1`,
        [orderId]
      );
    }

    // Record in status history for admin visibility
    await pool.query(
      `INSERT INTO order_status_history (order_id, status, remarks, updated_by_dealer, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [orderId, isFlowDeliveryDone ? 'Completed' : 'In Progress', remark, dealerId]
    );

    // Notify customer on every dealer status update
    const orderMeta = await pool.query(
      `SELECT order_number, order_token, customer_name, customer_email
       FROM orders
       WHERE order_id = $1
       LIMIT 1`,
      [orderId]
    );

    if (orderMeta.rows.length > 0) {
      const o = orderMeta.rows[0];
      if (o.customer_email && o.order_token) {
        const emailStatus = isFlowDeliveryDone ? 'Order Delivery Done' : statusLabel;
        const emailMessage = notes
          ? `${statusLabel}: ${notes}`
          : `${statusLabel}${estimatedDays ? ` (Estimated completion: ${estimatedDays} day(s))` : ''}`;

        try {
          await sendOrderStatusUpdateEmail(
            o.customer_email,
            o.customer_name || 'Customer',
            o.order_number,
            o.order_token,
            emailStatus,
            emailMessage
          );
        } catch (emailError) {
          console.error('Failed to send progress status email:', emailError);
        }
      }
    }

    return NextResponse.json({ success: true, update: result.rows[0] });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
