import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendStockAlertEmail } from '@/lib/stock-alert-email';

export async function POST(request: Request) {
  try {
    const { dealerId, district, message } = await request.json();

    if (!dealerId || !district) {
      return NextResponse.json({ success: false, error: 'dealerId and district are required' }, { status: 400 });
    }

    const pool = getPool();
    const dealerResult = await pool.query(
      `SELECT dealer_id, full_name, business_name, email, unique_dealer_id, district
       FROM dealers
       WHERE dealer_id = $1 AND LOWER(COALESCE(district, '')) = LOWER($2)`,
      [dealerId, district]
    );

    if (dealerResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Dealer not found in your district' }, { status: 404 });
    }

    const dealer = dealerResult.rows[0];
    const productsResult = await pool.query(
      `SELECT
         dp.id AS product_id,
        COALESCE(to_jsonb(dp)->>'product_code', 'PIC' || LPAD(dp.id::text, 3, '0')) AS product_code,
         dp.company,
         dp.segment,
         dp.model_number,
         dp.product_type,
         dp.dealer_purchase_price,
         COALESCE(di.quantity_available, 0) AS quantity_available,
         COALESCE(di.quantity_available, 0) * dp.dealer_purchase_price::NUMERIC AS item_stock_value
       FROM dealer_products dp
       LEFT JOIN dealer_inventory di ON di.product_id = dp.id AND di.dealer_id = $1
       WHERE dp.is_active = TRUE
         AND (COALESCE(di.quantity_available, 0) = 0 OR COALESCE(di.quantity_available, 0) < 5)
       ORDER BY COALESCE(di.quantity_available, 0) ASC, dp.company, dp.model_number`,
      [dealerId]
    );

    if (productsResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'No low stock or out of stock items found' }, { status: 400 });
    }

    await sendStockAlertEmail({
      dealer: {
        dealerId: dealer.dealer_id,
        dealerName: dealer.full_name,
        businessName: dealer.business_name,
        email: dealer.email,
        uniqueDealerId: dealer.unique_dealer_id,
        district: dealer.district,
      },
      products: productsResult.rows,
      sentByRole: 'district',
      sentByLabel: district,
      customMessage: message || null,
    });

    await pool.query(
      `INSERT INTO dealer_notifications (dealer_id, title, message, type, priority, sent_via_email, email_sent_at, created_by)
       VALUES ($1, $2, $3, 'stock_alert_pdf', 'high', TRUE, NOW(), 'district')`,
      [
        dealer.dealer_id,
        'Stock Alert Report Sent',
        'District Manager sent a PDF stock alert report covering low-stock and out-of-stock products to your email.',
      ]
    );

    return NextResponse.json({ success: true, emailedCount: productsResult.rows.length, email: dealer.email });
  } catch (error) {
    console.error('Error sending district stock alert email:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to send stock alert email' }, { status: 500 });
  }
}