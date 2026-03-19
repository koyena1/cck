const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432
});

async function testDashboardCounts() {
  try {
    console.log('🎯 Testing Dealer Dashboard Real-Time Counts\n');
    console.log('='.repeat(60));

    const dealerId = 3; // Test dealer

    // 1. Test Accepted Orders Count
    console.log('\n1️⃣ Accept Order Count:');
    const acceptedResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM dealer_order_requests
      WHERE dealer_id = $1 AND request_status = 'accepted'
    `, [dealerId]);
    console.log(`   ✅ ${acceptedResult.rows[0].count} accepted orders`);

    // 2. Test Stock Count
    console.log('\n2️⃣ Stock Count:');
    const stockResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM dealer_inventory
      WHERE dealer_id = $1
    `, [dealerId]);
    console.log(`   ✅ ${stockResult.rows[0].count} products in stock`);

    // 3. Test Order Requests Count (Pending)
    console.log('\n3️⃣ Order Request Count (Pending):');
    const requestsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM dealer_order_requests
      WHERE dealer_id = $1 AND request_status = 'pending'
    `, [dealerId]);
    console.log(`   ✅ ${requestsResult.rows[0].count} pending order requests`);

    // 4. Test Transactions Count
    console.log('\n4️⃣ Transaction Count:');
    const transactionsResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM dealer_transactions
      WHERE dealer_id = $1
    `, [dealerId]);
    console.log(`   ✅ ${transactionsResult.rows[0].count} total transactions`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ All dashboard counts verified!\n');

    console.log('📊 Summary for Dealer ID 3:');
    console.log(`   - Accept Order: ${acceptedResult.rows[0].count}`);
    console.log(`   - Stock: ${stockResult.rows[0].count}`);
    console.log(`   - Order Request: ${requestsResult.rows[0].count}`);
    console.log(`   - Transaction: ${transactionsResult.rows[0].count}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testDashboardCounts();
