// Add HD/IP Price Columns to Camera Tech Types
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually load .env.local
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

async function addTechTypePrices() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Adding HD/IP price columns to camera_tech_types...\n');

    // Check current schema
    const columns = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'camera_tech_types'
      ORDER BY ordinal_position
    `);
    console.log('Current columns:', columns.rows.map(r => r.column_name));

    // Add hd_price column
    try {
      await pool.query('ALTER TABLE camera_tech_types ADD COLUMN hd_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added camera_tech_types.hd_price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  camera_tech_types.hd_price already exists');
      } else {
        throw e;
      }
    }

    // Add ip_price column
    try {
      await pool.query('ALTER TABLE camera_tech_types ADD COLUMN ip_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added camera_tech_types.ip_price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  camera_tech_types.ip_price already exists');
      } else {
        throw e;
      }
    }

    console.log('\n📝 Migrating existing base_price to hd_price and ip_price...\n');

    // Get all tech types
    const techTypes = await pool.query('SELECT id, name, camera_type, base_price FROM camera_tech_types');
    
    for (const tt of techTypes.rows) {
      const basePrice = parseFloat(tt.base_price) || 0;
      // Set both HD and IP to the same value as base_price initially
      await pool.query(
        'UPDATE camera_tech_types SET hd_price = $1, ip_price = $2 WHERE id = $3',
        [basePrice, basePrice, tt.id]
      );
      console.log(`✅ ${tt.name}: HD=${basePrice}, IP=${basePrice}`);
    }

    console.log('\n📊 Final verification:\n');

    const finalData = await pool.query(`
      SELECT name, camera_type, location, base_price, hd_price, ip_price 
      FROM camera_tech_types 
      ORDER BY camera_type, location, name
    `);
    console.table(finalData.rows);

    console.log('\n🎉 Migration completed! Now you can set separate HD/IP prices in the admin panel.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

addTechTypePrices();
