const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrder026() {
  try {
    console.log('🔍 Checking order PR-120326-026...\n');

    const orderResult = await pool.query(`
      SELECT 
        order_id, order_number, payment_method,
        assigned_dealer_id, subtotal, advance_amount, total_amount
      FROM orders
      WHERE order_number LIKE 'PR-120326-026%'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }

    const order = orderResult.rows[0];
    console.log('📋 Order Details:');
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Payment Method: ${order.payment_method}`);
    console.log(`   Assigned Dealer: ${order.assigned_dealer_id || 'NONE'}`);
    console.log(`   Subtotal (DB): RS ${order.subtotal}`);
    console.log(`   Advance Amount: RS ${order.advance_amount}`);
    console.log(`   Total Amount: RS ${order.total_amount}`);

    // Check order items
    const itemsResult = await pool.query(`
      SELECT item_name, item_type, quantity, unit_price, total_price
      FROM order_items
      WHERE order_id = $1
    `, [order.order_id]);

    console.log('\n📦 Order Items:');
    let actualSum = 0;
    itemsResult.rows.forEach(item => {
      console.log(`   - ${item.item_name} (${item.item_type})`);
      console.log(`     ${item.quantity} × RS ${item.unit_price} = RS ${item.total_price}`);
      actualSum += parseFloat(item.total_price);
    });
    console.log(`   \n   Actual Items Sum: RS ${actualSum}`);

    console.log('\n📊 Invoice Should Show:');
    console.log(`   Product Total: RS ${actualSum}`);
    console.log(`   COD Extra Charges: RS 500 (for COD payment)`);
    console.log(`   Base for GST: RS ${actualSum + 500}`);
    console.log(`   IGST (18%): RS ${Math.round((actualSum + 500) * 0.18 * 100) / 100}`);
    console.log(`   Grand Total: RS ${Math.round((actualSum + 500) * 1.18 * 100) / 100}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrder026();
