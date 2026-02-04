// Setup HD Combo Products Table
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection (update these if different)
const pool = new Pool({
  user: 'postgres',
  password: 'Koyen@123',
  database: 'cctv_platform',
  host: 'localhost',
  port: 5432,
  ssl: false,
});

async function setupTable() {
  try {
    console.log('🔌 Connecting to database...');
    console.log(`Host: localhost`);
    console.log(`Database: cctv_platform`);
    console.log(`User: postgres`);
    
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'schema-hd-combo-products.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('\n📊 Creating hd_combo_products table...');
    await pool.query(schemaSql);
    
    console.log('\n✅ Success! Table created successfully!');
    console.log('\n📋 Next steps:');
    console.log('1. Restart your development server if it\'s running');
    console.log('2. Go to: http://localhost:3000/admin/categories/hd-combo');
    console.log('3. Click "Add Product" to add your first HD Combo product');
    console.log('\n🎉 You\'re all set!');
    
  } catch (error) {
    console.error('\n❌ Error setting up table:');
    console.error(error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n💡 Solution: Make sure PostgreSQL is running');
    } else if (error.code === '42P07') {
      console.log('\n✓ Table already exists - no action needed');
    } else if (error.message.includes('password')) {
      console.error('\n💡 Solution: Check your database password in .env.local');
    } else {
      console.error('\n💡 Please check your database connection settings in .env.local');
    }
  } finally {
    await pool.end();
  }
}

setupTable();
