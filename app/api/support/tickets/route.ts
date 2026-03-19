import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import {
  SUPPORT_CATEGORIES,
  TicketViewerRole,
  displaySenderName,
  ensureSupportTicketTables,
  generateTicketNumber,
  isValidCategorySelection,
  normalizeTicketStatus
} from '@/lib/support-ticket';

function roleFromQuery(value: string | null): TicketViewerRole {
  if (value === 'customer' || value === 'district' || value === 'dealer') return value;
  return 'admin';
}

export async function GET(request: NextRequest) {
  try {
    const pool = getPool();
    await ensureSupportTicketTables(pool);

    const { searchParams } = new URL(request.url);
    const viewer = roleFromQuery(searchParams.get('viewer'));
    const status = searchParams.get('status');
    const customerEmail = searchParams.get('customerEmail');
    const district = searchParams.get('district');
    const dealerId = searchParams.get('dealerId');

    const whereParts: string[] = [];
    const values: Array<string | number> = [];

    if (viewer === 'customer') {
      if (!customerEmail) {
        return NextResponse.json({ success: false, error: 'customerEmail is required' }, { status: 400 });
      }
      values.push(customerEmail.trim().toLowerCase());
      whereParts.push(`LOWER(st.customer_email) = $${values.length}`);
    }

    if (viewer === 'district') {
      if (!district) {
        return NextResponse.json({ success: false, error: 'district is required' }, { status: 400 });
      }
      values.push(district.trim().toLowerCase());
      whereParts.push(`LOWER(COALESCE(st.district, '')) = $${values.length}`);
    }

    if (viewer === 'dealer') {
      const parsedDealerId = Number(dealerId);
      if (!Number.isFinite(parsedDealerId) || parsedDealerId <= 0) {
        return NextResponse.json({ success: false, error: 'dealerId is required' }, { status: 400 });
      }
      values.push(parsedDealerId);
      whereParts.push(`st.dealer_id = $${values.length}`);
    }

    if (status) {
      values.push(normalizeTicketStatus(status));
      whereParts.push(`st.status = $${values.length}`);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const ticketsResult = await pool.query(
      `SELECT
        st.ticket_id,
        st.ticket_number,
        st.customer_id,
        st.customer_name,
        st.customer_email,
        st.customer_phone,
        st.category,
        st.sub_category,
        st.reference_order_id,
        st.reference_order_number,
        st.description,
        st.attachment_url,
        st.district,
        st.dealer_id,
        d.full_name AS dealer_name,
        d.business_name AS dealer_business_name,
        st.status,
        st.priority,
        st.last_message_at,
        st.created_at,
        st.updated_at
      FROM support_tickets st
      LEFT JOIN dealers d ON d.dealer_id = st.dealer_id
      ${whereClause}
      ORDER BY st.last_message_at DESC, st.created_at DESC`,
      values
    );

    const tickets = ticketsResult.rows;

    if (tickets.length === 0) {
      return NextResponse.json({
        success: true,
        tickets: [],
        categories: SUPPORT_CATEGORIES
      });
    }

    const ids = tickets.map((ticket) => ticket.ticket_id);
    const messagesResult = await pool.query(
      `SELECT
        message_id,
        ticket_id,
        channel,
        sender_role,
        sender_name,
        message_text,
        attachment_url,
        is_internal,
        created_at
      FROM support_ticket_messages
      WHERE ticket_id = ANY($1::int[])
      ORDER BY created_at ASC`,
      [ids]
    );

    const messageMap = new Map<number, any[]>();
    for (const row of messagesResult.rows) {
      if (viewer === 'customer') {
        if (row.channel !== 'customer' || row.is_internal) continue;
      }
      if (viewer === 'dealer' && row.channel !== 'dealer') continue;
      const existing = messageMap.get(row.ticket_id) || [];
      existing.push(row);
      messageMap.set(row.ticket_id, existing);
    }

    const hydrated = tickets.map((ticket) => ({
      ...ticket,
      messages: messageMap.get(ticket.ticket_id) || []
    }));

    return NextResponse.json({
      success: true,
      tickets: hydrated,
      categories: SUPPORT_CATEGORIES
    });
  } catch (error) {
    console.error('Support ticket list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch support tickets' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const pool = getPool();
    await ensureSupportTicketTables(pool);

    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      category,
      subCategory,
      referenceOrderId,
      referenceOrderNumber,
      explanation,
      attachmentUrl
    } = body || {};

    if (!customerName || !customerEmail || !category || !subCategory || !explanation) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (!isValidCategorySelection(String(category), String(subCategory))) {
      return NextResponse.json({ success: false, error: 'Invalid category or subcategory' }, { status: 400 });
    }

    const normalizedEmail = String(customerEmail).trim().toLowerCase();
    const ticketNumber = generateTicketNumber();

    let customerId: number | null = null;
    const customerResult = await pool.query('SELECT customer_id FROM customers WHERE LOWER(email) = $1 LIMIT 1', [normalizedEmail]);
    if (customerResult.rows.length > 0) {
      customerId = customerResult.rows[0].customer_id;
    }

    let orderId: number | null = null;
    let orderNumber: string | null = null;
    let district: string | null = null;
    let dealerId: number | null = null;

    const parsedOrderId = Number(referenceOrderId);
    if (Number.isFinite(parsedOrderId) && parsedOrderId > 0) {
      const orderRes = await pool.query(
        `SELECT
          o.order_id,
          o.order_number,
          o.assigned_dealer_id,
          d.district AS dealer_district,
          pm.district AS pincode_district
        FROM orders o
        LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
        LEFT JOIN pincode_master pm ON pm.pincode = o.pincode
        WHERE o.order_id = $1
        LIMIT 1`,
        [parsedOrderId]
      );
      if (orderRes.rows.length > 0) {
        const row = orderRes.rows[0];
        orderId = row.order_id;
        orderNumber = row.order_number || null;
        dealerId = row.assigned_dealer_id || null;
        district = row.dealer_district || row.pincode_district || null;
      }
    } else if (referenceOrderNumber) {
      const orderRes = await pool.query(
        `SELECT
          o.order_id,
          o.order_number,
          o.assigned_dealer_id,
          d.district AS dealer_district,
          pm.district AS pincode_district
        FROM orders o
        LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
        LEFT JOIN pincode_master pm ON pm.pincode = o.pincode
        WHERE LOWER(o.order_number) = LOWER($1)
        LIMIT 1`,
        [String(referenceOrderNumber).trim()]
      );
      if (orderRes.rows.length > 0) {
        const row = orderRes.rows[0];
        orderId = row.order_id;
        orderNumber = row.order_number || null;
        dealerId = row.assigned_dealer_id || null;
        district = row.dealer_district || row.pincode_district || null;
      }
    }

    const ticketInsert = await pool.query(
      `INSERT INTO support_tickets (
        ticket_number,
        customer_id,
        customer_name,
        customer_email,
        customer_phone,
        category,
        sub_category,
        reference_order_id,
        reference_order_number,
        description,
        attachment_url,
        district,
        dealer_id,
        status,
        priority,
        last_message_at,
        created_at,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'open','normal',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      )
      RETURNING *`,
      [
        ticketNumber,
        customerId,
        String(customerName).trim(),
        normalizedEmail,
        customerPhone ? String(customerPhone).trim() : null,
        String(category),
        String(subCategory),
        orderId,
        orderNumber || (referenceOrderNumber ? String(referenceOrderNumber).trim() : null),
        String(explanation).trim(),
        attachmentUrl ? String(attachmentUrl).trim() : null,
        district,
        dealerId
      ]
    );

    const ticket = ticketInsert.rows[0];

    await pool.query(
      `INSERT INTO support_ticket_messages (
        ticket_id,
        channel,
        sender_role,
        sender_name,
        message_text,
        attachment_url,
        is_internal,
        created_at
      ) VALUES ($1,'customer','customer',$2,$3,$4,false,CURRENT_TIMESTAMP)`,
      [ticket.ticket_id, displaySenderName('customer', String(customerName)), String(explanation).trim(), attachmentUrl ? String(attachmentUrl).trim() : null]
    );

    return NextResponse.json({ success: true, ticket, categories: SUPPORT_CATEGORIES });
  } catch (error) {
    console.error('Support ticket create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to create support ticket' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const pool = getPool();
    await ensureSupportTicketTables(pool);

    const body = await request.json();
    const { ticketId, status, priority, district, dealerId } = body || {};
    const parsedTicketId = Number(ticketId);

    if (!Number.isFinite(parsedTicketId) || parsedTicketId <= 0) {
      return NextResponse.json({ success: false, error: 'Valid ticketId is required' }, { status: 400 });
    }

    const updates: string[] = [];
    const values: Array<string | number | null> = [];

    if (status) {
      values.push(normalizeTicketStatus(status));
      updates.push(`status = $${values.length}`);
    }

    if (priority) {
      values.push(String(priority).toLowerCase() === 'high' ? 'high' : String(priority).toLowerCase() === 'low' ? 'low' : 'normal');
      updates.push(`priority = $${values.length}`);
    }

    if (typeof district === 'string') {
      values.push(district.trim() || null);
      updates.push(`district = $${values.length}`);
    }

    if (dealerId !== undefined) {
      const parsedDealerId = Number(dealerId);
      values.push(Number.isFinite(parsedDealerId) && parsedDealerId > 0 ? parsedDealerId : null);
      updates.push(`dealer_id = $${values.length}`);
    }

    if (updates.length === 0) {
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
    }

    values.push(parsedTicketId);

    const result = await pool.query(
      `UPDATE support_tickets
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE ticket_id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Ticket not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: result.rows[0] });
  } catch (error) {
    console.error('Support ticket update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update support ticket' }, { status: 500 });
  }
}
