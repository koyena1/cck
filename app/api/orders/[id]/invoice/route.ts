import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

/**
 * GET /api/orders/[id]/invoice
 * Returns full order data for customer invoice generation.
 * Accessible by dealer (by order_id), admin (by order_id), and customer (by order_id + phone verification).
 * 
 * Cache-busting version: 2026-03-12-v2
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const phone = searchParams.get('phone'); // For customer access verification

    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const pool = getPool();

    // Build query — if phone provided, verify customer ownership
    let orderQuery: string;
    let orderParams: any[];

    if (phone) {
      orderQuery = `
        SELECT
          o.*,
          d.business_name    AS dealer_business_name,
          d.full_name        AS dealer_full_name,
          d.unique_dealer_id AS dealer_unique_id,
          d.dealer_id        AS dealer_id,
          d.phone_number     AS dealer_phone,
          d.gstin            AS dealer_gstin,
          d.business_address AS dealer_address,
          d.pincode          AS dealer_pincode,
          d.location         AS dealer_location,
          d.state            AS dealer_state
        FROM orders o
        LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
        WHERE o.order_id = $1 AND o.customer_phone = $2
      `;
      orderParams = [orderId, phone];
    } else {
      orderQuery = `
        SELECT
          o.*,
          d.business_name  AS dealer_business_name,
          d.full_name      AS dealer_full_name,
          d.unique_dealer_id AS dealer_unique_id,
          d.dealer_id      AS dealer_id,
          d.phone_number   AS dealer_phone,
          d.gstin          AS dealer_gstin,
          d.business_address AS dealer_address,
          d.pincode        AS dealer_pincode,
          d.location       AS dealer_location,
          d.state          AS dealer_state
        FROM orders o
        LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
        WHERE o.order_id = $1
      `;
      orderParams = [orderId];
    }

    const orderResult = await pool.query(orderQuery, orderParams);

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Fetch installation settings for COD amount
    const settingsResult = await pool.query(`
      SELECT cod_advance_amount FROM installation_settings LIMIT 1
    `);
    const codAmount = settingsResult.rows[0]?.cod_advance_amount || 500;

    // Fetch order items
    const itemsResult = await pool.query(`
      SELECT
        oi.id,
        COALESCE(oi.product_id, resolved_dp.id) AS product_id,
        COALESCE(
          resolved_dp.product_code,
          CASE
            WHEN COALESCE(oi.product_id, resolved_dp.id) IS NOT NULL
            THEN 'PIC' || LPAD(COALESCE(oi.product_id, resolved_dp.id)::text, 3, '0')
          END,
          'PIC' || LPAD(oi.id::text, 3, '0')
        ) AS product_code,
        oi.item_type,
        oi.item_name,
        oi.quantity,
        oi.unit_price,
        oi.total_price
      FROM order_items oi
      LEFT JOIN LATERAL (
        SELECT
          dp.id,
          to_jsonb(dp)->>'product_code' AS product_code
        FROM dealer_products dp
        WHERE dp.id = oi.product_id
           OR (
             oi.product_id IS NULL
             AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name))
           )
        ORDER BY CASE WHEN dp.id = oi.product_id THEN 0 ELSE 1 END, dp.id
        LIMIT 1
      ) resolved_dp ON TRUE
      WHERE oi.order_id = $1
      ORDER BY oi.id ASC
    `, [orderId]);

    // Build invoice number in format: PR-{dealerNameFirstTwoLetters}-{dealerUniqueId}
    const dealerNameSource = String(order.dealer_business_name || order.dealer_full_name || 'PR');
    const dealerNameFirstTwo = dealerNameSource.replace(/[^a-zA-Z]/g, '').slice(0, 2).toUpperCase() || 'PR';
    const dealerUniqueId = String(order.dealer_unique_id || '').trim().toUpperCase();
    const fallbackDealerId = order.dealer_id ? String(order.dealer_id).padStart(3, '0') : 'NA';
    const invoiceNumber = `PR-${dealerNameFirstTwo}-${dealerUniqueId || fallbackDealerId}`;

    return NextResponse.json({
      success: true,
      invoiceNumber,
      order,
      items: itemsResult.rows,
      codAmount: parseFloat(codAmount), // COD extra charge from settings
    });
  } catch (error: any) {
    console.error('Error fetching order invoice:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch invoice data' }, { status: 500 });
  }
}
