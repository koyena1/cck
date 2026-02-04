// Add Missing Price Columns
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

async function addMissingColumns() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Adding missing price columns...\n');

    // Add camera_types.price
    try {
      await pool.query('ALTER TABLE camera_types ADD COLUMN price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added camera_types.price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  camera_types.price already exists');
      } else {
        throw e;
      }
    }

    // Add brands.hd_price
    try {
      await pool.query('ALTER TABLE brands ADD COLUMN hd_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added brands.hd_price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  brands.hd_price already exists');
      } else {
        throw e;
      }
    }

    // Check if brands.ip_price exists
    try {
      await pool.query('ALTER TABLE brands ADD COLUMN ip_price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added brands.ip_price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  brands.ip_price already exists');
      } else {
        throw e;
      }
    }

    // Add channel_options.price
    try {
      await pool.query('ALTER TABLE channel_options ADD COLUMN price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added channel_options.price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  channel_options.price already exists');
      } else {
        throw e;
      }
    }

    // Add pixel_options.price
    try {
      await pool.query('ALTER TABLE pixel_options ADD COLUMN price DECIMAL(10,2) DEFAULT 0');
      console.log('✅ Added pixel_options.price');
    } catch (e) {
      if (e.message.includes('already exists')) {
        console.log('⚠️  pixel_options.price already exists');
      } else {
        throw e;
      }
    }

    console.log('\n📝 Setting default prices...\n');

    // Set default prices for camera types
    await pool.query("UPDATE camera_types SET price = 500 WHERE name = 'IP Camera'");
    await pool.query("UPDATE camera_types SET price = 300 WHERE name = 'HD Camera'");
    console.log('✅ Set camera type prices');

    // Set default brand prices
    await pool.query("UPDATE brands SET hd_price = 300, ip_price = 500 WHERE name = 'Hikvision'");
    await pool.query("UPDATE brands SET hd_price = 250, ip_price = 450 WHERE name = 'Dahua'");
    await pool.query("UPDATE brands SET hd_price = 200, ip_price = 400 WHERE name = 'CP Plus'");
    console.log('✅ Set brand prices');

    // Set default channel prices
    await pool.query("UPDATE channel_options SET price = 3500 WHERE channel_count = 4");
    await pool.query("UPDATE channel_options SET price = 5500 WHERE channel_count = 8");
    await pool.query("UPDATE channel_options SET price = 9500 WHERE channel_count = 16");
    await pool.query("UPDATE channel_options SET price = 15000 WHERE channel_count = 32");
    console.log('✅ Set channel prices');

    // Set default pixel prices
    await pool.query("UPDATE pixel_options SET price = 0 WHERE name = '2MP'");
    await pool.query("UPDATE pixel_options SET price = 200 WHERE name = '5MP'");
    await pool.query("UPDATE pixel_options SET price = 400 WHERE name = '8MP'");
    console.log('✅ Set pixel prices');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Verifying results...\n');

    // Verify
    const ctData = await pool.query("SELECT name, price FROM camera_types");
    console.log('Camera Types:');
    console.table(ctData.rows);

    const brandData = await pool.query("SELECT name, hd_price, ip_price FROM brands");
    console.log('\nBrands:');
    console.table(brandData.rows);

    const channelData = await pool.query("SELECT channel_count, price FROM channel_options");
    console.log('\nChannels:');
    console.table(channelData.rows);

    const pixelData = await pool.query("SELECT name, price FROM pixel_options");
    console.log('\nPixels:');
    console.table(pixelData.rows);

    console.log('\n✅ Now you can use the Update buttons in the admin panel!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

addMissingColumns();
