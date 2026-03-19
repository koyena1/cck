// Check why allocation failed
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkAllocationFailure() {
  try {
    console.log('\n🔍 CHECKING WHY ALLOCATION FAILED\n');

    // Check order items - do they have product_id?
    const orderResult = await pool.query(`
      SELECT order_id FROM orders WHERE order_number = 'ORD-20260224-0001'
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found!');
      return;
    }

    const orderId = orderResult.rows[0].order_id;

    const itemsResult = await pool.query(`
      SELECT 
        item_id,
        item_name,
        product_id,
        quantity,
        item_type
      FROM order_items
      WHERE order_id = $1
    `, [orderId]);

    console.log('📦 ORDER ITEMS:\n');
    console.log(`   Total items: ${itemsResult.rows.length}\n`);

    itemsResult.rows.forEach(item => {
      console.log(`   - ${item.item_name}`);
      console.log(`     Product ID: ${item.product_id || '❌ NULL (PROBLEM!)'}`);
      console.log(`     Quantity: ${item.quantity}`);
      console.log(`     Type: ${item.item_type}\n`);
    });

    const hasProductIds = itemsResult.rows.some(item => item.product_id !== null);

    if (!hasProductIds) {
      console.log('❌ PROBLEM FOUND: No order items have product_id!');
      console.log('   The allocation system needs product_id to check dealer stock.\n');
      console.log('💡 SOLUTION: Order items from quotation don\'t have product_id.');
      console.log('   This is a quotation/custom order, not a product catalog order.\n');
      console.log('   Two options:');
      console.log('   1. Allow allocation without stock check for quotation orders');
      console.log('   2. Manually map order items to products\n');
    }

    // Check if dealer inventory table structure supports this
    console.log('📊 DEALER STOCK CHECK:\n');

    const stockResult = await pool.query(`
      SELECT 
        d.dealer_id,
        d.business_name,
        d.service_pin,
        COUNT(di.product_id) as product_count,
        SUM(di.quantity_available) as total_stock
      FROM dealers d
      LEFT JOIN dealer_inventory di ON d.dealer_id = di.dealer_id
      WHERE d.service_pin IN ('721636', '721635', '721637')
      GROUP BY d.dealer_id, d.business_name, d.service_pin
      ORDER BY d.service_pin
    `);

    stockResult.rows.forEach(dealer => {
      console.log(`   ${dealer.business_name} (PIN: ${dealer.service_pin})`);
      console.log(`     Products: ${dealer.product_count}`);
      console.log(`     Total Stock: ${dealer.total_stock || 0}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllocationFailure();
