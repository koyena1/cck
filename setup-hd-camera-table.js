const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cctv',
  password: process.env.DB_PASSWORD || 'root',
  port: process.env.DB_PORT || 5432,
});

async function setupTable() {
  try {
    console.log('🔍 Checking if hd_camera_products table exists...');
    
    // Check if table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'hd_camera_products'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Table hd_camera_products already exists!');
      
      // Count rows
      const count = await pool.query('SELECT COUNT(*) FROM hd_camera_products');
      console.log(`📊 Current products: ${count.rows[0].count}`);
    } else {
      console.log('❌ Table does not exist. Creating now...');
      
      // Create table
      await pool.query(`
        CREATE TABLE IF NOT EXISTS hd_camera_products (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          brand VARCHAR(100) NOT NULL,
          camera_type VARCHAR(50) NOT NULL,
          resolution VARCHAR(20) NOT NULL,
          lens VARCHAR(50),
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
      `);
      
      console.log('✅ Table created successfully!');
      
      // Create indexes
      await pool.query('CREATE INDEX IF NOT EXISTS idx_hd_camera_brand ON hd_camera_products(brand);');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_hd_camera_active ON hd_camera_products(is_active);');
      
      console.log('✅ Indexes created successfully!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure PostgreSQL is running');
    console.error('2. Check your .env file has correct database credentials');
    console.error('3. Verify database "cctv" exists');
    console.error('4. Check PostgreSQL port (default: 5432)');
  } finally {
    await pool.end();
  }
}

setupTable();
