import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const FLAG_TITLES: Record<string, string> = {
  low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock',
  stale: 'Stale Stock',
  urgent: 'Urgent Update',
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealerId, productId, flagType, note, district } = body;

    if (!dealerId || !productId || !district) {
      return NextResponse.json({ success: false, error: 'dealerId, productId and district are required' }, { status: 400 });
    }

    const validFlags = ['low_stock', 'out_of_stock', 'stale', 'urgent'];
    if (flagType && !validFlags.includes(flagType)) {
      return NextResponse.json({ success: false, error: 'Invalid flagType' }, { status: 400 });
    }

    const pool = getPool();
    const dealerScope = await pool.query(
      `SELECT dealer_id FROM dealers WHERE dealer_id = $1 AND LOWER(COALESCE(district, '')) = LOWER($2)`,
      [dealerId, district]
    );

    if (dealerScope.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Dealer not found in your district' }, { status: 403 });
    }

    const productRes = await pool.query(
      `SELECT model_number, company, segment FROM dealer_products WHERE id = $1`,
      [productId]
    );
    const product = productRes.rows[0];
    const notifTitle = product ? `Stock Alert: ${product.model_number}` : `Stock Alert: product #${productId}`;

    if (!flagType) {
      await pool.query(
        `UPDATE admin_stock_urgency_flags
         SET is_active = FALSE, resolved_at = NOW()
         WHERE dealer_id = $1 AND product_id = $2`,
        [dealerId, productId]
      );

      await pool.query(
        `DELETE FROM dealer_notifications
         WHERE dealer_id = $1 AND type = 'stock_urgent_flag' AND title = $2`,
        [dealerId, notifTitle]
      );

      return NextResponse.json({ success: true, action: 'removed' });
    }

    await pool.query(
      `INSERT INTO admin_stock_urgency_flags (dealer_id, product_id, flag_type, note, flagged_at, is_active, resolved_at)
       VALUES ($1, $2, $3, $4, NOW(), TRUE, NULL)
       ON CONFLICT (dealer_id, product_id)
       DO UPDATE SET
         flag_type = EXCLUDED.flag_type,
         note = EXCLUDED.note,
         flagged_at = NOW(),
         is_active = TRUE,
         resolved_at = NULL`,
      [dealerId, productId, flagType, note || null]
    );

    const flagLabel = FLAG_TITLES[flagType] || flagType;
    const productDesc = product
      ? `${product.model_number} (${product.company} · ${product.segment})`
      : `product #${productId}`;
    const notifMessage = note
      ? `District Manager flagged "${productDesc}" as ${flagLabel}. Note: ${note}`
      : `District Manager flagged "${productDesc}" as ${flagLabel}. Please update stock promptly.`;

    await pool.query(
      `DELETE FROM dealer_notifications
       WHERE dealer_id = $1 AND type = 'stock_urgent_flag' AND title = $2`,
      [dealerId, notifTitle]
    );
    await pool.query(
      `INSERT INTO dealer_notifications (dealer_id, title, message, type, priority, is_read, created_by)
       VALUES ($1, $2, $3, 'stock_urgent_flag', 'high', FALSE, 'district')`,
      [dealerId, notifTitle, notifMessage]
    );

    return NextResponse.json({ success: true, action: 'flagged' });
  } catch (error) {
    console.error('Error setting district stock urgency flag:', error);
    return NextResponse.json({ success: false, error: 'Failed to set urgency flag' }, { status: 500 });
  }
}