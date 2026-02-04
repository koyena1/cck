// Fix HD Combo Products Table Schema
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'Koyen@123',
  database: 'cctv_platform',
  host: 'localhost',
  port: 5432,
  ssl: false,
});

async function fixSchema() {
  try {
    console.log('🔧 Fixing hd_combo_products table schema...\n');

    // Drop and recreate the table with correct schema
    const dropTableSQL = 'DROP TABLE IF EXISTS hd_combo_products CASCADE;';
    
    const createTableSQL = `
      CREATE TABLE hd_combo_products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        brand VARCHAR(100) NOT NULL,
        channels INTEGER NOT NULL,
        camera_type VARCHAR(50) NOT NULL,
        resolution VARCHAR(20) NOT NULL,
        hdd VARCHAR(50) NOT NULL,
        cable VARCHAR(50) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2) NOT NULL,
        image TEXT,
        specs TEXT[],
        rating DECIMAL(2, 1) DEFAULT 4.5,
        reviews INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX idx_hd_combo_brand ON hd_combo_products(brand);
      CREATE INDEX idx_hd_combo_active ON hd_combo_products(is_active);
      CREATE INDEX idx_hd_combo_channels ON hd_combo_products(channels);
    `;

    console.log('📊 Dropping old table if exists...');
    await pool.query(dropTableSQL);
    
    console.log('✨ Creating new table with correct schema...');
    await pool.query(createTableSQL);
    
    console.log('\n✅ Success! Table recreated with correct schema!');
    console.log('\n📋 Table structure:');
    console.log('  - id, name, brand, channels, camera_type');
    console.log('  - resolution, hdd, cable, price, original_price');
    console.log('  - image, specs, rating, reviews, is_active');
    console.log('  - created_at, updated_at');
    console.log('\n🎉 You can now add products without errors!');
    
  } catch (error) {
    console.error('\n❌ Error fixing schema:');
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

fixSchema();
