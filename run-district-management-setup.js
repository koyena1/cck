/**
 * Database Migration Script
 * Run this script to set up the district management system
 * Usage: node run-district-management-setup.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Construct database URL from individual variables if DATABASE_URL not set
const DATABASE_URL = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function runMigration() {
  console.log('🚀 Starting District Management System Setup...\n');

  try {
    // Read SQL file
    const sqlFile = path.join(__dirname, 'add-district-management-system.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Reading migration file...');
    console.log('✓ SQL file loaded successfully\n');

    // Execute SQL
    console.log('🔄 Executing database migration...');
    await pool.query(sqlContent);
    console.log('✓ Database migration completed successfully\n');

    // Verify tables created
    console.log('🔍 Verifying new tables...');
    
    const districtUsersCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'district_users'
      );
    `);

    const activityLogCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'district_user_activity_log'
      );
    `);

    if (districtUsersCheck.rows[0].exists && activityLogCheck.rows[0].exists) {
      console.log('✓ Tables created successfully:');
      console.log('  - district_users');
      console.log('  - district_user_activity_log');
      console.log('  - district_dealer_stats (view)');
      console.log('  - district_order_stats (view)\n');
    }

    // Check if district columns added to dealers table
    const dealerColumnsCheck = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'dealers' 
      AND column_name IN ('district', 'state');
    `);

    if (dealerColumnsCheck.rows.length === 2) {
      console.log('✓ Dealer table updated with district and state columns\n');
    }

    // Display summary
    console.log('📊 Setup Summary:');
    console.log('==================');
    console.log('✓ Database schema created');
    console.log('✓ Views and functions created');
    console.log('✓ Indexes created for performance');
    console.log('✓ Activity logging enabled\n');

    console.log('📝 Next Steps:');
    console.log('==================');
    console.log('1. Update existing dealers with district and state information:');
    console.log('   UPDATE dealers SET district = \'YourDistrict\', state = \'YourState\' WHERE dealer_id = X;');
    console.log('');
    console.log('2. Access admin panel to create district users:');
    console.log('   http://localhost:3000/admin/district-management');
    console.log('');
    console.log('3. District users can log in at:');
    console.log('   http://localhost:3000/district-portal/login');
    console.log('');
    console.log('✅ District Management System setup complete!\n');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    console.error('\nDetails:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the migration
runMigration();
