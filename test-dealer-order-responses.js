const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDealerOrderResponses() {
  try {
    const dealerId = 4; // Sample dealer ID
    
    console.log('Testing dealer order responses...\n');
    
    // Test pending requests
    console.log('1. Fetching pending requests:');
    const pendingQuery = `
      SELECT * FROM dealer_order_queue
      WHERE dealer_id = $1
      ORDER BY response_deadline ASC
    `;
    const pendingResult = await pool.query(pendingQuery, [dealerId]);
    console.log(`   Found ${pendingResult.rows.length} pending requests\n`);
    
    // Test accepted orders
    console.log('2. Fetching accepted orders:');
    const acceptedQuery = `
      SELECT 
        dor.*,
        o.order_number,
        o.customer_name,
        o.total_amount
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      WHERE dor.dealer_id = $1 AND dor.request_status = 'accepted'
      ORDER BY dor.responded_at DESC
    `;
    const acceptedResult = await pool.query(acceptedQuery, [dealerId]);
    console.log(`   Found ${acceptedResult.rows.length} accepted orders`);
    if (acceptedResult.rows.length > 0) {
      console.log('   Sample:', acceptedResult.rows[0].order_number);
    }
    console.log('');
    
    // Test declined orders
    console.log('3. Fetching declined orders:');
    const declinedQuery = `
      SELECT 
        dor.id as request_id,
        o.order_number,
        o.customer_name,
        o.total_amount
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      WHERE dor.dealer_id = $1 AND dor.request_status = 'declined'
      ORDER BY dor.responded_at DESC
    `;
    const declinedResult = await pool.query(declinedQuery, [dealerId]);
    console.log(`   Found ${declinedResult.rows.length} declined orders`);
    if (declinedResult.rows.length > 0) {
      console.log('   Sample:', declinedResult.rows[0].order_number);
      console.log('   request_id:', declinedResult.rows[0].request_id);
    }
    console.log('');
    
    console.log('✅ All queries executed successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testDealerOrderResponses();
