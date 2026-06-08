import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureSupportTicketTables } from '@/lib/support-ticket';
import { sendSupportTicketBellNotifications } from '@/lib/support-ticket-notifications';
import { updateOrderNumberForDealer } from '@/lib/order-numbering';

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
    const action = String(body?.action || '').trim().toLowerCase();
    const note = String(body?.note || '').trim();
    const dealerName = String(body?.dealerName || 'Dealer').trim();

    if (!Number.isFinite(parsedDealerId) || parsedDealerId <= 0) {
      return NextResponse.json({ success: false, error: 'Valid dealerId is required' }, { status: 400 });
    }

    if (action !== 'accept' && action !== 'reject') {
      return NextResponse.json({ success: false, error: 'Action must be accept or reject' }, { status: 400 });
    }

    const pool = getPool();
    await ensureSupportTicketTables(pool);

    await pool.query('BEGIN');

    const ticketResult = await pool.query(
      `SELECT ticket_id, ticket_number, customer_name, category, sub_category, district, status, reference_order_id
       FROM support_tickets
       WHERE ticket_id = $1
       LIMIT 1`,
      [parsedTicketId]
    );

    if (ticketResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const ticket = ticketResult.rows[0];

    const assignmentResult = await pool.query(
      `SELECT id, response_status, response_deadline_at
       FROM support_ticket_dealer_assignments
       WHERE ticket_id = $1 AND dealer_id = $2
       LIMIT 1`,
      [parsedTicketId, parsedDealerId]
    );

    if (assignmentResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'No assignment found for this dealer' }, { status: 403 });
    }

    const myAssignment = assignmentResult.rows[0];

    if (myAssignment.response_status === 'accepted_by_other') {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Accepted by another dealer' }, { status: 409 });
    }

    if (myAssignment.response_status === 'accepted') {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'You have already accepted this request' }, { status: 409 });
    }

    if (myAssignment.response_deadline_at && new Date(myAssignment.response_deadline_at) < new Date()) {
      await pool.query(
        `UPDATE support_ticket_dealer_assignments
         SET response_status = 'expired',
             responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP)
         WHERE id = $1`,
        [myAssignment.id]
      );
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Response window expired (9 hours completed)' }, { status: 410 });
    }

    const alreadyAcceptedResult = await pool.query(
      `SELECT stda.dealer_id, d.full_name
       FROM support_ticket_dealer_assignments stda
       LEFT JOIN dealers d ON d.dealer_id = stda.dealer_id
       WHERE stda.ticket_id = $1
         AND stda.response_status = 'accepted'
         AND stda.dealer_id != $2
       LIMIT 1`,
      [parsedTicketId, parsedDealerId]
    );

    if (alreadyAcceptedResult.rows.length > 0) {
      await pool.query(
        `UPDATE support_ticket_dealer_assignments
         SET response_status = 'accepted_by_other',
             responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP)
         WHERE id = $1`,
        [myAssignment.id]
      );
      await pool.query('COMMIT');
      return NextResponse.json({ success: false, error: 'Accepted by another dealer' }, { status: 409 });
    }

    if (action === 'reject') {
      const rejectedText = note || 'Dealer rejected service request';

      await pool.query(
        `UPDATE support_ticket_dealer_assignments
         SET response_status = 'rejected',
             response_note = $2,
             responded_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [myAssignment.id, rejectedText]
      );

      await pool.query(
        `INSERT INTO support_ticket_messages (
          ticket_id,
          channel,
          sender_role,
          sender_name,
          message_text,
          is_internal,
          created_at
        ) VALUES ($1,'dealer','dealer',$2,$3,false,CURRENT_TIMESTAMP)`,
        [parsedTicketId, dealerName, `Dealer rejected request.${note ? ` Reason: ${note}` : ''}`]
      );

      await sendSupportTicketBellNotifications({
        ticketId: ticket.ticket_id,
        ticketNumber: ticket.ticket_number,
        customerName: ticket.customer_name,
        category: ticket.category,
        subCategory: ticket.sub_category,
        district: ticket.district,
        dealerId: parsedDealerId,
        event: 'message',
        actorRole: 'dealer',
        actorName: dealerName,
        messagePreview: rejectedText,
        status: ticket.status,
      });

      await pool.query('COMMIT');
      return NextResponse.json({ success: true, action: 'rejected' });
    }

    await pool.query(
      `UPDATE support_ticket_dealer_assignments
       SET response_status = 'accepted',
           response_note = $2,
           responded_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [myAssignment.id, note || null]
    );

    await pool.query(
      `UPDATE support_ticket_dealer_assignments
       SET response_status = 'accepted_by_other',
           responded_at = COALESCE(responded_at, CURRENT_TIMESTAMP)
       WHERE ticket_id = $1
         AND dealer_id != $2
         AND response_status = 'pending'`,
      [parsedTicketId, parsedDealerId]
    );

    await pool.query(
      `UPDATE support_tickets
       SET dealer_id = $2,
           status = 'accepted',
           updated_at = CURRENT_TIMESTAMP,
           last_message_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $1`,
      [parsedTicketId, parsedDealerId]
    );

    if (ticket.reference_order_id) {
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
        [ticket.reference_order_id]
      );
      const nextSeq = Number(seqResult.rows[0]?.next_seq || 1);

      await pool.query(
        `UPDATE dealer_order_requests
         SET request_status = 'reassigned'
         WHERE order_id = $1
           AND request_status = 'accepted'
           AND dealer_id != $2`,
        [ticket.reference_order_id, parsedDealerId]
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
        [ticket.reference_order_id, parsedDealerId, nextSeq, responseDeadline]
      );

      await pool.query(
        `UPDATE orders
         SET assigned_dealer_id = $1,
             assigned_at = CURRENT_TIMESTAMP,
             status = 'Awaiting Dealer Confirmation',
             updated_at = CURRENT_TIMESTAMP
         WHERE order_id = $2`,
        [parsedDealerId, ticket.reference_order_id]
      );

      await updateOrderNumberForDealer(pool, ticket.reference_order_id, parsedDealerId);

      await pool.query(
        `INSERT INTO order_status_history (order_id, status, remarks, created_at)
         VALUES ($1, 'Awaiting Dealer Confirmation', $2, CURRENT_TIMESTAMP)`,
        [ticket.reference_order_id, 'Dealer accepted service ticket assignment']
      );
    }

    await pool.query(
      `INSERT INTO support_ticket_messages (
        ticket_id,
        channel,
        sender_role,
        sender_name,
        message_text,
        is_internal,
        created_at
      ) VALUES ($1,'dealer','dealer',$2,$3,false,CURRENT_TIMESTAMP)`,
      [parsedTicketId, dealerName, `Dealer accepted request.${note ? ` Note: ${note}` : ''}`]
    );

    await sendSupportTicketBellNotifications({
      ticketId: ticket.ticket_id,
      ticketNumber: ticket.ticket_number,
      customerName: ticket.customer_name,
      category: ticket.category,
      subCategory: ticket.sub_category,
      district: ticket.district,
      dealerId: parsedDealerId,
      event: 'assigned',
      actorRole: 'dealer',
      actorName: dealerName,
      messagePreview: note,
      status: 'accepted',
    });

    await pool.query('COMMIT');

    return NextResponse.json({ success: true, action: 'accepted' });
  } catch (error) {
    try {
      const pool = getPool();
      await pool.query('ROLLBACK');
    } catch {
      // ignore rollback errors
    }

    console.error('Dealer service response error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit dealer response' }, { status: 500 });
  }
}
