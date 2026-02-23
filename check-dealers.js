require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDealers() {
  try {
    console.log('📊 Checking active dealers in database...\n');

    const result = await pool.query(`
      SELECT 
        dealer_id, 
        full_name,
        business_name,
        email,
        phone_number,
        location,
        status,
        rating,
        completed_jobs
      FROM dealers 
      WHERE status = 'Active'
      ORDER BY dealer_id
    `);

    if (result.rows.length === 0) {
      console.log('❌ No active dealers found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} active dealer(s):\n`);
      console.table(result.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkDealers();
