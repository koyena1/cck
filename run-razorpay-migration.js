const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cctv',
  password: process.env.DB_PASSWORD || 'root',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration() {
  try {
    console.log('🔧 Adding Razorpay payment columns to orders table...');
    
    const sqlPath = path.join(__dirname, 'add-razorpay-columns.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Razorpay columns added successfully!');
    console.log('   - payment_id');
    console.log('   - razorpay_order_id');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding Razorpay columns:', error);
    process.exit(1);
  }
}

runMigration();
