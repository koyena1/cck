// run-guest-checkout-migration-interactive.js
// Interactive script to run guest checkout database migration
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function runMigration() {
  console.log('\n================================');
  console.log('🚀 Guest Checkout Migration (Interactive)');
  console.log('================================\n');

  try {
    // Get database credentials
    console.log('📋 Enter Database Credentials:\n');
    
    const dbHost = await question(`Database Host [localhost]: `);
    const dbPort = await question(`Database Port [5432]: `);
    const dbName = await question(`Database Name [cctv]: `);
    const dbUser = await question(`Database User [postgres]: `);
    const dbPassword = await question(`Database Password: `);

    console.log('\n');

    const config = {
      user: dbUser || 'postgres',
      password: dbPassword,
      database: dbName || 'cctv',
      host: dbHost || 'localhost',
      port: parseInt(dbPort || '5432'),
    };

    console.log('📊 Using Configuration:');
    console.log(`   Host: ${config.host}`);
    console.log(`   Port: ${config.port}`);
    console.log(`   Database: ${config.database}`);
    console.log(`   User: ${config.user}`);
    console.log('');

    const pool = new Pool(config);
    const client = await pool.connect();

    try {
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

      console.log('💡 Update your .env file with the correct password:');
      console.log(`   DB_PASSWORD=${dbPassword}\n`);

      console.log('📋 Next Steps:');
      console.log('   1. ✅ Database migration - DONE');
      console.log('   2. Update DB_PASSWORD in .env file');
      console.log('   3. Configure email settings in .env');
      console.log('   4. Test guest checkout at /buy-now');
      console.log('   5. Test tracking at /guest-track-order');
      console.log('   6. Check admin panel at /admin/orders\n');

    } catch (error) {
      console.error('\n❌ Migration failed!');
      console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.error('Error:', error.message);
      console.error('\n');
      
      if (error.message.includes('permission denied')) {
        console.error('💡 Permission Error:');
        console.error('   - Check database user permissions');
        console.error('   - User must have CREATE TABLE and ALTER TABLE privileges');
      } else if (error.message.includes('already exists')) {
        console.error('💡 Already Exists:');
        console.error('   - Migration may have already been run');
        console.error('   - Check if columns/tables already exist');
      }
      
      throw error;
    } finally {
      client.release();
      await pool.end();
    }

  } catch (error) {
    console.error('\nFatal error:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run migration
runMigration();
