const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDealerOrderQueue() {
  try {
    console.log('Checking dealer_order_queue view columns...\n');
    
    const result = await pool.query(`
      SELECT * FROM dealer_order_queue LIMIT 1
    `);
    
    if (result.rows.length > 0) {
      console.log('Columns in dealer_order_queue:');
      Object.keys(result.rows[0]).forEach(col => {
        console.log(`  - ${col}: ${typeof result.rows[0][col]}`);
      });
    } else {
      console.log('No data in dealer_order_queue');
      
      // Check the view definition
      const viewDef = await pool.query(`
        SELECT pg_get_viewdef('dealer_order_queue', true) as definition
      `);
      console.log('\nView definition:');
      console.log(viewDef.rows[0].definition);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDealerOrderQueue();
