const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function testDealerAPI() {
  try {
    // Test database query directly
    console.log('Testing dealer ID 3 query...\n');
    const result = await pool.query(
      `SELECT dealer_id, full_name, business_name, email, phone, address, gst_number, status 
       FROM dealers 
       WHERE dealer_id = $1 AND status = $2`,
      [3, 'Active']
    );

    if (result.rows.length > 0) {
      console.log('✅ Dealer ID 3 found in database:');
      console.table(result.rows);
    } else {
      console.log('❌ No dealer found with ID 3 and status Active');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

testDealerAPI();
