const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDistrictOrdersAPI() {
  try {
    console.log('Testing district orders API query...\n');
    
    const result = await pool.query(`
      SELECT 
        o.order_id,
        o.order_number,
        o.status,
        d.full_name as dealer_name,
        d.business_name as dealer_business_name,
        dor.request_status as dealer_request_status,
        dor.responded_at as dealer_response_at,
        dor.dealer_notes
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      LEFT JOIN dealer_order_requests dor ON o.order_id = dor.order_id AND dor.dealer_id = d.dealer_id
      WHERE d.district = $1
      LIMIT 5
    `, ['Purba Medinipur']);
    
    console.log(`Found ${result.rows.length} orders\n`);
    
    result.rows.forEach((order, index) => {
      console.log(`Order ${index + 1}:`);
      console.log(`  Order Number: ${order.order_number}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Dealer: ${order.dealer_business_name || order.dealer_name}`);
      console.log(`  Dealer Request Status: ${order.dealer_request_status || 'Not responded'}`);
      console.log(`  Dealer Response At: ${order.dealer_response_at || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Detail:', error.detail);
  } finally {
    await pool.end();
  }
}

testDistrictOrdersAPI();
