const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDealersSchema() {
  try {
    // Check columns in dealers table
    const schemaResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dealers'
      ORDER BY ordinal_position
    `);

    console.log('Dealers table columns:');
    console.table(schemaResult.rows);

    // Get dealer data with all available columns
    const dealerResult = await pool.query(`
      SELECT * FROM dealers WHERE dealer_id = 3
    `);

    console.log('\nDealer ID 3 data:');
    console.log(dealerResult.rows[0]);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDealersSchema();
