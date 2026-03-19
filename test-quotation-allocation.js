const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432,
});

async function testAllocation() {
  await client.connect();

  try {
    console.log('🧪 Testing allocation for quotation order ORD-20260224-0001...\n');

    // Clear previous allocation attempts
    await client.query(`
      DELETE FROM dealer_order_requests WHERE order_id = 82
    `);
    await client.query(`
      DELETE FROM order_allocation_log WHERE order_id = 82
    `);
    console.log('✅ Cleared previous allocation attempts\n');

    // Check order details
    const orderResult = await client.query(`
      SELECT 
        o.order_id,
        o.order_number,
        o.pincode,
        o.order_type,
        o.assigned_dealer_id,
        o.status,
        array_agg(oi.product_id) FILTER (WHERE oi.product_id IS NOT NULL) as product_ids,
        array_agg(oi.item_name) as item_names
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = 82
      GROUP BY o.order_id
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found!');
      return;
    }

    const order = orderResult.rows[0];
    console.log('📦 Order Details:');
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Customer PIN: ${order.pincode}`);
    console.log(`   Order Type: ${order.order_type}`);
    console.log(`   Product IDs: ${order.product_ids}`);
    console.log(`   Items: ${order.item_names.join(', ')}`);
    console.log(`   Current Status: ${order.status}`);
    console.log(`   Assigned Dealer: ${order.assigned_dealer_id || 'None'}\n`);

    // Call allocation API
    console.log('🚀 Triggering allocation via API...\n');

    const response = await fetch('http://localhost:3000/api/order-allocation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId: 82
      })
    });

    const result = await response.json();
    console.log('📡 API Response:', result);

    // Check allocation result
    const checkResult = await client.query(`
      SELECT 
        o.order_number,
        o.assigned_dealer_id,
        o.status,
        d.business_name,
        d.service_pin,
        dor.request_id,
        dor.status as request_status,
        dor.created_at
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      LEFT JOIN dealer_order_requests dor ON o.order_id = dor.order_id
      WHERE o.order_id = 82
    `);

    console.log('\n📊 Final Allocation State:');
    if (checkResult.rows.length > 0) {
      const row = checkResult.rows[0];
      console.log(`   Order: ${row.order_number}`);
      console.log(`   Order Status: ${row.status}`);
      console.log(`   Assigned Dealer: ${row.business_name || 'None'}`);
      console.log(`   Dealer PIN: ${row.service_pin || 'N/A'}`);
      console.log(`   Request ID: ${row.request_id || 'None'}`);
      console.log(`   Request Status: ${row.request_status || 'N/A'}`);
      
      if (row.service_pin === '721636') {
        console.log('\n✅ SUCCESS! Order allocated to dealer at exact PIN match (721636)');
      } else if (row.business_name) {
        console.log(`\n⚠️ Order allocated to dealer at PIN ${row.service_pin} (not exact match)`);
      } else {
        console.log('\n❌ Order NOT allocated to any dealer');
      }
    }

    // Check allocation logs
    const logs = await client.query(`
      SELECT log_type, message, details, created_at
      FROM order_allocation_log
      WHERE order_id = 82
      ORDER BY created_at DESC
    `);

    if (logs.rows.length > 0) {
      console.log('\n📋 Allocation Logs:');
      logs.rows.forEach((log, i) => {
        console.log(`   ${i + 1}. [${log.log_type}] ${log.message}`);
        if (log.details) {
          console.log(`      Details: ${JSON.stringify(log.details)}`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
  }
}

testAllocation();
