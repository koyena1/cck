// Fix Camera Type Prices
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

async function fixPrices() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔧 Fixing camera type prices...\n');

    // Check actual camera type names
    const ctResult = await pool.query("SELECT id, name FROM camera_types");
    console.log('Current camera types:');
    console.table(ctResult.rows);

    // Update based on actual names
    for (const row of ctResult.rows) {
      const name = row.name.toLowerCase().trim();
      let price = 0;
      
      if (name.includes('ip')) {
        price = 500;
        await pool.query("UPDATE camera_types SET price = $1 WHERE id = $2", [price, row.id]);
        console.log(`✅ Set ${row.name} = ₹${price}`);
      } else if (name.includes('hd')) {
        price = 300;
        await pool.query("UPDATE camera_types SET price = $1 WHERE id = $2", [price, row.id]);
        console.log(`✅ Set ${row.name} = ₹${price}`);
      }
    }

    // Check for 8MP pixel option
    const pixelResult = await pool.query("SELECT id, name FROM pixel_options WHERE name LIKE '%8%'");
    if (pixelResult.rows.length > 0) {
      await pool.query("UPDATE pixel_options SET price = 400 WHERE id = $1", [pixelResult.rows[0].id]);
      console.log(`✅ Set ${pixelResult.rows[0].name} = ₹400`);
    }

    // Set Honeywell prices
    await pool.query("UPDATE brands SET hd_price = 280, ip_price = 480 WHERE name = 'Honeywell'");
    console.log('✅ Set Honeywell prices: HD=₹280, IP=₹480');

    console.log('\n📊 Final verification:\n');

    const finalCT = await pool.query("SELECT name, price FROM camera_types ORDER BY id");
    console.log('Camera Types:');
    console.table(finalCT.rows);

    const finalBrands = await pool.query("SELECT name, hd_price, ip_price FROM brands ORDER BY id");
    console.log('\nBrands:');
    console.table(finalBrands.rows);

    const finalPixels = await pool.query("SELECT name, price FROM pixel_options ORDER BY id");
    console.log('\nPixels:');
    console.table(finalPixels.rows);

    console.log('\n🎉 All prices set! Now refresh your admin panel and try the Update buttons.');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

fixPrices();
