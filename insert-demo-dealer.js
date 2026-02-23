require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function insertDemoDealer() {
  try {
    console.log('🔧 Inserting demo dealer for pricing portal...\n');

    // Read the SQL file
    const sql = fs.readFileSync(
      path.join(__dirname, 'insert-demo-dealer.sql'),
      'utf-8'
    );

    // Execute the SQL
    await pool.query(sql);
    console.log('✅ Demo dealer created successfully!\n');

    // Verify
    const result = await pool.query(
      'SELECT dealer_id, full_name, business_name, email, status FROM dealers WHERE dealer_id = 1'
    );

    console.log('📊 Dealer Details:');
    console.table(result.rows);

    console.log('\n✅ You can now use the dealer pricing portal!');
    console.log('   Dealer ID 1 will be used automatically for transactions.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

insertDemoDealer();
