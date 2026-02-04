// Check Database Schema
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

async function checkSchema() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔍 Checking current database schema...\n');

    // Check camera_types columns
    const ctColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'camera_types'
      ORDER BY ordinal_position
    `);
    console.log('📊 camera_types columns:');
    console.table(ctColumns.rows);

    // Check brands columns
    const brandColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'brands'
      ORDER BY ordinal_position
    `);
    console.log('\n📊 brands columns:');
    console.table(brandColumns.rows);

    // Check channel_options columns
    const channelColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'channel_options'
      ORDER BY ordinal_position
    `);
    console.log('\n📊 channel_options columns:');
    console.table(channelColumns.rows);

    // Check pixel_options columns
    const pixelColumns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'pixel_options'
      ORDER BY ordinal_position
    `);
    console.log('\n📊 pixel_options columns:');
    console.table(pixelColumns.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
