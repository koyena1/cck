const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrder027() {
  try {
    const orderResult = await pool.query(`
      SELECT 
        order_id, order_number, payment_method,
        assigned_dealer_id, subtotal, total_amount,
        d.business_name, d.full_name, d.business_address
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_number LIKE 'PR-120326-027%'
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }

    const order = orderResult.rows[0];
    console.log('📋 Order PR-120326-027:');
    console.log(`   Has dealer assigned: ${order.assigned_dealer_id ? 'YES (ID: ' + order.assigned_dealer_id + ')' : 'NO'}`);
    if (order.assigned_dealer_id) {
      console.log(`   Dealer Business: ${order.business_name || 'NULL'}`);
      console.log(`   Dealer Name: ${order.full_name || 'NULL'}`);
      console.log(`   Dealer Address: ${order.business_address || 'NULL'}`);
    }

    // Check order items
    const itemsResult = await pool.query(`
      SELECT item_name, quantity, unit_price, total_price
      FROM order_items
      WHERE order_id = $1
    `, [order.order_id]);

    console.log('\n📦 Order Items:');
    let actualSum = 0;
    itemsResult.rows.forEach(item => {
      console.log(`   ${item.item_name}: ${item.quantity} × RS ${item.unit_price} = RS ${item.total_price}`);
      actualSum += parseFloat(item.total_price);
    });
    
    console.log(`\n   Actual Sum: RS ${actualSum}`);
    console.log(`   DB Subtotal: RS ${order.subtotal} ${actualSum !== parseFloat(order.subtotal) ? '⚠️ MISMATCH!' : '✓'}`);

    console.log('\n✅ CORRECT Invoice Should Show:');
    console.log(`   Product Total: RS ${actualSum}`);
    console.log(`   COD Extra Charges: RS 500`);
    console.log(`   IGST (18%): RS ${Math.round((actualSum + 500) * 0.18 * 100) / 100}`);
    console.log(`   Grand Total: RS ${Math.round((actualSum + 500) * 1.18 * 100) / 100}`);

    console.log('\n❌ YOUR INVOICE IS SHOWING (OLD CACHE):');
    console.log(`   Products Subtotal: RS 3,500 (using wrong DB field)`);
    console.log(`   COD Extra Charges: MISSING`);
    console.log(`   IGST: RS 1,170`);
    console.log(`   Grand Total: RS 4,670`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrder027();
