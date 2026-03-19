const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testAcceptedOrders() {
  try {
    console.log('Testing district orders with accepted dealer requests...\n');
    
    const query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.status,
        d.full_name as dealer_name,
        d.business_name as dealer_business_name,
        dor.request_status as dealer_request_status,
        dor.responded_at as dealer_response_at
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      LEFT JOIN dealer_order_requests dor ON o.order_id = dor.order_id AND dor.dealer_id = d.dealer_id
      WHERE d.district = $1 AND dor.request_status = 'accepted'
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query, ['Purba Medinipur']);
    
    console.log(`Found ${result.rows.length} accepted orders\n`);
    
    result.rows.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  Order Number: ${order.order_number}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Dealer: ${order.dealer_business_name || order.dealer_name}`);
      console.log(`  Request Status: ${order.dealer_request_status}`);
      console.log(`  Response At: ${order.dealer_response_at}`);
      console.log('');
    });
    
    if (result.rows.length > 0) {
      console.log('✅ These orders should show "Accepted" badge instead of "Update Status" button');
    } else {
      console.log('ℹ️ No accepted orders found in this district');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testAcceptedOrders();
