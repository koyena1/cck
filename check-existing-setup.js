// Check existing dealers and products setup
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkExistingSetup() {
  try {
    console.log('\n========================================');
    console.log('CHECKING EXISTING DEALERS & PRODUCTS');
    console.log('========================================\n');

    // Check all dealers
    const dealersResult = await pool.query(`
      SELECT dealer_id, business_name, full_name, service_pin, location, status
      FROM dealers
      ORDER BY dealer_id
    `);

    console.log(`📊 TOTAL DEALERS: ${dealersResult.rows.length}\n`);
    
    if (dealersResult.rows.length > 0) {
      console.log('Current Dealers:');
      dealersResult.rows.forEach(d => {
        console.log(`  ${d.dealer_id}. ${d.business_name || d.full_name} - PIN: ${d.service_pin || 'N/A'} - ${d.status}`);
      });
    } else {
      console.log('⚠️  No dealers in system!');
    }

    // Check products/dealer_products table
    console.log('\n\n📦 CHECKING PRODUCTS TABLES:\n');
    
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND (table_name LIKE '%product%' OR table_name LIKE '%inventory%')
      ORDER BY table_name
    `);

    console.log('Available tables:');
    tablesResult.rows.forEach(t => {
      console.log(`  - ${t.table_name}`);
    });

    // Check dealer_products
    console.log('\n\n🏪 CHECKING DEALER_PRODUCTS:\n');
    const dpResult = await pool.query(`
      SELECT COUNT(*) as count FROM dealer_products
    `);
    console.log(`Total dealer_products records: ${dpResult.rows[0].count}`);

    if (dpResult.rows[0].count > 0) {
      const sampleProducts = await pool.query(`
        SELECT id, company, segment, model_number, base_price, dealer_purchase_price, dealer_sale_price, stock_quantity
        FROM dealer_products
        LIMIT 5
      `);
      console.log('\nSample products:');
      sampleProducts.rows.forEach(p => {
        console.log(`  ${p.id}. ${p.company} ${p.model_number} - Stock: ${p.stock_quantity || 0}`);
      });
    }

    // Check dealer_inventory
    console.log('\n\n📦 CHECKING DEALER_INVENTORY:\n');
    const invResult = await pool.query(`
      SELECT COUNT(*) as count FROM dealer_inventory
    `);
    console.log(`Total dealer_inventory records: ${invResult.rows[0].count}`);

    if (invResult.rows[0].count > 0) {
      const sampleInv = await pool.query(`
        SELECT di.dealer_id, d.business_name, di.product_id, di.quantity_available
        FROM dealer_inventory di
        JOIN dealers d ON di.dealer_id = d.dealer_id
        LIMIT 10
      `);
      console.log('\nSample inventory:');
      sampleInv.rows.forEach(i => {
        console.log(`  Dealer ${i.dealer_id} (${i.business_name}): Product ${i.product_id} = ${i.quantity_available} units`);
      });
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkExistingSetup();
