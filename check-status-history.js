const { Pool } = require('pg');

async function checkTables() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'cctv_platform',
    user: 'postgres',
    password: 'Koyen@123',
  });

  try {
    // Check if order_status_history exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'order_status_history'
      );
    `);
    
    console.log('\n📋 order_status_history table exists:', tableCheck.rows[0].exists);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Table does not exist - will create it\n');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTables();
