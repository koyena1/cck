/**
 * SETUP AUTOMATIC STOCK ALERT SYSTEM
 * Installs the database schema for automatic stock alerts
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupAutoStockAlertSystem() {
  console.log('\n========================================');
  console.log('AUTOMATIC STOCK ALERT SYSTEM SETUP');
  console.log('========================================\n');

  const client = await pool.connect();

  try {
    // Read SQL file
    const sqlFile = 'add-automatic-stock-alert-system.sql';
    
    if (!fs.existsSync(sqlFile)) {
      console.error('❌ SQL file not found:', sqlFile);
      process.exit(1);
    }

    console.log('📄 Reading SQL migration file...');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('🔄 Running SQL migration...\n');
    await client.query(sql);

    console.log('✅ SQL migration completed successfully\n');

    // Verify installation
    console.log('🔍 Verifying installation...\n');

    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('dealer_auto_alert_history')
    `);

    if (tableCheck.rows.length > 0) {
      console.log('✅ Table "dealer_auto_alert_history" created');
    } else {
      console.log('❌ Table verification failed');
    }

    const viewCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name = 'dealers_needing_auto_alert'
    `);

    if (viewCheck.rows.length > 0) {
      console.log('✅ View "dealers_needing_auto_alert" created');
    } else {
      console.log('❌ View verification failed');
    }

    console.log('\n========================================');
    console.log('✅ SETUP COMPLETE!');
    console.log('========================================\n');

    console.log('Next steps:');
    console.log('1. Test the cron job manually:');
    console.log('   node auto-stock-alert-cron.js\n');
    console.log('2. Schedule automatic execution:');
    console.log('   .\\auto-stock-alert-scheduler.ps1\n');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (require.main === module) {
  setupAutoStockAlertSystem()
    .then(() => {
      console.log('Setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupAutoStockAlertSystem };
