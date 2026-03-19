import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const dealerId = searchParams.get('dealerId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    const selectedYear = parseInt(year);

    // Always show all 12 months
    const months = [
      { name: 'Jan', month: 1 },
      { name: 'Feb', month: 2 },
      { name: 'Mar', month: 3 },
      { name: 'Apr', month: 4 },
      { name: 'May', month: 5 },
      { name: 'Jun', month: 6 },
      { name: 'Jul', month: 7 },
      { name: 'Aug', month: 8 },
      { name: 'Sep', month: 9 },
      { name: 'Oct', month: 10 },
      { name: 'Nov', month: 11 },
      { name: 'Dec', month: 12 }
    ];

    const monthlyData = [];

    for (const monthInfo of months) {
      // Calculate profit from dealer's sales (completed sales transactions)
      const profitQuery = `
        SELECT 
          COALESCE(SUM(final_amount), 0) as profit
        FROM dealer_transactions
        WHERE dealer_id = $1
          AND transaction_type = 'sale'
          AND payment_status = 'completed'
          AND EXTRACT(YEAR FROM transaction_date) = $2
          AND EXTRACT(MONTH FROM transaction_date) = $3
      `;

      // Calculate loss from dealer's purchases/costs (completed purchase transactions)
      const lossQuery = `
        SELECT 
          COALESCE(SUM(final_amount), 0) as loss
        FROM dealer_transactions
        WHERE dealer_id = $1
          AND transaction_type = 'purchase'
          AND payment_status = 'completed'
          AND EXTRACT(YEAR FROM transaction_date) = $2
          AND EXTRACT(MONTH FROM transaction_date) = $3
      `;

      const profitResult = await pool.query(profitQuery, [dealerId, selectedYear, monthInfo.month]);
      const lossResult = await pool.query(lossQuery, [dealerId, selectedYear, monthInfo.month]);

      const profit = parseFloat(profitResult.rows[0]?.profit || '0');
      const loss = parseFloat(lossResult.rows[0]?.loss || '0');

      monthlyData.push({
        month: monthInfo.name,
        profit: Math.round(profit),
        loss: Math.round(loss),
        total: Math.round(profit + loss)
      });
    }

    return NextResponse.json({
      success: true,
      monthlyData,
      year: parseInt(year)
    });

  } catch (error) {
    console.error('Error fetching growth data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch growth data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
