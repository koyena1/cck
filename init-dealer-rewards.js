// Script to initialize reward points for all active dealers
// Run this to ensure all dealers have reward entries

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function initializeDealerRewards() {
  try {
    console.log('🔄 Initializing dealer rewards system...\n');

    // Get all dealers
    const dealersResult = await pool.query(`
      SELECT dealer_id, full_name, business_name, status
      FROM dealers
      ORDER BY dealer_id
    `);

    console.log(`📊 Found ${dealersResult.rows.length} total dealers in the system\n`);

    if (dealersResult.rows.length === 0) {
      console.log('⚠️  No dealers found in the database.');
      console.log('   Create dealers first through the registration process.');
      return;
    }

    // Show dealer status breakdown
    const statusCount = {};
    dealersResult.rows.forEach(dealer => {
      const status = dealer.status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    console.log('Status Breakdown:');
    Object.keys(statusCount).forEach(status => {
      console.log(`  - ${status}: ${statusCount[status]} dealer(s)`);
    });
    console.log('');

    // Initialize rewards for all dealers
    const initResult = await pool.query(`
      INSERT INTO dealer_rewards (dealer_id, total_points)
      SELECT dealer_id, 0
      FROM dealers
      ON CONFLICT (dealer_id) DO NOTHING
    `);

    console.log(`✅ Initialized rewards for dealers (${initResult.rowCount} new entries created)\n`);

    // Show current rewards summary
    const rewardsResult = await pool.query(`
      SELECT 
        d.dealer_id,
        d.full_name,
        d.business_name,
        d.status,
        COALESCE(dr.total_points, 0) as total_points,
        COALESCE(dr.total_gifts_redeemed, 0) as total_gifts_redeemed
      FROM dealers d
      LEFT JOIN dealer_rewards dr ON d.dealer_id = dr.dealer_id
      ORDER BY d.dealer_id
    `);

    console.log('📋 Current Dealer Rewards Status:');
    console.log('='.repeat(80));
    rewardsResult.rows.forEach(dealer => {
      console.log(`ID: ${dealer.dealer_id} | ${dealer.full_name} (${dealer.business_name})`);
      console.log(`   Status: ${dealer.status || 'Unknown'} | Points: ${dealer.total_points} | Gifts: ${dealer.total_gifts_redeemed}`);
      console.log('-'.repeat(80));
    });

    // Count active dealers
    const activeResult = await pool.query(`
      SELECT COUNT(*) as count
      FROM dealers
      WHERE status IN ('Active', 'active', 'Approved', 'approved')
    `);

    const activeCount = parseInt(activeResult.rows[0].count);
    console.log(`\n✅ ${activeCount} dealer(s) with Active/Approved status`);
    
    if (activeCount === 0) {
      console.log('\n⚠️  WARNING: No dealers have Active/Approved status!');
      console.log('   To make dealers visible in the rewards system:');
      console.log('   1. Go to Admin Panel → Dealer Management');
      console.log('   2. Find dealers with "Pending Approval" status');
      console.log('   3. Click "Approve" to change their status to "Active"');
    }

    console.log('\n✅ Dealer rewards system initialization complete!');
    console.log('   Admins can now assign reward points from /admin/dealer-rewards\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

initializeDealerRewards();
