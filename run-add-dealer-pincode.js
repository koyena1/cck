// Run migration to add pincode column to dealers table
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
    console.log('🚀 Running migration: Add pincode column to dealers\n');
    
    // Read the SQL file
    const sqlFile = fs.readFileSync(
      path.join(__dirname, 'add-dealer-pincode.sql'),
      'utf8'
    );
    
    // Execute the SQL
    await pool.query(sqlFile);
    
    console.log('✅ Migration completed successfully!');
    console.log('   - Added pincode column to dealers table');
    console.log('   - Column accepts pincode values (VARCHAR 10)\n');
    
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
