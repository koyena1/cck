const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432,
});

async function migrateAllCategories() {
  console.log('🔧 Starting migration for all category tables...\n');

  try {
    // First, drop existing tables
    console.log('Dropping existing tables...');
    await pool.query('DROP TABLE IF EXISTS hd_combo_products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS ip_combo_products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS wifi_camera_products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS sim_4g_camera_products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS solar_camera_products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS body_worn_camera_products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS hd_camera_products CASCADE;');
    await pool.query('DROP TABLE IF EXISTS ip_camera_products CASCADE;');
    console.log('✅ Existing tables dropped\n');

    // Read and execute schema
    console.log('Creating new tables...');
    const schemaPath = path.join(__dirname, 'schema-all-categories.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    await pool.query(schema);
    console.log('✅ All category tables created successfully!\n');

    // Verify tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%_products'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tables created:');
    result.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });
    
  } catch (error) {
    console.error('❌ Migration error:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateAllCategories();
