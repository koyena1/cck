// Add HD/IP Price Columns to Storage Options
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

async function addStoragePrices() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Adding HD/IP price columns to storage_options...\n');

    // Add hd_price column
    try {
      await pool.query('ALTER TABLE storage_options ADD COLUMN hd_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added storage_options.hd_price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  storage_options.hd_price already exists');
      } else {
        throw e;
      }
    }

    // Add ip_price column
    try {
      await pool.query('ALTER TABLE storage_options ADD COLUMN ip_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added storage_options.ip_price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  storage_options.ip_price already exists');
      } else {
        throw e;
      }
    }

    console.log('\n📝 Migrating existing price to hd_price and ip_price...\n');

    // Get all storage options
    const storage = await pool.query('SELECT id, capacity, price FROM storage_options');
    
    for (const item of storage.rows) {
      const basePrice = parseFloat(item.price) || 0;
      // Set both HD and IP to the same value as price initially
      await pool.query(
        'UPDATE storage_options SET hd_price = $1, ip_price = $2 WHERE id = $3',
        [basePrice, basePrice, item.id]
      );
      console.log(`✅ ${item.capacity}: HD=${basePrice}, IP=${basePrice}`);
    }

    console.log('\n📊 Final verification:\n');

    const finalData = await pool.query(`
      SELECT capacity, price, hd_price, ip_price 
      FROM storage_options 
      ORDER BY display_order
    `);
    console.table(finalData.rows);

    console.log('\n🎉 Migration completed! Now you can set separate HD/IP prices for storage in the admin panel.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

addStoragePrices();
