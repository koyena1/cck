const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrderAllocation() {
  try {
    console.log('🔍 Checking order PR-110326-022 allocation status...\n');

    // Get order details
    const orderResult = await pool.query(`
      SELECT 
        order_id, order_number, status, 
        assigned_dealer_id, customer_name, 
        pincode, created_at, payment_status
      FROM orders 
      WHERE order_number = 'PR-110326-022'
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }

    const order = orderResult.rows[0];
    console.log('📋 Order Details:');
    console.log(`   Order ID: ${order.order_id}`);
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Assigned Dealer: ${order.assigned_dealer_id || 'NONE - Not assigned'}`);
    console.log(`   Payment Status: ${order.payment_status}`);
    console.log(`   Created: ${order.created_at}`);
    console.log(`   Pincode: ${order.pincode}\n`);

    // Check allocation log
    console.log('📜 Allocation Log:');
    const logResult = await pool.query(`
      SELECT created_at, log_type, message, details
      FROM order_allocation_log
      WHERE order_id = $1
      ORDER BY created_at ASC
    `, [order.order_id]);

    if (logResult.rows.length === 0) {
      console.log('   ⚠️ No allocation log found - allocation may not have run!');
    } else {
      logResult.rows.forEach(log => {
        console.log(`   [${log.created_at.toISOString()}] ${log.log_type}: ${log.message}`);
        if (log.details) {
          console.log(`      Details: ${JSON.stringify(log.details, null, 2)}`);
        }
      });
    }

    // Check dealer requests
    console.log('\n🤝 Dealer Requests:');
    const requestsResult = await pool.query(`
      SELECT 
        dor.request_sequence, dor.request_status,
        dor.requested_at, dor.responded_at,
        d.business_name, d.unique_dealer_id,
        dor.decline_reason
      FROM dealer_order_requests dor
      LEFT JOIN dealers d ON d.dealer_id = dor.dealer_id
      WHERE dor.order_id = $1
      ORDER BY dor.request_sequence ASC
    `, [order.order_id]);

    if (requestsResult.rows.length === 0) {
      console.log('   ⚠️ No dealer requests found - order never sent to dealers');
    } else {
      requestsResult.rows.forEach(req => {
        console.log(`   Dealer ${req.request_sequence}: ${req.business_name} (${req.unique_dealer_id})`);
        console.log(`      Status: ${req.request_status}`);
        if (req.responded_at) {
          console.log(`      Responded: ${req.responded_at}`);
        }
        if (req.decline_reason) {
          console.log(`      Decline Reason: ${req.decline_reason}`);
        }
      });
    }

    // Check order items
    console.log('\n📦 Order Items:');
    const itemsResult = await pool.query(`
      SELECT item_name, quantity, unit_price, total_price, item_type
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
    `, [order.order_id]);

    itemsResult.rows.forEach(item => {
      console.log(`   ${item.item_name} (${item.item_type})`);
      console.log(`      Qty: ${item.quantity}, Unit Price: RS ${item.unit_price}, Total: RS ${item.total_price}`);
    });

    // Check if any dealer has this product
    console.log('\n🏪 Dealers with CP-UVC-T1100L2 in stock:');
    const stockResult = await pool.query(`
      SELECT 
        d.dealer_id, d.business_name, d.unique_dealer_id,
        di.quantity_available,
        dp.model_number, dp.product_name
      FROM dealers d
      JOIN dealer_inventory di ON di.dealer_id = d.dealer_id
      JOIN dealer_products dp ON dp.id = di.product_id
      WHERE dp.model_number = 'CP-UVC-T1100L2'
        AND di.quantity_available > 0
        AND d.status = 'Active'
      ORDER BY di.quantity_available DESC
    `);

    if (stockResult.rows.length === 0) {
      console.log('   ❌ NO dealers have this product in stock!');
      console.log('   ℹ️  This is why the order is in "Pending Admin Review"');
    } else {
      stockResult.rows.forEach(dealer => {
        console.log(`   ✅ ${dealer.business_name} (${dealer.unique_dealer_id}): ${dealer.quantity_available} units`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrderAllocation();
