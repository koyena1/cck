const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    ssl: false
  });

  try {
    console.log('🔄 Starting dealer Razorpay columns migration...\n');

    // Read SQL file
    const fs = require('fs');
    const sql = fs.readFileSync('./add-dealer-razorpay-columns.sql', 'utf8');
    
    // Execute migration
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('\n📋 Columns added to dealer_transactions:');
    console.log('   - razorpay_order_id');
    console.log('   - razorpay_payment_id');
    console.log('   - razorpay_signature');
    console.log('\n🎉 Dealer Razorpay integration is ready!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
