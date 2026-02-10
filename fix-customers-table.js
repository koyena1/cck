// Script to add missing columns to customers table
// This fixes the "column address does not exist" error

const { Pool } = require('pg');
require('dotenv').config();

async function fixCustomersTable() {
  console.log('🔧 Starting customers table fix...\n');

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Check current table structure
    console.log('📋 Checking current table structure...');
    const currentColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);

    console.log('Current columns:');
    currentColumns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });
    console.log('');

    // Check if address column exists
    const hasAddress = currentColumns.rows.some(col => col.column_name === 'address');
    const hasPincode = currentColumns.rows.some(col => col.column_name === 'pincode');

    if (!hasAddress) {
      console.log('➕ Adding "address" column...');
      await pool.query('ALTER TABLE customers ADD COLUMN address TEXT');
      console.log('✅ Column "address" added successfully\n');
    } else {
      console.log('✓ Column "address" already exists\n');
    }

    if (!hasPincode) {
      console.log('➕ Adding "pincode" column...');
      await pool.query('ALTER TABLE customers ADD COLUMN pincode VARCHAR(10)');
      console.log('✅ Column "pincode" added successfully\n');
    } else {
      console.log('✓ Column "pincode" already exists\n');
    }

    // Verify final structure
    console.log('📋 Final table structure:');
    const finalColumns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'customers'
      ORDER BY ordinal_position
    `);

    finalColumns.rows.forEach(col => {
      const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
      console.log(`  - ${col.column_name} (${col.data_type}) ${nullable}`);
    });

    console.log('\n✅ Customers table fix completed!');
    console.log('You can now test customer registration again.\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixCustomersTable();
