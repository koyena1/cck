import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureSupportTicketTables } from '@/lib/support-ticket';

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

    const ticketCheck = await pool.query('SELECT ticket_id FROM support_tickets WHERE ticket_id = $1 LIMIT 1', [parsedTicketId]);
    if (ticketCheck.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    const dealerResult = await pool.query(
      `SELECT dealer_id, full_name, district
       FROM dealers
       WHERE dealer_id = $1
       LIMIT 1`,
      [parsedDealerId]
    );

    if (dealerResult.rows.length === 0) {
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

    return NextResponse.json({ success: true, ticket: updateResult.rows[0], dealer });
  } catch (error) {
    console.error('Support assign dealer error:', error);
    return NextResponse.json({ success: false, error: 'Failed to assign dealer' }, { status: 500 });
  }
}
