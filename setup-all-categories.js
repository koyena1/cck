// Setup All Category Tables
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  password: 'Koyen@123',
  database: 'cctv_platform',
  host: 'localhost',
  port: 5432,
  ssl: false,
});

async function setupAllTables() {
  try {
    console.log('🔧 Setting up all category tables...\n');

    const schemaPath = path.join(__dirname, 'schema-all-categories.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schemaSql);
    
    console.log('✅ All tables created successfully!\n');
    console.log('Tables created:');
    console.log('  ✓ ip_combo_products');
    console.log('  ✓ wifi_camera_products');
    console.log('  ✓ sim_4g_camera_products');
    console.log('  ✓ solar_camera_products');
    console.log('  ✓ body_worn_camera_products');
    console.log('  ✓ hd_camera_products');
    console.log('  ✓ ip_camera_products');
    console.log('\n🎉 Database ready for all categories!');
    
  } catch (error) {
    console.error('\n❌ Error setting up tables:');
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

setupAllTables();
