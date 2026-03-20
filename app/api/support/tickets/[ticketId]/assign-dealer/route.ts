import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureSupportTicketTables } from '@/lib/support-ticket';
import { sendSupportTicketBellNotifications } from '@/lib/support-ticket-notifications';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await context.params;
    const parsedTicketId = Number(ticketId);

    if (!Number.isFinite(parsedTicketId) || parsedTicketId <= 0) {
      return NextResponse.json({ success: false, error: 'Invalid ticketId' }, { status: 400 });
    }

    const body = await request.json();
    const parsedDealerId = Number(body?.dealerId);

    if (!Number.isFinite(parsedDealerId) || parsedDealerId <= 0) {
      return NextResponse.json({ success: false, error: 'Valid dealerId is required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureSupportTicketTables(pool);

    await pool.query('BEGIN');

    const ticketCheck = await pool.query(
      `SELECT ticket_id, ticket_number, customer_name, category, sub_category, district, reference_order_id
       FROM support_tickets
       WHERE ticket_id = $1
       LIMIT 1`,
      [parsedTicketId]
    );
    if (ticketCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }
    const existingTicket = ticketCheck.rows[0];
    const referenceOrderId = existingTicket.reference_order_id as number | null;

    const dealerResult = await pool.query(
      `SELECT dealer_id, full_name, district, unique_dealer_id
       FROM dealers
       WHERE dealer_id = $1
       LIMIT 1`,
      [parsedDealerId]
    );

    if (dealerResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
    }

    const dealer = dealerResult.rows[0];

    const updateResult = await pool.query(
      `UPDATE support_tickets
       SET dealer_id = $2,
           district = COALESCE($3, district),
           status = 'in_progress',
           updated_at = CURRENT_TIMESTAMP,
           last_message_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $1
       RETURNING *`,
      [parsedTicketId, parsedDealerId, dealer.district || null]
    );

    // If ticket is linked to an order, reassign that order to the selected dealer.
    if (referenceOrderId) {
      const settingsResult = await pool.query(
        `SELECT setting_value FROM order_allocation_settings WHERE setting_key = 'dealer_response_timeout_hours' LIMIT 1`
      );
      const timeoutHours = parseInt(settingsResult.rows[0]?.setting_value || '6', 10);
      const responseDeadline = new Date();
      responseDeadline.setHours(responseDeadline.getHours() + timeoutHours);

      const seqResult = await pool.query(
        `SELECT COALESCE(MAX(request_sequence), 0) + 1 AS next_seq
         FROM dealer_order_requests
         WHERE order_id = $1`,
        [referenceOrderId]
      );
      const nextSeq = Number(seqResult.rows[0]?.next_seq || 1);

      await pool.query(
        `UPDATE dealer_order_requests
         SET request_status = 'reassigned'
         WHERE order_id = $1
           AND request_status = 'accepted'
           AND dealer_id != $2`,
        [referenceOrderId, parsedDealerId]
      );

      await pool.query(
        `INSERT INTO dealer_order_requests (
          order_id,
          dealer_id,
          request_sequence,
          stock_verified,
          stock_available,
          response_deadline
        ) VALUES ($1, $2, $3, false, false, $4)
        ON CONFLICT (order_id, dealer_id) DO NOTHING`,
        [referenceOrderId, parsedDealerId, nextSeq, responseDeadline]
      );

      await pool.query(
        `UPDATE orders
         SET assigned_dealer_id = $1,
             assigned_at = CURRENT_TIMESTAMP,
             status = 'Awaiting Dealer Confirmation',
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $2`,
        [parsedDealerId, referenceOrderId]
      );

      if (dealer.unique_dealer_id) {
        await pool.query(
          `UPDATE orders
           SET order_number = CASE
             WHEN order_number ~ '^PR-[0-9]{6}-[0-9]+-[0-9]+$'
               THEN REGEXP_REPLACE(order_number, '-[0-9]+$', '') || '-' || $1
             ELSE order_number || '-' || $1
           END
           WHERE order_id = $2
             AND order_number NOT LIKE '%-' || $1`,
          [dealer.unique_dealer_id, referenceOrderId]
        );
      }

      await pool.query(
        `INSERT INTO order_status_history (order_id, status, remarks, created_at)
         VALUES ($1, 'Awaiting Dealer Confirmation', $2, CURRENT_TIMESTAMP)`,
        [referenceOrderId, 'Reassigned from service ticket dealer assignment']
      );
    }

    const noteText = String(body?.note || '').trim();
    if (noteText) {
      await pool.query(
        `INSERT INTO support_ticket_messages (
          ticket_id,
          channel,
          sender_role,
          sender_name,
          message_text,
          is_internal,
          created_at
        ) VALUES ($1,'dealer',$2,$3,$4,false,CURRENT_TIMESTAMP)`,
        [
          parsedTicketId,
          body?.senderRole === 'admin' ? 'admin' : 'district',
          String(body?.senderName || 'District Manager'),
          noteText
        ]
      );
    }

    const actorRole = body?.senderRole === 'admin' ? 'admin' : 'district';
    const actorName = String(body?.senderName || (actorRole === 'admin' ? 'Admin(Protechtur)' : 'District Manager'));

    await sendSupportTicketBellNotifications({
      ticketId: updateResult.rows[0].ticket_id,
      ticketNumber: updateResult.rows[0].ticket_number || existingTicket.ticket_number,
      customerName: updateResult.rows[0].customer_name || existingTicket.customer_name,
      category: updateResult.rows[0].category || existingTicket.category,
      subCategory: updateResult.rows[0].sub_category || existingTicket.sub_category,
      district: updateResult.rows[0].district || existingTicket.district,
      dealerId: parsedDealerId,
      event: 'assigned',
      actorRole,
      actorName,
      messagePreview: noteText,
      status: updateResult.rows[0].status,
    });

    await pool.query('COMMIT');

    return NextResponse.json({ success: true, ticket: updateResult.rows[0], dealer });
  } catch (error) {
    try {
      const pool = getPool();
      await pool.query('ROLLBACK');
    } catch {
      // Ignore rollback failures
    }
    console.error('Support assign dealer error:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign dealer' }, { status: 500 });
  }
}
