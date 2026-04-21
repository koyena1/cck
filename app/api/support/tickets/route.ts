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
import { sendSupportTicketBellNotifications } from '@/lib/support-ticket-notifications';
import { normalizeDistrictName } from '@/lib/district-normalization';

function roleFromQuery(value: string | null): TicketViewerRole {
  if (value === 'customer' || value === 'district' || value === 'dealer' || value === 'bpo') return value;
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
    const source = searchParams.get('source');

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
      whereParts.push(`
        LOWER(
          COALESCE(
            NULLIF(TRIM(st.district), ''),
            (
              SELECT d_ticket.district
              FROM dealers d_ticket
              WHERE d_ticket.dealer_id = COALESCE(
                (SELECT so.assigned_dealer_id FROM orders so WHERE so.order_id = st.reference_order_id),
                st.dealer_id
              )
              LIMIT 1
            ),
            (
              SELECT d_recent.district
              FROM orders o_recent
              LEFT JOIN dealers d_recent ON d_recent.dealer_id = o_recent.assigned_dealer_id
              WHERE (
                (
                  LOWER(TRIM(COALESCE(st.customer_email, ''))) NOT LIKE '%@protechtur.local'
                  AND LOWER(TRIM(COALESCE(o_recent.customer_email, ''))) = LOWER(TRIM(st.customer_email))
                )
                OR (
                  RIGHT(REGEXP_REPLACE(COALESCE(o_recent.customer_phone, ''), '\\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(COALESCE(st.customer_phone, ''), '\\D', '', 'g'), 10)
                  AND LENGTH(REGEXP_REPLACE(COALESCE(st.customer_phone, ''), '\\D', '', 'g')) >= 10
                )
              )
                AND o_recent.assigned_dealer_id IS NOT NULL
              ORDER BY o_recent.created_at DESC
              LIMIT 1
            ),
            ''
          )
        ) = $${values.length}
      `);
    }

    if (viewer === 'dealer') {
      const parsedDealerId = Number(dealerId);
      if (!Number.isFinite(parsedDealerId) || parsedDealerId <= 0) {
        return NextResponse.json({ success: false, error: 'dealerId is required' }, { status: 400 });
      }
      values.push(parsedDealerId);

      const normalizedSource = String(source || '').trim().toLowerCase();
      if (normalizedSource === 'services_portal') {
        whereParts.push(`(
          st.dealer_id = $${values.length}
          OR EXISTS (
            SELECT 1
            FROM support_ticket_dealer_assignments stda
            WHERE stda.ticket_id = st.ticket_id
              AND stda.dealer_id = $${values.length}
          )
        )`);
      } else {
        whereParts.push(`(
          COALESCE(
            (SELECT so.assigned_dealer_id FROM orders so WHERE so.order_id = st.reference_order_id),
            st.dealer_id,
            (
              SELECT o_recent.assigned_dealer_id
              FROM orders o_recent
              WHERE (
                (
                  LOWER(TRIM(COALESCE(st.customer_email, ''))) NOT LIKE '%@protechtur.local'
                  AND LOWER(TRIM(COALESCE(o_recent.customer_email, ''))) = LOWER(TRIM(st.customer_email))
                )
                OR (
                  RIGHT(REGEXP_REPLACE(COALESCE(o_recent.customer_phone, ''), '\\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(COALESCE(st.customer_phone, ''), '\\D', '', 'g'), 10)
                  AND LENGTH(REGEXP_REPLACE(COALESCE(st.customer_phone, ''), '\\D', '', 'g')) >= 10
                )
              )
                AND o_recent.assigned_dealer_id IS NOT NULL
              ORDER BY o_recent.created_at DESC
              LIMIT 1
            )
          ) = $${values.length}
          OR EXISTS (
            SELECT 1
            FROM support_ticket_dealer_assignments stda
            WHERE stda.ticket_id = st.ticket_id
              AND stda.dealer_id = $${values.length}
          )
        )`);
      }
    }

    if (status) {
      values.push(normalizeTicketStatus(status));
      whereParts.push(`st.status = $${values.length}`);
    }

    if ((viewer === 'admin' || viewer === 'district') && !source) {
      values.push('general_support');
      whereParts.push(`LOWER(st.ticket_source) = $${values.length}`);
    }

    if (source) {
      values.push(source.trim().toLowerCase());
      whereParts.push(`LOWER(st.ticket_source) = $${values.length}`);
    }

    if (viewer === 'bpo' && !source) {
      values.push('services_portal');
      whereParts.push(`LOWER(st.ticket_source) = $${values.length}`);
    }

    const whereClause = whereParts.length > 0 ? `WHERE ${whereParts.join(' AND ')}` : '';

    const ticketsResult = await pool.query(
      `SELECT
        st.ticket_id,
        st.ticket_number,
        st.customer_id,
        st.customer_name,
        COALESCE(st.customer_email, o.customer_email, inf.customer_email) AS customer_email,
        COALESCE(st.customer_phone, o.customer_phone, inf.customer_phone) AS customer_phone,
        st.category,
        st.sub_category,
        COALESCE(st.reference_order_id, inf.order_id) AS reference_order_id,
        COALESCE(st.reference_order_number, o.order_number, inf.order_number) AS reference_order_number,
        COALESCE(o.installation_address, inf.installation_address, c.address) AS installation_address,
        COALESCE(o.pincode, inf.pincode, c.pincode) AS customer_pincode,
        COALESCE(o.city, inf.city) AS customer_city,
        COALESCE(o.state, inf.state) AS customer_state,
        COALESCE(o.landmark, inf.landmark) AS customer_landmark,
        st.description,
        st.attachment_url,
        COALESCE(st.district, d.district, inf.district) AS district,
        COALESCE(o.assigned_dealer_id, st.dealer_id, inf.assigned_dealer_id) AS dealer_id,
        d.full_name AS dealer_name,
        d.business_name AS dealer_business_name,
        d.unique_dealer_id AS dealer_unique_id,
        st.status,
        st.priority,
        st.ticket_source,
        st.last_message_at,
        st.created_at,
        st.updated_at
      FROM support_tickets st
      LEFT JOIN orders o ON o.order_id = st.reference_order_id
      LEFT JOIN customers c ON c.customer_id = st.customer_id
      LEFT JOIN LATERAL (
        SELECT
          o_recent.order_id,
          o_recent.order_number,
          o_recent.customer_email,
          o_recent.customer_phone,
          o_recent.installation_address,
          o_recent.pincode,
          o_recent.city,
          o_recent.state,
          o_recent.landmark,
          o_recent.assigned_dealer_id,
          d_recent.district
        FROM orders o_recent
        LEFT JOIN dealers d_recent ON d_recent.dealer_id = o_recent.assigned_dealer_id
        WHERE (
          (
            LOWER(TRIM(COALESCE(st.customer_email, ''))) NOT LIKE '%@protechtur.local'
            AND LOWER(TRIM(COALESCE(o_recent.customer_email, ''))) = LOWER(TRIM(st.customer_email))
          )
          OR (
            RIGHT(REGEXP_REPLACE(COALESCE(o_recent.customer_phone, ''), '\\D', '', 'g'), 10) = RIGHT(REGEXP_REPLACE(COALESCE(st.customer_phone, ''), '\\D', '', 'g'), 10)
            AND LENGTH(REGEXP_REPLACE(COALESCE(st.customer_phone, ''), '\\D', '', 'g')) >= 10
          )
        )
          AND o_recent.assigned_dealer_id IS NOT NULL
        ORDER BY o_recent.created_at DESC
        LIMIT 1
      ) inf ON true
      LEFT JOIN dealers d ON d.dealer_id = COALESCE(o.assigned_dealer_id, st.dealer_id, inf.assigned_dealer_id)
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

    const assignmentMap = new Map<number, any>();
    const acceptedByMap = new Map<number, any>();

    if (viewer === 'dealer') {
      const parsedDealerId = Number(dealerId);

      if (Number.isFinite(parsedDealerId) && parsedDealerId > 0) {
        const myAssignmentsResult = await pool.query(
          `SELECT
             ticket_id,
             response_status,
             response_note,
             responded_at,
             response_deadline_at
           FROM support_ticket_dealer_assignments
           WHERE ticket_id = ANY($1::int[])
             AND dealer_id = $2`,
          [ids, parsedDealerId]
        );

        for (const row of myAssignmentsResult.rows) {
          assignmentMap.set(row.ticket_id, row);
        }

        const acceptedByResult = await pool.query(
          `SELECT
             stda.ticket_id,
             stda.dealer_id,
             stda.responded_at,
             d.full_name,
             d.unique_dealer_id
           FROM support_ticket_dealer_assignments stda
           LEFT JOIN dealers d ON d.dealer_id = stda.dealer_id
           WHERE stda.ticket_id = ANY($1::int[])
             AND stda.response_status = 'accepted'`,
          [ids]
        );

        for (const row of acceptedByResult.rows) {
          acceptedByMap.set(row.ticket_id, row);
        }
      }
    }

    const hydrated = tickets.map((ticket) => {
      const acceptedByDealer = acceptedByMap.get(ticket.ticket_id) || null;

      return {
        ...ticket,
        status: viewer === 'dealer' && acceptedByDealer ? 'accepted' : ticket.status,
        district: normalizeDistrictName(ticket.district),
        messages: messageMap.get(ticket.ticket_id) || [],
        dealer_assignment: assignmentMap.get(ticket.ticket_id) || null,
        accepted_by_dealer: acceptedByDealer
      };
    });

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
      location,
      ticketSource,
      explanation,
      attachmentUrl
    } = body || {};
    const requestedTicketSource = String(ticketSource || '').trim().toLowerCase();
    const normalizedTicketSource = requestedTicketSource === 'services_portal' ? 'services_portal' : 'general_support';

    if (!category || !subCategory || !explanation) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const normalizedPhone = customerPhone ? String(customerPhone).trim() : '';
    const normalizedPhoneDigits = normalizedPhone.replace(/\D/g, '');
    const rawEmail = customerEmail ? String(customerEmail).trim().toLowerCase() : '';

    const normalizedEmail = rawEmail || `service-${normalizedPhoneDigits || Date.now()}@protechtur.local`;
    const normalizedCustomerName = String(customerName || '').trim() || 'Service Request Customer';

    if (!isValidCategorySelection(String(category), String(subCategory))) {
      return NextResponse.json({ success: false, error: 'Invalid category or subcategory' }, { status: 400 });
    }

    const ticketNumber = generateTicketNumber(normalizedTicketSource === 'services_portal' ? 'SER' : 'SUP');

    let customerId: number | null = null;
    const customerResult = await pool.query(
      `SELECT customer_id
       FROM customers
       WHERE LOWER(email) = LOWER($1)
          OR (
            LENGTH(REGEXP_REPLACE(COALESCE(phone_number, ''), '\\D', '', 'g')) >= 10
            AND RIGHT(REGEXP_REPLACE(COALESCE(phone_number, ''), '\\D', '', 'g'), 10) = RIGHT($2, 10)
          )
       LIMIT 1`,
      [normalizedEmail, normalizedPhoneDigits]
    );
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

    if (!orderId && normalizedPhoneDigits.length >= 10) {
      const phoneOrderRes = await pool.query(
        `SELECT
          o.order_id,
          o.order_number,
          o.assigned_dealer_id,
          d.district AS dealer_district,
          pm.district AS pincode_district
        FROM orders o
        LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
        LEFT JOIN pincode_master pm ON pm.pincode = o.pincode
        WHERE RIGHT(REGEXP_REPLACE(COALESCE(o.customer_phone, ''), '\\D', '', 'g'), 10) = RIGHT($1, 10)
        ORDER BY o.created_at DESC
        LIMIT 1`,
        [normalizedPhoneDigits]
      );

      if (phoneOrderRes.rows.length > 0) {
        const row = phoneOrderRes.rows[0];
        orderId = row.order_id;
        orderNumber = row.order_number || orderNumber;
        dealerId = dealerId || row.assigned_dealer_id || null;
        district = district || row.dealer_district || row.pincode_district || null;
      }
    }

    const normalizedLocation = typeof location === 'string' ? location.trim() : '';

    if (!district && normalizedLocation) {
      const pincodeMatch = normalizedLocation.match(/\b\d{6}\b/);

      if (pincodeMatch?.[0]) {
        try {
          const pincodeRes = await pool.query(
            `SELECT district
             FROM pincode_master
             WHERE pincode = $1
             LIMIT 1`,
            [pincodeMatch[0]]
          );
          if (pincodeRes.rows.length > 0) {
            district = normalizeDistrictName(pincodeRes.rows[0].district || null) || null;
          }
        } catch (lookupError) {
          console.warn('Support ticket pincode lookup skipped:', lookupError);
        }
      }

      if (!district) {
        try {
          const districtRes = await pool.query(
            `SELECT district
             FROM district_managers
             WHERE LOWER(TRIM(district)) = LOWER(TRIM($1))
             LIMIT 1`,
            [normalizedLocation]
          );

          if (districtRes.rows.length > 0) {
            district = normalizeDistrictName(districtRes.rows[0].district || null) || null;
          }
        } catch (lookupError) {
          console.warn('Support ticket district exact lookup skipped:', lookupError);
        }
      }

      if (!district) {
        try {
          const fuzzyDistrictRes = await pool.query(
            `SELECT district
             FROM district_managers
             WHERE LOWER(TRIM($1)) LIKE CONCAT('%', LOWER(TRIM(district)), '%')
             ORDER BY LENGTH(TRIM(district)) DESC
             LIMIT 1`,
            [normalizedLocation]
          );

          if (fuzzyDistrictRes.rows.length > 0) {
            district = normalizeDistrictName(fuzzyDistrictRes.rows[0].district || null) || null;
          }
        } catch (lookupError) {
          console.warn('Support ticket district fuzzy lookup skipped:', lookupError);
        }
      }
    }

    // If ticket is created without explicit order reference, infer dealer/district
    // from the customer's latest dealer-assigned order so district visibility stays accurate.
    if (!dealerId || !district) {
      const inferredRes = await pool.query(
        `SELECT
          o.assigned_dealer_id,
          d.district AS dealer_district,
          pm.district AS pincode_district
        FROM orders o
        LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
        LEFT JOIN pincode_master pm ON pm.pincode = o.pincode
        WHERE (
          (
            LOWER(TRIM($1)) NOT LIKE '%@protechtur.local'
            AND LOWER(TRIM(COALESCE(o.customer_email, ''))) = LOWER(TRIM($1))
          )
          OR (
            RIGHT(REGEXP_REPLACE(COALESCE(o.customer_phone, ''), '\\D', '', 'g'), 10) = RIGHT($2, 10)
            AND LENGTH($2) >= 10
          )
        )
          AND o.assigned_dealer_id IS NOT NULL
        ORDER BY o.created_at DESC
        LIMIT 1`,
        [normalizedEmail, normalizedPhoneDigits]
      );

      if (inferredRes.rows.length > 0) {
        const inferred = inferredRes.rows[0];
        dealerId = dealerId || inferred.assigned_dealer_id || null;
        district = district || normalizeDistrictName(inferred.dealer_district || inferred.pincode_district || null) || null;
      }
    }

    // Keep the raw location as district fallback so district notifications can still
    // route to a location key even if master lookup fails.
    if (!district && normalizedLocation) {
      district = normalizeDistrictName(normalizedLocation);
    }

    district = normalizeDistrictName(district);

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
        ticket_source,
        status,
        priority,
        last_message_at,
        created_at,
        updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'open','normal',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
      )
      RETURNING *`,
      [
        ticketNumber,
        customerId,
        normalizedCustomerName,
        normalizedEmail,
        normalizedPhone || null,
        String(category),
        String(subCategory),
        orderId,
        orderNumber || (referenceOrderNumber ? String(referenceOrderNumber).trim() : null),
        String(explanation).trim(),
        attachmentUrl ? String(attachmentUrl).trim() : null,
        district,
        dealerId,
        normalizedTicketSource
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
      [ticket.ticket_id, displaySenderName('customer', normalizedCustomerName), String(explanation).trim(), attachmentUrl ? String(attachmentUrl).trim() : null]
    );

    await sendSupportTicketBellNotifications({
      ticketId: ticket.ticket_id,
      ticketNumber: ticket.ticket_number,
      customerName: ticket.customer_name,
      category: ticket.category,
      subCategory: ticket.sub_category,
      district: ticket.district,
      dealerId: ticket.dealer_id,
      event: 'created',
      actorRole: 'customer',
      actorName: ticket.customer_name,
      messagePreview: String(explanation).trim(),
      status: ticket.status,
    });

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

    const updatedTicket = result.rows[0];
    await sendSupportTicketBellNotifications({
      ticketId: updatedTicket.ticket_id,
      ticketNumber: updatedTicket.ticket_number,
      customerName: updatedTicket.customer_name,
      category: updatedTicket.category,
      subCategory: updatedTicket.sub_category,
      district: updatedTicket.district,
      dealerId: updatedTicket.dealer_id,
      event: 'status',
      actorRole: 'admin',
      actorName: 'Admin(Protechtur)',
      status: updatedTicket.status,
    });

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error('Support ticket update error:', error);
    return NextResponse.json({ success: false, error: 'Failed to update support ticket' }, { status: 500 });
  }
}
