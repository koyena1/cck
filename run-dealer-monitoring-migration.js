const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration from .env
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Koyen@123',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'cctv_platform',
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting dealer monitoring system migration...\n');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-dealer-monitoring-system.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Execute the SQL
    console.log('📝 Executing SQL migration...');
    await client.query(sqlContent);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables were created
    console.log('🔍 Verifying tables...');
    
    const tablesCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dealer_stock_updates', 'dealer_notifications')
      ORDER BY table_name;
    `);
    
    if (tablesCheck.rows.length === 2) {
      console.log('✅ Tables created:');
      tablesCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    } else {
      console.log('⚠️  Warning: Expected 2 tables, found:', tablesCheck.rows.length);
    }
    
    // Check views
    const viewsCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('dealer_stock_update_history', 'dealers_needing_alert')
      ORDER BY table_name;
    `);
    
    if (viewsCheck.rows.length > 0) {
      console.log('\n✅ Views created:');
      viewsCheck.rows.forEach(row => {
        console.log(`   - ${row.table_name}`);
      });
    }
    
    // Check functions
    const functionsCheck = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN (
        'log_dealer_stock_update',
        'get_dealer_last_stock_update',
        'get_days_since_stock_update'
      )
      ORDER BY routine_name;
    `);
    
    if (functionsCheck.rows.length > 0) {
      console.log('\n✅ Functions created:');
      functionsCheck.rows.forEach(row => {
        console.log(`   - ${row.routine_name}()`);
      });
    }
    
    // Check triggers
    const triggersCheck = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers 
      WHERE trigger_schema = 'public' 
      AND trigger_name = 'trigger_log_dealer_stock_update'
      ORDER BY trigger_name;
    `);
    
    if (triggersCheck.rows.length > 0) {
      console.log('\n✅ Triggers created:');
      triggersCheck.rows.forEach(row => {
        console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
      });
    }
    
    console.log('\n✅ Database migration completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Restart your dev server: npm run dev');
    console.log('   2. Login as admin and test the dealer monitoring system');
    console.log('   3. Send a test alert to a dealer\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Load environment variables
require('dotenv').config({ path: '.env.local' });

// Run migration
runMigration().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
