const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrder025COD() {
  try {
    console.log('🔍 Checking order PR-120326-025 COD charges...\n');

    // First, check what columns exist
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
        AND column_name LIKE '%cod%' OR column_name LIKE '%delivery%'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Available COD/Delivery columns in orders table:');
    columnsResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}`);
    });

    // Check order details
    const orderResult = await pool.query(`
      SELECT 
        order_id, order_number, payment_method,
        delivery_charges, products_total, subtotal, total_amount
      FROM orders
      WHERE order_number LIKE 'PR-120326-025%'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }

    const order = orderResult.rows[0];
    console.log('\n📋 Order Database Values:');
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Payment Method: ${order.payment_method}`);
    console.log(`   Products Total: RS ${order.products_total || 'NULL'}`);
    console.log(`   Subtotal: RS ${order.subtotal || 'NULL'}`);
    console.log(`   Delivery Charges: RS ${order.delivery_charges || '0'}`);
    console.log(`   Total Amount: RS ${order.total_amount}`);

    // Check installation_settings for COD config
    const settingsResult = await pool.query(`
      SELECT * FROM installation_settings LIMIT 1
    `);

    if (settingsResult.rows.length > 0) {
      const settings = settingsResult.rows[0];
      console.log('\n⚙️ Global COD Settings:');
      console.log(`   All settings:`, settings);
    }

    // Check order_items
    const itemsResult = await pool.query(`
      SELECT item_name, item_type, quantity, unit_price, line_total
      FROM order_items
      WHERE order_id = $1
    `, [order.order_id]);

    console.log('\n📦 Order Items:');
    let actualItemsSum = 0;
    itemsResult.rows.forEach(item => {
      console.log(`   - ${item.item_name} (${item.item_type})`);
      console.log(`     Qty: ${item.quantity} × RS ${item.unit_price} = RS ${item.line_total}`);
      actualItemsSum += parseFloat(item.line_total);
    });
    console.log(`   \n   Actual Items Sum: RS ${actualItemsSum}`);

    console.log('\n💡 Correct Calculation:');
    console.log(`   Product Total: RS ${actualItemsSum}`);
    console.log(`   COD Extra: RS 500 (should be flat RS 500)`);
    const correctBase = actualItemsSum + 500;
    const correctGST = Math.round(correctBase * 0.18 * 100) / 100;
    const correctGrandTotal = correctBase + correctGST;
    console.log(`   Base for GST: RS ${correctBase}`);
    console.log(`   GST (18%): RS ${correctGST}`);
    console.log(`   Grand Total: RS ${correctGrandTotal}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrder025COD();
