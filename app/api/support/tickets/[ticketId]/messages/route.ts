import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import {
  TicketViewerRole,
  displaySenderName,
  ensureSupportTicketTables,
  normalizeChannel
} from '@/lib/support-ticket';
import { sendSupportTicketBellNotifications } from '@/lib/support-ticket-notifications';

function parseRole(value: unknown): TicketViewerRole {
  if (value === 'customer' || value === 'district' || value === 'dealer') return value;
  return 'admin';
}

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

    const pool = getPool();
    await ensureSupportTicketTables(pool);

    const body = await request.json();
    const viewerRole = parseRole(body?.viewerRole);
    const message = String(body?.message || '').trim();
    const attachmentUrl = body?.attachmentUrl ? String(body.attachmentUrl).trim() : null;
    const inputChannel = normalizeChannel(body?.channel);

    if (!message && !attachmentUrl) {
      return NextResponse.json({ success: false, error: 'Message or attachment is required' }, { status: 400 });
    }

    const ticketResult = await pool.query(
      `SELECT ticket_id, ticket_number, customer_name, category, sub_category, district, dealer_id, status
       FROM support_tickets
       WHERE ticket_id = $1
       LIMIT 1`,
      [parsedTicketId]
    );
    if (ticketResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }
    const ticket = ticketResult.rows[0];

    let channel: 'customer' | 'dealer' = inputChannel;
    if (viewerRole === 'customer') channel = 'customer';
    if (viewerRole === 'dealer') channel = 'dealer';

    const senderName = displaySenderName(viewerRole, body?.senderName ? String(body.senderName) : undefined);

    const insertResult = await pool.query(
      `INSERT INTO support_ticket_messages (
        ticket_id,
        channel,
        sender_role,
        sender_name,
        message_text,
        attachment_url,
        is_internal,
        created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,false,CURRENT_TIMESTAMP)
      RETURNING *`,
      [parsedTicketId, channel, viewerRole, senderName, message || '', attachmentUrl]
    );

    const nextStatus = viewerRole === 'customer' ? 'open' : 'in_progress';

    await pool.query(
      `UPDATE support_tickets
       SET status = CASE
         WHEN status IN ('resolved', 'closed') AND $2 = 'customer' THEN 'open'
         ELSE $3
       END,
       last_message_at = CURRENT_TIMESTAMP,
       updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $1`,
      [parsedTicketId, viewerRole, nextStatus]
    );

    await sendSupportTicketBellNotifications({
      ticketId: ticket.ticket_id,
      ticketNumber: ticket.ticket_number,
      customerName: ticket.customer_name,
      category: ticket.category,
      subCategory: ticket.sub_category,
      district: ticket.district,
      dealerId: ticket.dealer_id,
      event: 'message',
      actorRole: viewerRole,
      actorName: senderName,
      messagePreview: message,
      status: nextStatus,
    });

    return NextResponse.json({ success: true, message: insertResult.rows[0] });
  } catch (error) {
    console.error('Support ticket message create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send message' }, { status: 500 });
  }
}
