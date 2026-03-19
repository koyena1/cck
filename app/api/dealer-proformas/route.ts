import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendProformaEmail } from '@/lib/proforma-email';

function normalizeDistrict(value?: string | null) {
  if (!value) return '';
  return String(value).split(',')[0].trim().toLowerCase();
}

async function ensurePortalNotificationsTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portal_notifications (
      id SERIAL PRIMARY KEY,
      portal VARCHAR(20) NOT NULL,
      recipient_key VARCHAR(120),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      priority VARCHAR(20) DEFAULT 'normal',
      action_url TEXT,
      metadata JSONB,
      is_read BOOLEAN DEFAULT false,
      created_by VARCHAR(50) DEFAULT 'system',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP
    )
  `);
}

async function createPortalNotification(payload: {
  portal: 'admin' | 'district' | 'dealer';
  recipientKey?: string | null;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  actionUrl?: string;
  createdBy?: string;
  metadata?: any;
}) {
  try {
    await ensurePortalNotificationsTable();
    const pool = getPool();
    await pool.query(
      `INSERT INTO portal_notifications (
        portal, recipient_key, title, message, type, priority, action_url, metadata, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        payload.portal,
        payload.recipientKey || null,
        payload.title,
        payload.message,
        payload.type || 'info',
        payload.priority || 'normal',
        payload.actionUrl || null,
        payload.metadata ? JSON.stringify(payload.metadata) : null,
        payload.createdBy || 'system',
      ]
    );
  } catch (error) {
    console.error('Failed to create portal notification:', error);
  }
}

async function createDealerNotification(payload: {
  dealerId: number;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  createdBy?: string;
}) {
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO dealer_notifications (
        dealer_id, title, message, type, priority, is_read, created_by
      ) VALUES ($1,$2,$3,$4,$5,false,$6)`,
      [
        payload.dealerId,
        payload.title,
        payload.message,
        payload.type || 'info',
        payload.priority || 'normal',
        payload.createdBy || 'system',
      ]
    );
  } catch (error) {
    console.error('Failed to create dealer notification:', error);
  }
}

async function ensureProformaItemAllocationsTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealer_proforma_item_allocations (
      id SERIAL PRIMARY KEY,
      proforma_id INTEGER NOT NULL REFERENCES dealer_proformas(id) ON DELETE CASCADE,
      proforma_item_id INTEGER NOT NULL REFERENCES dealer_proforma_items(id) ON DELETE CASCADE,
      selection_percentage INTEGER NOT NULL CHECK (selection_percentage IN (50, 100)),
      allocated_quantity NUMERIC(12,2) NOT NULL DEFAULT 0,
      rate NUMERIC(14,2) NOT NULL DEFAULT 0,
      amount NUMERIC(14,2) NOT NULL DEFAULT 0,
      created_by VARCHAR(50) DEFAULT 'dealer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (proforma_item_id, selection_percentage)
    )
  `);
}

