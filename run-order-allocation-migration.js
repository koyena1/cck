// Run Order Allocation System Migration
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
    console.log('✅ Environment variables loaded');
  } else {
    console.error('❌ .env.local file not found');
    process.exit(1);
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
    console.log('🔌 Connecting to database...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'add-order-allocation-system.sql');
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('Migration file not found: add-order-allocation-system.sql');
    }
    
    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('📄 SQL file loaded');
    
    // Execute the SQL
    console.log('⚙️  Running migration...\n');
    await pool.query(sql);
    
    console.log('✅ Migration completed successfully!\n');
    
    // Verify tables were created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN (
          'dealer_order_requests', 
          'order_allocation_log', 
          'order_allocation_settings'
        )
      ORDER BY table_name;
    `;
    
    const result = await pool.query(verifyQuery);
    
    console.log('📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Verify function was created
    const functionCheck = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name = 'find_dealers_with_stock'
    `);
    
    if (functionCheck.rows.length > 0) {
      console.log('   ✓ find_dealers_with_stock() function');
    }
    
    // Verify views were created
    const viewCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
        AND table_name IN ('active_dealer_requests', 'dealer_order_queue')
      ORDER BY table_name
    `);
    
    if (viewCheck.rows.length > 0) {
      console.log('\n📊 Views created:');
      viewCheck.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
    }
    
    // Check default settings
    const settingsCheck = await pool.query(`
      SELECT setting_key, setting_value 
      FROM order_allocation_settings 
      ORDER BY setting_key
    `);
    
    if (settingsCheck.rows.length > 0) {
      console.log('\n⚙️  Default settings:');
      settingsCheck.rows.forEach(row => {
        console.log(`   ${row.setting_key} = ${row.setting_value}`);
      });
    }
    
    console.log('\n🎉 Order Allocation System is ready to use!');
    console.log('\n📖 Next steps:');
    console.log('   1. Set up cron job for auto-escalation (see documentation)');
    console.log('   2. Integrate order allocation into order creation flow');
    console.log('   3. Test the complete workflow');
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    
    if (error.position) {
      console.error(`\nError at position ${error.position} in SQL file`);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
