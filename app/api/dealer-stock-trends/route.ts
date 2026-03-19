import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch dealer stock trends (increasing/decreasing indicators)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Calculate trends based on recent transactions (last 30 days)
    const query = `
      WITH recent_purchases AS (
        SELECT 
          dti.product_id,
          SUM(dti.quantity) as recent_purchase_qty
        FROM dealer_transaction_items dti
        JOIN dealer_transactions dt ON dti.transaction_id = dt.id
        WHERE dt.dealer_id = $1 
          AND dt.transaction_type = 'purchase'
          AND dt.transaction_date >= NOW() - INTERVAL '30 days'
        GROUP BY dti.product_id
      ),
      recent_sales AS (
        SELECT 
          dti.product_id,
          SUM(dti.quantity) as recent_sale_qty
        FROM dealer_transaction_items dti
        JOIN dealer_transactions dt ON dti.transaction_id = dt.id
        WHERE dt.dealer_id = $1 
          AND dt.transaction_type = 'sale'
          AND dt.transaction_date >= NOW() - INTERVAL '30 days'
        GROUP BY dti.product_id
      ),
      previous_month_purchases AS (
        SELECT 
          dti.product_id,
          SUM(dti.quantity) as prev_purchase_qty
        FROM dealer_transaction_items dti
        JOIN dealer_transactions dt ON dti.transaction_id = dt.id
        WHERE dt.dealer_id = $1 
          AND dt.transaction_type = 'purchase'
          AND dt.transaction_date >= NOW() - INTERVAL '60 days'
          AND dt.transaction_date < NOW() - INTERVAL '30 days'
        GROUP BY dti.product_id
      ),
      previous_month_sales AS (
        SELECT 
          dti.product_id,
          SUM(dti.quantity) as prev_sale_qty
        FROM dealer_transaction_items dti
        JOIN dealer_transactions dt ON dti.transaction_id = dt.id
        WHERE dt.dealer_id = $1 
          AND dt.transaction_type = 'sale'
          AND dt.transaction_date >= NOW() - INTERVAL '60 days'
          AND dt.transaction_date < NOW() - INTERVAL '30 days'
        GROUP BY dti.product_id
      )
      SELECT 
        di.product_id,
        COALESCE(rp.recent_purchase_qty, 0) as recent_purchases,
        COALESCE(rs.recent_sale_qty, 0) as recent_sales,
        COALESCE(pp.prev_purchase_qty, 0) as prev_purchases,
        COALESCE(ps.prev_sale_qty, 0) as prev_sales,
        -- Determine trend based on net change (purchases - sales)
        CASE 
          WHEN (COALESCE(rp.recent_purchase_qty, 0) - COALESCE(rs.recent_sale_qty, 0)) > 
               (COALESCE(pp.prev_purchase_qty, 0) - COALESCE(ps.prev_sale_qty, 0)) 
            THEN 'increasing'
          WHEN (COALESCE(rp.recent_purchase_qty, 0) - COALESCE(rs.recent_sale_qty, 0)) < 
               (COALESCE(pp.prev_purchase_qty, 0) - COALESCE(ps.prev_sale_qty, 0)) 
            THEN 'decreasing'
          ELSE 'stable'
        END as trend
      FROM dealer_inventory di
      LEFT JOIN recent_purchases rp ON di.product_id = rp.product_id
      LEFT JOIN recent_sales rs ON di.product_id = rs.product_id
      LEFT JOIN previous_month_purchases pp ON di.product_id = pp.product_id
      LEFT JOIN previous_month_sales ps ON di.product_id = ps.product_id
      WHERE di.dealer_id = $1
    `;

    const result = await pool.query(query, [dealerId]);

    return NextResponse.json({
      success: true,
      trends: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching stock trends:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stock trends' },
      { status: 500 }
    );
  }
}
