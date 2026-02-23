import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch dealer statistics (purchase/sale totals and profit)
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

    // Get purchase statistics
    const purchaseQuery = `
      SELECT 
        COUNT(*) as total_purchases,
        COALESCE(SUM(final_amount), 0) as total_purchase_amount
      FROM dealer_transactions
      WHERE dealer_id = $1 AND transaction_type = 'purchase' AND payment_status != 'cancelled'
    `;
    const purchaseResult = await pool.query(purchaseQuery, [dealerId]);

    // Get sale statistics
    const saleQuery = `
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(final_amount), 0) as total_sale_amount
      FROM dealer_transactions
      WHERE dealer_id = $1 AND transaction_type = 'sale' AND payment_status != 'cancelled'
    `;
    const saleResult = await pool.query(saleQuery, [dealerId]);

    const totalPurchase = parseFloat(purchaseResult.rows[0].total_purchase_amount);
    const totalSale = parseFloat(saleResult.rows[0].total_sale_amount);
    const totalProfit = totalSale - totalPurchase;

    return NextResponse.json({
      success: true,
      stats: {
        totalPurchases: parseInt(purchaseResult.rows[0].total_purchases),
        totalPurchaseAmount: totalPurchase,
        totalSales: parseInt(saleResult.rows[0].total_sales),
        totalSaleAmount: totalSale,
        totalProfit: totalProfit
      }
    });
  } catch (error) {
    console.error('Error fetching dealer stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer statistics' },
      { status: 500 }
    );
  }
}
