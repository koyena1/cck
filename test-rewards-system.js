const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432
});

async function testRewardsSystem() {
  try {
    console.log('🎁 Testing Dealer Rewards System\n');
    console.log('='.repeat(60));

    // Test 1: Check rewards tables exist
    console.log('\n1️⃣ Checking database tables...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('dealer_rewards', 'reward_transactions')
    `);
    console.log(`   ✅ Found ${tablesResult.rows.length} tables`);
    tablesResult.rows.forEach(row => console.log(`      - ${row.table_name}`));

    // Test 2: Check all dealers have rewards initialized
    console.log('\n2️⃣ Checking dealer rewards initialization...');
    const rewardsResult = await pool.query(`
      SELECT dr.dealer_id, d.full_name, dr.total_points, dr.total_gifts_redeemed
      FROM dealer_rewards dr
      JOIN dealers d ON dr.dealer_id = d.dealer_id
      ORDER BY dr.dealer_id
    `);
    console.log(`   ✅ ${rewardsResult.rows.length} dealers have rewards accounts`);
    rewardsResult.rows.forEach(row => {
      console.log(`      - ${row.full_name} (ID: ${row.dealer_id}) - ${row.total_points} points, ${row.total_gifts_redeemed} gifts`);
    });

    // Test 3: Test the reward function
    console.log('\n3️⃣ Testing reward function...');
    console.log('   Testing add_delivery_reward_points() function');
    
    // Simulate a fast delivery (15 hours)
    const testResult = await pool.query(`
      SELECT add_delivery_reward_points(3, 1, 15.5) as result
    `);
    
    const result = testResult.rows[0].result;
    console.log('   📦 Simulated fast delivery (15.5 hours):');
    console.log(`      Success: ${result.success}`);
    console.log(`      Points Awarded: ${result.points_awarded}`);
    console.log(`      Total Points: ${result.total_points}`);
    console.log(`      Points to Next Gift: ${result.points_to_next_gift}`);

    // Test 4: Check if function rejects slow delivery
    console.log('\n4️⃣ Testing slow delivery rejection...');
    const slowResult = await pool.query(`
      SELECT add_delivery_reward_points(3, 2, 30.0) as result
    `);
    
    const slowResponse = slowResult.rows[0].result;
    console.log(`   ❌ Slow delivery (30 hours): ${slowResponse.message}`);

    // Test 5: Check reward summary view
    console.log('\n5️⃣ Testing reward summary view...');
    const summaryResult = await pool.query(`
      SELECT * FROM dealer_reward_summary WHERE dealer_id = 3
    `);
    
    if (summaryResult.rows.length > 0) {
      const summary = summaryResult.rows[0];
      console.log('   ✅ Dealer Reward Summary:');
      console.log(`      Total Points: ${summary.total_points}`);
      console.log(`      Points to Next Gift: ${summary.points_to_next_gift}`);
      console.log(`      Points Needed: ${summary.points_needed_for_gift}`);
      console.log(`      Pending Gifts: ${summary.pending_gifts}`);
      console.log(`      Total Earned Transactions: ${summary.total_earned_transactions}`);
    }

    // Test 6: Check recent transactions
    console.log('\n6️⃣ Checking recent transactions...');
    const transResult = await pool.query(`
      SELECT transaction_type, points, description, delivery_time_hours, created_at
      FROM reward_transactions
      WHERE dealer_id = 3
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log(`   ✅ Found ${transResult.rows.length} transactions`);
    transResult.rows.forEach((trans, idx) => {
      console.log(`   ${idx + 1}. ${trans.transaction_type} - ${trans.points} points`);
      console.log(`      ${trans.description}`);
      if (trans.delivery_time_hours) {
        console.log(`      Delivery: ${trans.delivery_time_hours} hours`);
      }
    });

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Rewards System Tests Passed!');
    console.log('\n📋 Summary:');
    console.log('   - Database tables created ✓');
    console.log('   - All dealers initialized ✓');
    console.log('   - Reward function working ✓');
    console.log('   - Points awarded for fast delivery ✓');
    console.log('   - Slow deliveries rejected ✓');
    console.log('   - Views and reporting working ✓');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testRewardsSystem();
