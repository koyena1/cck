import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch dealer inventory
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

    // Fetch dealer inventory with product details
    const query = `
      SELECT 
        di.id,
        di.dealer_id,
        di.product_id,
        dp.company,
        dp.segment,
        dp.model_number,
        dp.product_type,
        dp.description,
        dp.dealer_purchase_price,
        dp.dealer_sale_price,
        di.quantity_purchased,
        di.quantity_sold,
        di.quantity_available,
        di.last_purchase_date,
        di.last_sale_date,
        di.created_at,
        di.updated_at
      FROM dealer_inventory di
      JOIN dealer_products dp ON di.product_id = dp.id
      WHERE di.dealer_id = $1 AND di.quantity_available > 0
      ORDER BY di.updated_at DESC
    `;

    const result = await pool.query(query, [dealerId]);

    return NextResponse.json({
      success: true,
      inventory: result.rows
    });
  } catch (error) {
    console.error('Error fetching dealer inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer inventory' },
      { status: 500 }
    );
  }
}
