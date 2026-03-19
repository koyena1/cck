import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

/**
 * Resend confirmation emails for orders that never received one.
 * POST /api/admin/resend-emails  { orderIds: [94, 95, 96, 97, 98] }
 * DELETE THIS FILE or restrict access after use.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { orderIds } = body as { orderIds: number[] };

  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return NextResponse.json({ error: 'orderIds array required' }, { status: 400 });
  }

  const pool = getPool();
  const results: Record<number, { sent: boolean; email: string; error?: string }> = {};

  for (const orderId of orderIds) {
    try {
      const [orderRes, itemsRes, codSettingsRes] = await Promise.all([
        pool.query(`
          SELECT o.*,
            d.business_name AS dealer_business_name,
            d.full_name AS dealer_full_name,
            d.unique_dealer_id AS dealer_unique_id,
            d.dealer_id AS dealer_id,
            d.phone_number AS dealer_phone,
            d.gstin AS dealer_gstin,
            d.business_address AS dealer_address,
            d.pincode AS dealer_pincode,
            d.location AS dealer_location,
            d.state AS dealer_state
          FROM orders o
          LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
          WHERE o.order_id = $1
        `, [orderId]),
        pool.query(
            `SELECT oi.item_name, oi.quantity, oi.unit_price, oi.total_price, oi.item_type, COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')) AS product_code
           FROM order_items oi
           LEFT JOIN dealer_products dp ON dp.id = oi.product_id
           WHERE oi.order_id = $1`,
          [orderId]
        ),
        pool.query('SELECT cod_advance_amount FROM installation_settings LIMIT 1'),
      ]);

      const order = orderRes.rows[0];
      if (!order) { results[orderId] = { sent: false, email: '', error: 'Order not found' }; continue; }
      if (!order.customer_email) { results[orderId] = { sent: false, email: '', error: 'No email on order' }; continue; }
      order._codFlatAmount = parseFloat(codSettingsRes.rows[0]?.cod_advance_amount || '500');

      const actualOrderNumber = order.order_number;
      const customerOrderNumber = /^PR-\d{6}-\d+-\d+$/.test(actualOrderNumber)
        ? actualOrderNumber.replace(/-\d+$/, '')
        : actualOrderNumber;

      const trackingUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${order.order_token}`;

      const sent = await sendOrderConfirmationEmail({
        orderNumber: customerOrderNumber,
        orderToken: order.order_token,
        customerName: order.customer_name || 'Customer',
        customerEmail: order.customer_email,
        totalAmount: parseFloat(order.total_amount) || 0,
        paymentMethod: order.payment_method || 'cod',
        paymentStatus: order.payment_status || 'Pending',
        orderDate: order.created_at,
        trackingUrl,
        orderItems: itemsRes.rows,
        fullOrderData: order,
      });

      results[orderId] = { sent, email: order.customer_email };

      if (sent) {
        await pool.query(
          `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, sent_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [orderId, order.customer_email, 'order_confirmation', `Order Confirmation - ${customerOrderNumber}`, 'sent']
        );
        await pool.query(
          'UPDATE orders SET tracking_link_sent = true WHERE order_id = $1',
          [orderId]
        );
      }
    } catch (e: any) {
      results[orderId] = { sent: false, email: '', error: e?.message || String(e) };
    }
  }

  return NextResponse.json({ results });
}
