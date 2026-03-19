const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432
});

async function runRewardsMigration() {
  try {
    console.log('🚀 Starting Dealer Rewards System migration...\n');

    const sqlFile = path.join(__dirname, 'add-dealer-rewards-system-v2.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📄 Executing SQL migration...');
    await pool.query(sql);

    console.log('\n✅ Migration completed successfully!\n');

    // Verify tables were created
    const tablesCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dealer_rewards', 'reward_transactions')
      ORDER BY table_name
    `);

    console.log('📊 Created tables:');
    tablesCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });

    // Check view
    const viewCheck = await pool.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      AND table_name = 'dealer_reward_summary'
    `);

    if (viewCheck.rows.length > 0) {
      console.log('   ✓ dealer_reward_summary (view)');
    }

    // Check functions
    const functionsCheck = await pool.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN ('add_delivery_reward_points', 'adjust_dealer_points')
      ORDER BY routine_name
    `);

    console.log('\n📋 Created functions:');
    functionsCheck.rows.forEach(row => {
      console.log(`   ✓ ${row.routine_name}()`);
    });

    // Show initial rewards
    const rewardsCheck = await pool.query(`
      SELECT COUNT(*) as dealer_count
      FROM dealer_rewards
    `);

    console.log(`\n🎁 Initialized rewards for ${rewardsCheck.rows[0].dealer_count} dealers`);
    console.log('\n✨ Dealer Rewards System is ready!');
    console.log('   - 100 points for 24-hour delivery');
    console.log('   - 5000 points = 1 gift\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runRewardsMigration();
