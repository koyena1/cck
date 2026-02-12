// run-guest-checkout-migration.js
// Script to run guest checkout database migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration from .env
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'cctv',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  console.log('\n================================');
  console.log('🚀 Guest Checkout Migration');
  console.log('================================\n');

  const client = await pool.connect();

  try {
    console.log('📊 Database Configuration:');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Database: ${process.env.DB_NAME || 'cctv'}`);
    console.log(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.log('');

    // Test connection
    console.log('🔌 Testing database connection...');
    await client.query('SELECT NOW()');
    console.log('✅ Connected to database successfully!\n');

    // Read SQL file
    const sqlFilePath = path.join(__dirname, 'add-guest-checkout-system.sql');
    console.log(`📄 Reading SQL file: ${sqlFilePath}`);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('Migration file not found: add-guest-checkout-system.sql');
    }

    const sql = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ SQL file loaded successfully!\n');

    // Execute migration
    console.log('⚙️  Running migration...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await client.query(sql);
    
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Migration completed successfully!\n');

    // Verify changes
    console.log('🔍 Verifying migration...');
    
    // Check if order_token column exists
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND column_name IN ('order_token', 'is_guest_order', 'tracking_link_sent')
      ORDER BY column_name
    `);

    console.log(`   Found ${columnCheck.rows.length} new columns in orders table:`);
    columnCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.column_name} (${row.data_type})`);
    });

    // Check if email_logs table exists
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'email_logs'
    `);

    if (tableCheck.rows.length > 0) {
      console.log('   ✓ email_logs table created');
    }

    // Check if views exist
    const viewCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name IN ('guest_order_tracking', 'admin_orders_view')
      ORDER BY table_name
    `);

    console.log(`   Found ${viewCheck.rows.length} views:`);
    viewCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    console.log('\n================================');
    console.log('🎉 Setup Complete!');
    console.log('================================\n');

    console.log('📋 Next Steps:');
    console.log('   1. ✅ Database migration - DONE');
    console.log('   2. Configure email settings in .env');
    console.log('   3. Test guest checkout at /buy-now');
    console.log('   4. Test tracking at /guest-track-order');
    console.log('   5. Check admin panel at /admin/orders\n');

    console.log('📖 Documentation:');
    console.log('   - GUEST-CHECKOUT-SYSTEM-GUIDE.md');
    console.log('   - GUEST-CHECKOUT-QUICK-REF.md\n');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error('Error details:', error.message);
    console.error('\n');
    
    if (error.message.includes('permission denied')) {
      console.error('💡 Permission Error:');
      console.error('   - Check database user permissions');
      console.error('   - User must have CREATE TABLE and ALTER TABLE privileges');
    } else if (error.message.includes('already exists')) {
      console.error('💡 Already Exists:');
      console.error('   - Migration may have already been run');
      console.error('   - Check if columns/tables already exist');
    } else if (error.message.includes('connect')) {
      console.error('💡 Connection Error:');
      console.error('   - Check if PostgreSQL is running');
      console.error('   - Verify database credentials in .env file');
      console.error('   - Ensure database "cctv" exists');
    }
    
    console.error('\n');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run migration
runMigration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
