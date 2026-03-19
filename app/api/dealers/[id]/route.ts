import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch detailed dealer information including stock history
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const dealerId = parseInt(params.id);
    
    if (isNaN(dealerId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid dealer ID' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Fetch dealer basic info
    const dealerQuery = `
      SELECT 
        dealer_id,
        full_name,
        email,
        phone_number,
        business_name,
        business_address,
        gstin,
        registration_number,
        serviceable_pincodes,
        location,
        latitude,
        longitude,
        status,
        rating,
        completed_jobs,
        created_at,
        district,
        state,
        pincode
      FROM dealers
      WHERE dealer_id = $1
    `;
    
    const dealerResult = await pool.query(dealerQuery, [dealerId]);
    
    if (dealerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer not found' },
        { status: 404 }
      );
    }

    const dealer = dealerResult.rows[0];

    // Fetch current stock/inventory
    const stockQuery = `
      SELECT 
        di.id,
        di.product_id,
        dp.company,
        dp.segment,
        dp.model_number,
        dp.product_type,
        dp.description,
        di.quantity_purchased,
        di.quantity_sold,
        di.quantity_available,
        di.last_purchase_date,
        di.last_sale_date,
        di.updated_at
      FROM dealer_inventory di
      JOIN dealer_products dp ON di.product_id = dp.id
      WHERE di.dealer_id = $1
      ORDER BY di.updated_at DESC
    `;
    
    const stockResult = await pool.query(stockQuery, [dealerId]);

    // Fetch stock update history (last 50 updates)
    const updateHistoryQuery = `
      SELECT 
        dsu.id,
        dsu.product_id,
        dp.company,
        dp.segment,
        dp.model_number,
        dp.product_type,
        dsu.previous_quantity,
        dsu.new_quantity,
        dsu.quantity_change,
        dsu.update_type,
        dsu.notes,
        dsu.updated_at
      FROM dealer_stock_updates dsu
      JOIN dealer_products dp ON dsu.product_id = dp.id
      WHERE dsu.dealer_id = $1
      ORDER BY dsu.updated_at DESC
      LIMIT 50
    `;
    
    const updateHistoryResult = await pool.query(updateHistoryQuery, [dealerId]);

    // Get last stock update timestamp
    const lastUpdateQuery = `
      SELECT MAX(updated_at) as last_update
      FROM dealer_stock_updates
      WHERE dealer_id = $1
    `;
    
    const lastUpdateResult = await pool.query(lastUpdateQuery, [dealerId]);
    const lastStockUpdate = lastUpdateResult.rows[0]?.last_update;

    // Calculate days since last update
    let daysSinceUpdate = null;
    if (lastStockUpdate) {
      const diffMs = Date.now() - new Date(lastStockUpdate).getTime();
      daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    } else {
      // If no stock updates, calculate from registration date
      const diffMs = Date.now() - new Date(dealer.created_at).getTime();
      daysSinceUpdate = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    }

    // Get stock statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_products,
        COALESCE(SUM(quantity_available), 0) as total_stock_available,
        COALESCE(SUM(quantity_purchased), 0) as total_purchased,
        COALESCE(SUM(quantity_sold), 0) as total_sold
      FROM dealer_inventory
      WHERE dealer_id = $1
    `;
    
    const statsResult = await pool.query(statsQuery, [dealerId]);
    const stats = statsResult.rows[0];

    return NextResponse.json({
      success: true,
      dealer: dealer,
      currentStock: stockResult.rows,
      updateHistory: updateHistoryResult.rows,
      lastStockUpdate: lastStockUpdate,
      daysSinceUpdate: daysSinceUpdate,
      stats: {
        totalProducts: parseInt(stats.total_products),
        totalStockAvailable: parseInt(stats.total_stock_available),
        totalPurchased: parseInt(stats.total_purchased),
        totalSold: parseInt(stats.total_sold)
      }
    });
  } catch (error) {
    console.error('Error fetching dealer details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer details' },
      { status: 500 }
    );
  }
}
