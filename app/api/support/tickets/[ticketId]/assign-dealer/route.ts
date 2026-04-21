import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureSupportTicketTables } from '@/lib/support-ticket';
import { sendSupportTicketBellNotifications } from '@/lib/support-ticket-notifications';
import { normalizeDistrictName } from '@/lib/district-normalization';

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
    const assignAllDistrict = Boolean(body?.assignAllDistrict);
    const parsedDealerId = Number(body?.dealerId);
    const requestedDistrict = normalizeDistrictName(typeof body?.district === 'string' ? body.district.trim() : '');
    const actorRole = body?.senderRole === 'admin' ? 'admin' : body?.senderRole === 'district' ? 'district' : 'bpo';
    const actorName = String(
      body?.senderName || (actorRole === 'admin' ? 'Admin(Protechtur)' : actorRole === 'district' ? 'District Manager' : 'BPO Agent')
    );

    if (!assignAllDistrict && (!Number.isFinite(parsedDealerId) || parsedDealerId <= 0)) {
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
    const noteText = String(body?.note || '').trim();

    if (actorRole === 'bpo' && !noteText) {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Service details note is required for BPO assignment' }, { status: 400 });
    }

    if (assignAllDistrict) {
      const targetDistrict = requestedDistrict || normalizeDistrictName(String(existingTicket.district || '').trim());

      if (!targetDistrict) {
        await pool.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'District is required to assign all dealers' }, { status: 400 });
      }

      const dealersResult = await pool.query(
        `SELECT dealer_id, full_name, district, unique_dealer_id
         FROM dealers
         WHERE LOWER(TRIM(COALESCE(district, ''))) = LOWER(TRIM($1))
         ORDER BY dealer_id ASC`,
        [targetDistrict]
      );

      if (dealersResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json({ success: false, error: 'No dealers found in the ticket district' }, { status: 404 });
      }

      const updateResult = await pool.query(
        `UPDATE support_tickets
         SET district = COALESCE($2, district),
             status = 'in_progress',
             updated_at = CURRENT_TIMESTAMP,
             last_message_at = CURRENT_TIMESTAMP
         WHERE ticket_id = $1
         RETURNING *`,
        [parsedTicketId, targetDistrict]
      );

      for (const d of dealersResult.rows) {
        await pool.query(
          `INSERT INTO support_ticket_dealer_assignments (
            ticket_id,
            dealer_id,
            assign_mode,
            assigned_by_role,
            assigned_by_name,
            response_status,
            response_note,
            responded_at,
            response_deadline_at,
            created_at
          ) VALUES ($1, $2, 'district_broadcast', $3, $4, 'pending', NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '9 hours', CURRENT_TIMESTAMP)
          ON CONFLICT (ticket_id, dealer_id) DO UPDATE
          SET assign_mode = EXCLUDED.assign_mode,
              assigned_by_role = EXCLUDED.assigned_by_role,
              assigned_by_name = EXCLUDED.assigned_by_name,
              response_status = 'pending',
              response_note = NULL,
              responded_at = NULL,
              response_deadline_at = CURRENT_TIMESTAMP + INTERVAL '9 hours',
              created_at = CURRENT_TIMESTAMP`,
          [parsedTicketId, d.dealer_id, actorRole, actorName]
        );
      }

      const messageText = noteText || `Ticket broadcasted to all dealers in district: ${targetDistrict}.`;
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
        [parsedTicketId, actorRole, actorName, messageText]
      );

      await sendSupportTicketBellNotifications({
        ticketId: updateResult.rows[0].ticket_id,
        ticketNumber: updateResult.rows[0].ticket_number || existingTicket.ticket_number,
        customerName: updateResult.rows[0].customer_name || existingTicket.customer_name,
        category: updateResult.rows[0].category || existingTicket.category,
        subCategory: updateResult.rows[0].sub_category || existingTicket.sub_category,
        district: updateResult.rows[0].district || existingTicket.district,
        dealerId: null,
        event: 'assigned',
        actorRole,
        actorName,
        messagePreview: messageText,
        status: updateResult.rows[0].status,
      });

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        ticket: updateResult.rows[0],
        dealers: dealersResult.rows,
        assignedCount: dealersResult.rows.length,
      });
    }

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
    const ticketDistrict = normalizeDistrictName(String(requestedDistrict || existingTicket.district || '').trim());
    const dealerDistrict = normalizeDistrictName(String(dealer.district || '').trim());

    if (ticketDistrict && (!dealerDistrict || dealerDistrict.toLowerCase() !== ticketDistrict.toLowerCase())) {
      await pool.query('ROLLBACK');
      return NextResponse.json({ success: false, error: 'Selected dealer is not in the same district as the customer request' }, { status: 400 });
    }

    const updateResult = await pool.query(
      `UPDATE support_tickets
       SET dealer_id = NULL,
           district = COALESCE($3, $4, district),
           status = 'in_progress',
           updated_at = CURRENT_TIMESTAMP,
           last_message_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $1
       RETURNING *`,
      [parsedTicketId, dealer.district || null, ticketDistrict || null]
    );

    await pool.query(
      `INSERT INTO support_ticket_dealer_assignments (
        ticket_id,
        dealer_id,
        assign_mode,
        assigned_by_role,
        assigned_by_name,
        response_status,
        response_note,
        responded_at,
        response_deadline_at,
        created_at
      ) VALUES ($1, $2, 'single', $3, $4, 'pending', NULL, NULL, CURRENT_TIMESTAMP + INTERVAL '9 hours', CURRENT_TIMESTAMP)
      ON CONFLICT (ticket_id, dealer_id) DO UPDATE
      SET assign_mode = EXCLUDED.assign_mode,
          assigned_by_role = EXCLUDED.assigned_by_role,
          assigned_by_name = EXCLUDED.assigned_by_name,
          response_status = 'pending',
          response_note = NULL,
          responded_at = NULL,
          response_deadline_at = CURRENT_TIMESTAMP + INTERVAL '9 hours',
          created_at = CURRENT_TIMESTAMP`,
      [parsedTicketId, parsedDealerId, actorRole, actorName]
    );

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
          actorRole,
          actorName,
          noteText
        ]
      );
    }

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
