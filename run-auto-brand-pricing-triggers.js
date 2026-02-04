// Run Auto Brand Pricing Triggers Migration
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
    
    await pool.query('SELECT NOW()');
    console.log('✅ Database connected!\n');

    const sqlPath = path.join(__dirname, 'add-auto-brand-pricing-triggers.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('📝 Running SQL migration to create auto-pricing triggers...\n');
    
    await pool.query(sqlContent);
    console.log('✅ Triggers created successfully!\n');
    
    console.log('📊 Verifying triggers:');
    const result = await pool.query(`
      SELECT 
        trigger_name, 
        event_object_table, 
        action_statement
      FROM information_schema.triggers
      WHERE trigger_name IN ('trigger_auto_brand_pricing_on_camera_type_insert', 'trigger_auto_brand_pricing_on_brand_insert')
    `);
    
    if (result.rows.length > 0) {
      console.table(result.rows.map(r => ({
        trigger: r.trigger_name,
        table: r.event_object_table
      })));
    }
    
    console.log('\n📊 Current brand pricing entries:');
    const pricingResult = await pool.query(`
      SELECT COUNT(*) as total_entries, 
             COUNT(DISTINCT brand_id) as brands,
             COUNT(DISTINCT camera_type_id) as camera_types
      FROM brand_camera_type_pricing
    `);
    console.table(pricingResult.rows);

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n✨ Now when you add a new camera type in quotation management,');
    console.log('   all brands will automatically get a pricing column for it!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