// GET - Fetch proformas (list or specific)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');
    const proformaId = searchParams.get('id');
    const proformaNumber = searchParams.get('proformaNumber');
    const district = searchParams.get('district');

    const pool = getPool();

    // Fetch specific proforma by ID
    if (proformaId) {
      const result = await pool.query(
        `SELECT dp.*, d.full_name as dealer_name, d.email as dealer_email, 
                d.business_name, d.business_address, d.gstin, d.unique_dealer_id,
                d.phone_number as dealer_phone, d.district
         FROM dealer_proformas dp
         JOIN dealers d ON d.dealer_id = dp.dealer_id
         WHERE dp.id = $1`,
        [proformaId]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Proforma not found' }, { status: 404 });
      }

      if (district && normalizeDistrict(result.rows[0].district) !== normalizeDistrict(district)) {
        return NextResponse.json({ success: false, error: 'Access denied for this district' }, { status: 403 });
      }

      const items = await pool.query(
        `SELECT * FROM dealer_proforma_items WHERE proforma_id = $1 ORDER BY sale_date, id`,
        [proformaId]
      );
      await ensureProformaItemAllocationsTable();
      const allocations = await pool.query(
        `SELECT * FROM dealer_proforma_item_allocations WHERE proforma_id = $1 ORDER BY id`,
        [proformaId]
      );

      return NextResponse.json({
        success: true,
        proforma: result.rows[0],
        items: items.rows,
        allocations: allocations.rows
      });
    }

    // Fetch by proforma number (for public/email access)
    if (proformaNumber) {
      const result = await pool.query(
        `SELECT dp.*, d.full_name as dealer_name, d.email as dealer_email, 
                d.business_name, d.business_address, d.gstin, d.unique_dealer_id,
                d.phone_number as dealer_phone, d.district
         FROM dealer_proformas dp
         JOIN dealers d ON d.dealer_id = dp.dealer_id
         WHERE dp.proforma_number = $1`,
        [proformaNumber]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Proforma not found' }, { status: 404 });
      }

      if (district && normalizeDistrict(result.rows[0].district) !== normalizeDistrict(district)) {
        return NextResponse.json({ success: false, error: 'Access denied for this district' }, { status: 403 });
      }

      const items = await pool.query(
        `SELECT * FROM dealer_proforma_items WHERE proforma_id = $1 ORDER BY sale_date, id`,
        [result.rows[0].id]
      );
      await ensureProformaItemAllocationsTable();
      const allocations = await pool.query(
        `SELECT * FROM dealer_proforma_item_allocations WHERE proforma_id = $1 ORDER BY id`,
        [result.rows[0].id]
      );

      return NextResponse.json({
        success: true,
        proforma: result.rows[0],
        items: items.rows,
        allocations: allocations.rows
      });
    }

    // List proformas for a dealer
    if (!dealerId) {
      return NextResponse.json({ success: false, error: 'Dealer ID is required' }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT dp.*, d.full_name as dealer_name, d.business_name
       FROM dealer_proformas dp
       JOIN dealers d ON d.dealer_id = dp.dealer_id
       WHERE dp.dealer_id = $1
         AND (
           $2::text IS NULL
           OR LOWER(TRIM(COALESCE(d.district, ''))) = LOWER(TRIM($2::text))
           OR LOWER(TRIM(COALESCE(d.district, ''))) = LOWER(TRIM(SPLIT_PART($2::text, ',', 1)))
         )
       ORDER BY COALESCE(dp.updated_at, dp.created_at) DESC`,
      [dealerId, district || null]
    );

    return NextResponse.json({ success: true, proformas: result.rows });
  } catch (error) {
    console.error('Error fetching proformas:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch proformas' }, { status: 500 });
  }
}

// POST - Generate a new proforma for a dealer
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      dealerId,
      items,
      periodStart,
      periodEnd,
      taxRate,
      adminNotes,
      sendEmail,
      generatedBy = 'admin',
      district,
    } = body;

    const actor = String(generatedBy || 'admin').toLowerCase() === 'district' ? 'district' : 'admin';

    if (!dealerId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID and items are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get dealer info
      const dealerResult = await client.query(
        `SELECT dealer_id, full_name, email, unique_dealer_id, business_name, gstin, district FROM dealers WHERE dealer_id = $1`,
        [dealerId]
      );
      if (dealerResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
      }
      const dealer = dealerResult.rows[0];

      if (actor === 'district') {
        if (!district || normalizeDistrict(dealer.district) !== normalizeDistrict(district)) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json({ success: false, error: 'Access denied for this district' }, { status: 403 });
        }
      }

      // Generate proforma number
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const ms = String(now.getMilliseconds()).padStart(3, '0');
      const uniqueId = dealer.unique_dealer_id || dealerId;
      const proformaNumber = `PRF-${dd}${mm}${yyyy}-${hh}${min}${ss}${ms}-${uniqueId}`;

      // Calculate totals
      const rate = parseFloat(taxRate) || 5;
      let subTotal = 0;
      for (const item of items) {
        subTotal += parseFloat(item.amount) || 0;
      }
      const taxAmount = subTotal * (rate / 100);
      const totalAmount = subTotal + taxAmount;

      // Insert proforma
      const insertResult = await client.query(
        `INSERT INTO dealer_proformas (
          dealer_id, proforma_number, period_start, period_end,
          sub_total, tax_rate, tax_amount, total_amount,
          status, generated_by, admin_notes, sent_to_email
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          dealerId, proformaNumber,
          periodStart || new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()).toISOString(),
          periodEnd || now.toISOString(),
          subTotal, rate, taxAmount, totalAmount,
          sendEmail ? 'sent' : 'draft',
          actor,
          adminNotes || null,
          dealer.email
        ]
      );
      const proforma = insertResult.rows[0];

      // Insert line items
      for (const item of items) {
        await client.query(
          `INSERT INTO dealer_proforma_items (
            proforma_id, product_id, product_name, description, sale_date, quantity, rate, amount
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            proforma.id,
            item.product_id || null,
            item.product_name,
            item.description || '',
            item.sale_date || null,
            parseFloat(item.quantity) || 1,
            parseFloat(item.rate) || 0,
            parseFloat(item.amount) || 0,
          ]
        );
      }

      // If sendEmail, update sent_at
      if (sendEmail) {
        await client.query(
          `UPDATE dealer_proformas SET sent_at = CURRENT_TIMESTAMP WHERE id = $1`,
          [proforma.id]
        );
      }

      await client.query('COMMIT');
      client.release();

      // Send email if requested
      if (sendEmail && dealer.email) {
        try {
          await sendProformaEmail({
            dealerName: dealer.full_name,
            dealerEmail: dealer.email,
            proformaNumber: proformaNumber,
            totalAmount: totalAmount,
            proformaId: proforma.id,
          });
        } catch (emailErr) {
          console.error('Failed to send proforma email:', emailErr);
        }
      }

      const dealerMessage = sendEmail
        ? `New proforma ${proformaNumber} has been generated and sent. Please review it.`
        : `Draft proforma ${proformaNumber} has been generated. Please review it.`;

      await createDealerNotification({
        dealerId: dealer.dealer_id,
        title: `Proforma ${proformaNumber} Generated`,
        message: dealerMessage,
        type: 'proforma',
        priority: 'high',
        createdBy: actor,
      });

      await createPortalNotification({
        portal: 'admin',
        title: `Proforma ${proformaNumber} Created${actor === 'district' ? ' by District Manager' : ''}`,
        message: `Proforma for dealer ${dealer.full_name} (${dealer.business_name || 'N/A'}) has been created by ${actor === 'district' ? 'district manager' : 'admin'}.${sendEmail ? ' Dealer has been notified.' : ''}`,
        type: 'proforma_created',
        priority: 'high',
        actionUrl: `/admin/dealers/proforma?dealerId=${dealer.dealer_id}&proformaId=${proforma.id}`,
        createdBy: actor,
        metadata: { dealerId: dealer.dealer_id, proformaId: proforma.id, proformaNumber, actor },
      });

      if (dealer.district) {
        await createPortalNotification({
          portal: 'district',
          recipientKey: dealer.district,
          title: `New Proforma ${proformaNumber}`,
          message: `Dealer ${dealer.full_name} received a new proforma invoice created by ${actor === 'district' ? 'district manager' : 'admin'}.`,
          type: 'proforma_created',
          priority: 'high',
          actionUrl: `/district-portal/proforma?dealerId=${dealer.dealer_id}`,
          createdBy: actor,
          metadata: { dealerId: dealer.dealer_id, proformaId: proforma.id, proformaNumber, actor },
        });
      }

      return NextResponse.json({
        success: true,
        proforma: proforma,
        proformaNumber: proformaNumber
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating proforma:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create proforma'
      },
      { status: 500 }
    );
  }
}

// PATCH - Edit proforma (admin or dealer)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const {
      proformaId,
      items,
      status,
      dealerNotes,
      adminNotes,
      taxRate,
      updatedBy = 'system',
      district,
      selectionPercentage,
      applySelection = false,
    } = body;

    if (!proformaId) {
      return NextResponse.json({ success: false, error: 'Proforma ID is required' }, { status: 400 });
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check proforma exists
      const check = await client.query(`SELECT * FROM dealer_proformas WHERE id = $1`, [proformaId]);
      if (check.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json({ success: false, error: 'Proforma not found' }, { status: 404 });
      }

      const proforma = check.rows[0];
      const actor = String(updatedBy || 'system').toLowerCase();

      if (actor === 'dealer' && (items !== undefined || taxRate !== undefined || adminNotes !== undefined)) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Dealer is not allowed to edit proforma items. Only admin/district manager can edit.' },
          { status: 403 }
        );
      }

      if (String(updatedBy || '').toLowerCase() === 'district') {
        const districtCheck = await client.query(
          `SELECT d.district FROM dealer_proformas dp JOIN dealers d ON d.dealer_id = dp.dealer_id WHERE dp.id = $1`,
          [proformaId]
        );
        if (districtCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json({ success: false, error: 'Proforma not found' }, { status: 404 });
        }
        if (!district || normalizeDistrict(districtCheck.rows[0].district) !== normalizeDistrict(district)) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json({ success: false, error: 'Access denied for this district' }, { status: 403 });
        }
      }

      if (actor === 'dealer' && applySelection) {
        const selection = Number(selectionPercentage);
        if (selection !== 50 && selection !== 100) {
          await client.query('ROLLBACK');
          client.release();
          return NextResponse.json({ success: false, error: 'selectionPercentage must be 50 or 100' }, { status: 400 });
        }

        await ensureProformaItemAllocationsTable();

        const proformaItemsResult = await client.query(
          `SELECT id, quantity, rate FROM dealer_proforma_items WHERE proforma_id = $1 ORDER BY sale_date, id`,
          [proformaId]
        );

        const allocationsResult = await client.query(
          `SELECT proforma_item_id, selection_percentage, allocated_quantity
           FROM dealer_proforma_item_allocations
           WHERE proforma_id = $1`,
          [proformaId]
        );

        const consumedByItem: Record<number, number> = {};
        const existingByItemSelection: Record<string, number> = {};

        for (const row of allocationsResult.rows) {
          const itemId = Number(row.proforma_item_id);
          const allocatedQty = parseFloat(row.allocated_quantity) || 0;
          consumedByItem[itemId] = (consumedByItem[itemId] || 0) + allocatedQty;
          existingByItemSelection[`${itemId}:${Number(row.selection_percentage)}`] = allocatedQty;
        }

        for (const item of proformaItemsResult.rows) {
          const itemId = Number(item.id);
          const existingKey = `${itemId}:${selection}`;
          if (existingByItemSelection[existingKey] !== undefined) continue;

          const baseQty = parseFloat(item.quantity) || 0;
          const consumedQty = consumedByItem[itemId] || 0;
          const remainingQty = Math.max(baseQty - consumedQty, 0);
          const allocatedQty = selection === 50 ? Math.ceil(remainingQty * 0.5) : remainingQty;

          if (allocatedQty <= 0) continue;

          const rateVal = parseFloat(item.rate) || 0;
          const amountVal = allocatedQty * rateVal;

          await client.query(
            `INSERT INTO dealer_proforma_item_allocations (
              proforma_id, proforma_item_id, selection_percentage, allocated_quantity, rate, amount, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (proforma_item_id, selection_percentage)
            DO NOTHING`,
            [proformaId, itemId, selection, allocatedQty, rateVal, amountVal, actor]
          );
        }
      }

      // Update items if provided
      if (items && items.length > 0) {
        // Delete old items
        await client.query(`DELETE FROM dealer_proforma_items WHERE proforma_id = $1`, [proformaId]);

        const rate = parseFloat(taxRate) || proforma.tax_rate || 5;
        let subTotal = 0;
        for (const item of items) {
          subTotal += parseFloat(item.amount) || 0;
        }
        const taxAmount = subTotal * (rate / 100);
        const totalAmount = subTotal + taxAmount;

        // Update totals
        await client.query(
          `UPDATE dealer_proformas SET sub_total = $1, tax_rate = $2, tax_amount = $3, total_amount = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5`,
          [subTotal, rate, taxAmount, totalAmount, proformaId]
        );

        // Insert new items
        for (const item of items) {
          await client.query(
            `INSERT INTO dealer_proforma_items (
              proforma_id, product_id, product_name, description, sale_date, quantity, rate, amount
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              proformaId,
              item.product_id || null,
              item.product_name,
              item.description || '',
              item.sale_date || null,
              parseFloat(item.quantity) || 1,
              parseFloat(item.rate) || 0,
              parseFloat(item.amount) || 0,
            ]
          );
        }
      }

      // Update status if provided
      if (status) {
        const validStatus = status === 'finalized' ? 'finalized' : status === 'edited' ? 'edited' : status === 'sent' ? 'sent' : 'draft';
        if (validStatus === 'finalized') {
          await client.query(`UPDATE dealer_proformas SET status = $1, finalized_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [validStatus, proformaId]);
        } else {
          await client.query(`UPDATE dealer_proformas SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [validStatus, proformaId]);
        }
      }

      // Update notes
      if (dealerNotes !== undefined) {
        await client.query(`UPDATE dealer_proformas SET dealer_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [dealerNotes, proformaId]);
      }
      if (adminNotes !== undefined) {
        await client.query(`UPDATE dealer_proformas SET admin_notes = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [adminNotes, proformaId]);
      }

      await client.query('COMMIT');
      client.release();

      // Fetch updated proforma
      const updated = await pool.query(
        `SELECT dp.*, d.full_name as dealer_name, d.email as dealer_email, d.business_name, d.gstin, d.unique_dealer_id, d.district
         FROM dealer_proformas dp
         JOIN dealers d ON d.dealer_id = dp.dealer_id
         WHERE dp.id = $1`,
        [proformaId]
      );
      const updatedItems = await pool.query(
        `SELECT * FROM dealer_proforma_items WHERE proforma_id = $1 ORDER BY sale_date, id`,
        [proformaId]
      );
      await ensureProformaItemAllocationsTable();
      const updatedAllocations = await pool.query(
        `SELECT * FROM dealer_proforma_item_allocations WHERE proforma_id = $1 ORDER BY id`,
        [proformaId]
      );

      const updatedProforma = updated.rows[0];
      const proformaNumber = updatedProforma.proforma_number;
      const adminActionUrl = `/admin/dealers/proforma?dealerId=${updatedProforma.dealer_id}&proformaId=${proformaId}`;
      const districtActionUrl = `/district-portal/proforma?dealerId=${updatedProforma.dealer_id}`;

      const statusLabel = status ? `Status: ${status}. ` : '';
      const itemEditLabel = items && items.length > 0 ? 'Line items were updated. ' : '';
      const noteEditLabel = dealerNotes !== undefined || adminNotes !== undefined ? 'Notes were updated. ' : '';
      const activitySummary = `${statusLabel}${itemEditLabel}${noteEditLabel}`.trim() || 'Proforma was updated.';

      if (actor === 'dealer') {
        await createPortalNotification({
          portal: 'admin',
          title: `Dealer Activity on ${proformaNumber}`,
          message: `${updatedProforma.dealer_name} updated the proforma invoice. ${activitySummary}`,
          type: status === 'finalized' ? 'proforma_finalized' : 'proforma_activity',
          priority: status === 'finalized' ? 'high' : 'normal',
          actionUrl: adminActionUrl,
          createdBy: 'dealer',
          metadata: { dealerId: updatedProforma.dealer_id, proformaId, proformaNumber, actor },
        });

        if (updatedProforma.district) {
          await createPortalNotification({
            portal: 'district',
            recipientKey: updatedProforma.district,
            title: `Dealer Invoice Activity: ${proformaNumber}`,
            message: `${updatedProforma.dealer_name} changed a proforma invoice. ${activitySummary}`,
            type: status === 'finalized' ? 'proforma_finalized' : 'proforma_activity',
            priority: status === 'finalized' ? 'high' : 'normal',
            actionUrl: districtActionUrl,
            createdBy: 'dealer',
            metadata: { dealerId: updatedProforma.dealer_id, proformaId, proformaNumber, actor },
          });
        }
      } else {
        await createDealerNotification({
          dealerId: updatedProforma.dealer_id,
          title: `Proforma ${proformaNumber} Updated`,
          message: activitySummary,
          type: 'proforma',
          priority: status === 'finalized' ? 'high' : 'normal',
          createdBy: actor,
        });

        await createPortalNotification({
          portal: 'admin',
          title: `Proforma ${proformaNumber} Updated`,
          message: `${actor === 'district' ? 'District manager' : 'Admin'} updated a proforma invoice for ${updatedProforma.dealer_name}. ${activitySummary}`,
          type: status === 'finalized' ? 'proforma_finalized' : 'proforma_activity',
          priority: status === 'finalized' ? 'high' : 'normal',
          actionUrl: adminActionUrl,
          createdBy: actor,
          metadata: { dealerId: updatedProforma.dealer_id, proformaId, proformaNumber, actor },
        });

        if (updatedProforma.district) {
          await createPortalNotification({
            portal: 'district',
            recipientKey: updatedProforma.district,
            title: `Proforma ${proformaNumber} Updated`,
            message: `${actor === 'admin' ? 'Admin' : 'District manager'} updated the proforma for ${updatedProforma.dealer_name}. ${activitySummary}`,
            type: status === 'finalized' ? 'proforma_finalized' : 'proforma_activity',
            priority: status === 'finalized' ? 'high' : 'normal',
            actionUrl: districtActionUrl,
            createdBy: actor,
            metadata: { dealerId: updatedProforma.dealer_id, proformaId, proformaNumber, actor },
          });
        }
      }

      return NextResponse.json({
        success: true,
        proforma: updatedProforma,
        items: updatedItems.rows,
        allocations: updatedAllocations.rows
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating proforma:', error);
    return NextResponse.json({ success: false, error: 'Failed to update proforma' }, { status: 500 });
  }
}
