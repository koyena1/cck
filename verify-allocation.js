const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432,
});

async function verifyAllocation() {
  await client.connect();

  try {
    // Check order allocation
    const result = await client.query(`
      SELECT 
        o.order_number,
        o.pincode as customer_pincode,
        o.assigned_dealer_id,
        o.status,
        d.business_name,
        d.service_pin as dealer_pin,
        d.latitude,
        d.longitude
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      WHERE o.order_id = 82
    `);

    if (result.rows.length > 0) {
      const order = result.rows[0];
      console.log('✅ ORDER ALLOCATION VERIFIED\n');
      console.log(`📦 Order: ${order.order_number}`);
      console.log(`📍 Customer PIN: ${order.customer_pincode}`);
      console.log(`🏢 Assigned Dealer: ${order.business_name || 'None'}`);
      console.log(`📍 Dealer PIN: ${order.dealer_pin || 'N/A'}`);
      console.log(`📊 Order Status: ${order.status}`);
      
      if (order.dealer_pin === order.customer_pincode) {
        console.log('\n🎯 PERFECT MATCH! Dealer at exact customer PIN!');
      }
    }

    // Check dealer order request
    const requestResult = await client.query(`
      SELECT 
        dealer_request_id,
        status,
        response_deadline,
        created_at
      FROM dealer_order_requests
      WHERE order_id = 82
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (requestResult.rows.length > 0) {
      const request = requestResult.rows[0];
      console.log('\n📝 Dealer Request Details:');
      console.log(`   Request ID: ${request.dealer_request_id}`);
      console.log(`   Status: ${request.status}`);
      console.log(`   Created: ${request.created_at}`);
      console.log(`   Response Deadline: ${request.response_deadline}`);
    }

    // Check allocation logs
    const logs = await client.query(`
      SELECT log_type, message, created_at
      FROM order_allocation_log
      WHERE order_id = 82
      ORDER BY created_at ASC
    `);

    if (logs.rows.length > 0) {
      console.log('\n📋 Allocation Process Log:');
      logs.rows.forEach((log, i) => {
        console.log(`   ${i + 1}. [${log.log_type}] ${log.message}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyAllocation();
