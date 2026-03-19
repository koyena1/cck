const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDealerAPI() {
  try {
    const dealerId = 4; // Sample dealer ID
    
    console.log(`Testing API queries for dealer ID: ${dealerId}\n`);
    
    // Fetch dealer basic info
    console.log('1. Fetching dealer info...');
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
    console.log(`✓ Found dealer: ${dealerResult.rows[0]?.full_name || 'Not found'}\n`);

    // Fetch current stock/inventory
    console.log('2. Fetching current stock...');
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
    console.log(`✓ Found ${stockResult.rows.length} inventory items\n`);

    // Fetch stock update history
    console.log('3. Fetching stock update history...');
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
    console.log(`✓ Found ${updateHistoryResult.rows.length} stock updates\n`);

    // Get last stock update timestamp
    console.log('4. Getting last stock update...');
    const lastUpdateQuery = `
      SELECT MAX(updated_at) as last_update
      FROM dealer_stock_updates
      WHERE dealer_id = $1
    `;
    
    const lastUpdateResult = await pool.query(lastUpdateQuery, [dealerId]);
    const lastStockUpdate = lastUpdateResult.rows[0]?.last_update;
    console.log(`✓ Last update: ${lastStockUpdate || 'No updates yet'}\n`);

    // Get stock statistics
    console.log('5. Getting stock statistics...');
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
    console.log(`✓ Stats: ${stats.total_products} products, ${stats.total_stock_available} available\n`);

    console.log('\n✅ All queries executed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    console.error('Detail:', error.detail);
    console.error('\nFull error:', error);
  } finally {
    await pool.end();
  }
}

testDealerAPI();
