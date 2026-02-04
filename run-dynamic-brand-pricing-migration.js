// Run Dynamic Brand Pricing Migration Script
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

async function runMigration() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log('🔌 Connecting to database...');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME}`);
    console.log(`   User: ${process.env.DB_USER}`);
    
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected!\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'add-dynamic-brand-pricing.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running SQL migration...\n');
    
    // Execute the entire script at once (it contains a DO block)
    await pool.query(sqlContent);
    console.log('✅ Migration executed successfully!\n');
    
    // Show the results
    console.log('📊 Current brand pricing data:');
    const result = await pool.query(`
      SELECT 
        b.name as brand,
        ct.name as camera_type,
        bctp.price
      FROM brand_camera_type_pricing bctp
      JOIN brands b ON bctp.brand_id = b.id
      JOIN camera_types ct ON bctp.camera_type_id = ct.id
      ORDER BY b.name, ct.name
    `);
    
    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('No brand pricing data yet. This is normal for a fresh installation.');
    }

    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
