// Run migration to add pincodes column to district_users table
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('🚀 Running migration: Add pincodes column to district_users\n');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'add-district-manager-pincodes.sql'),
      'utf8'
    );
    
    // Execute the SQL
    await pool.query(sqlFile);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added pincodes column to district_users table');
    console.log('   - Column accepts comma-separated pincode values\n');
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Column already exists - no changes needed');
    } else {
      console.error('❌ Migration failed:', error.message);
      process.exit(1);
    }
  } finally {
    await pool.end();
  }
}

runMigration();
