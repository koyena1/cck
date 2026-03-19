import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET /api/dealer/stock-flags?dealerId=X
// Returns all active admin urgency flags for this dealer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerIdParam = searchParams.get('dealerId');
    const dealerId = parseInt(dealerIdParam || '');

    if (isNaN(dealerId)) {
      return NextResponse.json({ success: false, error: 'Invalid dealer ID' }, { status: 400 });
    }

    const pool = getPool();

    // Auto-resolve any active flag where the dealer has already restocked (qty >= 5).
    // This handles cases where stock was updated before auto-resolve logic existed.
    const resolvedRes = await pool.query(
      `UPDATE admin_stock_urgency_flags asuf
       SET is_active = FALSE, resolved_at = NOW()
       FROM dealer_inventory di
       WHERE asuf.dealer_id = $1
         AND asuf.is_active = TRUE
         AND di.dealer_id = asuf.dealer_id
         AND di.product_id = asuf.product_id
         AND di.quantity_available >= 5
       RETURNING asuf.product_id`,
      [dealerId]
    ).catch(() => ({ rows: [] as any[] }));

    // Clean up notifications for any auto-resolved flags
    if (resolvedRes.rows.length > 0) {
      const productIds = resolvedRes.rows.map((r: any) => r.product_id);
      const prodRes = await pool.query(
        `SELECT id, model_number FROM dealer_products WHERE id = ANY($1::int[])`,
        [productIds]
      ).catch(() => ({ rows: [] as any[] }));
      for (const prod of prodRes.rows) {
        const notifTitle = `Stock Alert: ${prod.model_number}`;
        await pool.query(
          `DELETE FROM dealer_notifications WHERE dealer_id = $1 AND type = 'stock_urgent_flag' AND title = $2`,
          [dealerId, notifTitle]
        ).catch(() => {});
      }
    }

    const result = await pool.query(
      `SELECT
         asuf.product_id,
         asuf.flag_type,
         asuf.note,
         asuf.flagged_at
       FROM admin_stock_urgency_flags asuf
       WHERE asuf.dealer_id = $1 AND asuf.is_active = TRUE
       ORDER BY asuf.flagged_at DESC`,
      [dealerId]
    );

    // Build a map of product_id -> flag info
    const flags: Record<number, { flagType: string; note: string | null; flaggedAt: string }> = {};
    for (const row of result.rows) {
      flags[row.product_id] = {
        flagType: row.flag_type,
        note: row.note,
        flaggedAt: row.flagged_at,
      };
    }

    return NextResponse.json({ success: true, flags });
  } catch (error) {
    console.error('Error fetching dealer stock flags:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch stock flags' },
      { status: 500 }
    );
  }
}
