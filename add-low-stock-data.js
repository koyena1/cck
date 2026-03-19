// add-low-stock-data.js - Add test data for low stock indicator
require('dotenv').config();
const { Pool } = require('pg');

async function addLowStockData() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('Connecting to database...');
    
    // First, check what dealers exist
    const dealersResult = await pool.query('SELECT dealer_id, business_name, full_name FROM dealers LIMIT 5');
    console.log('\nAvailable dealers:');
    dealersResult.rows.forEach(d => console.log(`  ID ${d.dealer_id}: ${d.business_name || d.full_name}`));
    
    if (dealersResult.rows.length === 0) {
      console.log('No dealers found!');
      return;
    }
    
    const dealerId = dealersResult.rows[0].dealer_id;
    console.log(`\nUsing dealer ID: ${dealerId}`);
    
    // Check what products exist
    const productsResult = await pool.query('SELECT id, company, model_number FROM dealer_products WHERE is_active = true LIMIT 10');
    console.log(`\nFound ${productsResult.rows.length} products`);
    
    if (productsResult.rows.length < 6) {
      console.log('Not enough products to create test data!');
      return;
    }
    
    // Add low stock items (1-4 units)
    console.log('\nAdding LOW STOCK items (1-4 units)...');
    for (let i = 0; i < 4; i++) {
      const product = productsResult.rows[i];
      const quantity = i + 1; // 1, 2, 3, 4
      
      await pool.query(`
        INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, quantity_sold, quantity_available, last_purchase_date, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (dealer_id, product_id) 
        DO UPDATE SET 
          quantity_purchased = $3,
          quantity_sold = $4,
          quantity_available = $5,
          last_purchase_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `, [dealerId, product.id, quantity + 10, 10, quantity]);
      
      console.log(`  ✓ Added: ${product.company} ${product.model_number} - Quantity: ${quantity}`);
    }
    
    // Add out of stock items (0 units)
    console.log('\nAdding OUT OF STOCK items (0 units)...');
    for (let i = 4; i < 6; i++) {
      const product = productsResult.rows[i];
      
      await pool.query(`
        INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, quantity_sold, quantity_available, last_purchase_date, created_at, updated_at)
        VALUES ($1, $2, 25, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (dealer_id, product_id) 
        DO UPDATE SET 
          quantity_purchased = 25,
          quantity_sold = 25,
          quantity_available = 0,
          last_purchase_date = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      `, [dealerId, product.id]);
      
      console.log(`  ✓ Added: ${product.company} ${product.model_number} - Quantity: 0`);
    }
    
    // Verify the data
    console.log('\n=== VERIFICATION ===');
    const verifyResult = await pool.query(`
      SELECT 
        di.quantity_available,
        dp.company,
        dp.model_number,
        CASE 
          WHEN di.quantity_available = 0 THEN 'OUT OF STOCK'
          WHEN di.quantity_available > 0 AND di.quantity_available < 5 THEN 'LOW STOCK'
          ELSE 'GOOD STOCK'
        END as stock_status
      FROM dealer_inventory di
      JOIN dealer_products dp ON dp.id = di.product_id
      WHERE di.dealer_id = $1
      ORDER BY di.quantity_available
    `, [dealerId]);
    
    console.log('\nInventory Summary:');
    const outOfStock = verifyResult.rows.filter(r => r.stock_status === 'OUT OF STOCK').length;
    const lowStock = verifyResult.rows.filter(r => r.stock_status === 'LOW STOCK').length;
    const goodStock = verifyResult.rows.filter(r => r.stock_status === 'GOOD STOCK').length;
    
    console.log(`  Out of Stock: ${outOfStock}`);
    console.log(`  Low Stock: ${lowStock}`);
    console.log(`  Good Stock: ${goodStock}`);
    
    console.log('\nDetailed Stock Status:');
    verifyResult.rows.forEach(row => {
      console.log(`  ${row.stock_status}: ${row.company} ${row.model_number} (Qty: ${row.quantity_available})`);
    });
    
    console.log('\n✅ Test data added successfully! Refresh your dashboard to see the low stock indicators.');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

addLowStockData();
