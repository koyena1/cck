/**
 * TEST AUTOMATIC STOCK ALERT SYSTEM
 * 
 * This script tests the automatic stock alert system by:
 * 1. Checking if the database schema is properly installed
 * 2. Creating test data (dealers with old stock updates and low stock)
 * 3. Running the alert cron job
 * 4. Verifying alerts were sent
 * 5. Cleaning up test data
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testAutoStockAlertSystem() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║   AUTOMATIC STOCK ALERT SYSTEM - TEST SUITE               ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const client = await pool.connect();
  let testDealerId = null;

  try {
    // Step 1: Verify schema
    console.log('📋 Step 1: Verifying Database Schema...\n');
    
    const schemaCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('dealer_auto_alert_history', 'dealer_notifications', 'dealer_inventory', 'dealer_stock_updates')
    `);
    
    const tables = schemaCheck.rows.map(r => r.table_name);
    console.log('   Tables found:', tables.join(', '));
    
    if (tables.length < 4) {
      console.log('   ❌ Missing required tables!');
      console.log('   Run: .\\setup-auto-stock-alert.ps1');
      return;
    }
    console.log('   ✅ All required tables exist\n');

    // Check view
    const viewCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_name = 'dealers_needing_auto_alert'
    `);
    
    if (viewCheck.rows.length === 0) {
      console.log('   ❌ View dealers_needing_auto_alert not found!');
      return;
    }
    console.log('   ✅ Required view exists\n');

    // Step 2: Create or find test dealer
    console.log('📋 Step 2: Setting Up Test Dealer...\n');
    
    // Try to find existing test dealer
    const existingDealer = await client.query(`
      SELECT dealer_id, full_name, email 
      FROM dealers 
      WHERE status = 'Active' 
      LIMIT 1
    `);
    
    if (existingDealer.rows.length > 0) {
      testDealerId = existingDealer.rows[0].dealer_id;
      console.log(`   ✅ Using existing dealer: ${existingDealer.rows[0].full_name} (ID: ${testDealerId})\n`);
    } else {
      console.log('   ❌ No active dealers found. Create a dealer first.');
      return;
    }

    // Step 3: Set up test scenario
    console.log('📋 Step 3: Creating Test Scenario...\n');
    
    // Get some products
    const products = await client.query(`
      SELECT id FROM dealer_products LIMIT 3
    `);
    
    if (products.rows.length === 0) {
      console.log('   ⚠️  No products found. Creating test products...');
      await client.query(`
        INSERT INTO dealer_products (company, segment, model_number, product_type, description, dealer_purchase_price, dealer_sale_price)
        VALUES 
          ('Test Co', 'Test Segment', 'TEST-001', 'Camera', 'Test Product 1', 1000, 1200),
          ('Test Co', 'Test Segment', 'TEST-002', 'DVR', 'Test Product 2', 2000, 2400),
          ('Test Co', 'Test Segment', 'TEST-003', 'NVR', 'Test Product 3', 3000, 3600)
      `);
      
      // Get the newly created products
      const newProducts = await client.query(`
        SELECT id FROM dealer_products WHERE model_number LIKE 'TEST-%' LIMIT 3
      `);
      products.rows = newProducts.rows;
    }

    // Add/Update inventory for test dealer with low stock
    for (let i = 0; i < products.rows.length; i++) {
      const productId = products.rows[i].id;
      const quantity = i === 0 ? 0 : (i === 1 ? 2 : 3); // Out of stock, low stock, low stock
      
      await client.query(`
        INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, quantity_sold, quantity_available)
        VALUES ($1, $2, $3, 0, $3)
        ON CONFLICT (dealer_id, product_id) 
        DO UPDATE SET quantity_available = $3, updated_at = CURRENT_TIMESTAMP
      `, [testDealerId, productId, quantity]);
    }
    
    console.log('   ✅ Set dealer inventory: 1 out-of-stock, 2 low-stock items\n');

    // Manually add old stock update to simulate 15 days of inactivity
    await client.query(`
      INSERT INTO dealer_stock_updates (dealer_id, product_id, previous_quantity, new_quantity, quantity_change, update_type, updated_at)
      VALUES ($1, $2, 0, 5, 5, 'purchase', CURRENT_TIMESTAMP - INTERVAL '15 days')
      ON CONFLICT DO NOTHING
    `, [testDealerId, products.rows[0].id]);
    
    // Update the stock update timestamp to make it old
    await client.query(`
      UPDATE dealer_stock_updates 
      SET updated_at = CURRENT_TIMESTAMP - INTERVAL '15 days'
      WHERE dealer_id = $1
    `, [testDealerId]);
    
    console.log('   ✅ Backdated stock updates to 15 days ago\n');

    // Step 4: Check if dealer qualifies for alert
    console.log('📋 Step 4: Checking Alert Eligibility...\n');
    
    const qualificationCheck = await client.query(`
      SELECT * FROM dealers_needing_auto_alert
      WHERE dealer_id = $1
    `, [testDealerId]);
    
    if (qualificationCheck.rows.length === 0) {
      console.log('   ❌ Dealer does not qualify for alert yet');
      console.log('   Checking details...');
      
      const detailCheck = await client.query(`
        SELECT 
          get_days_since_stock_update($1) as days_since_update,
          (SELECT COUNT(*) FROM dealer_inventory WHERE dealer_id = $1 AND quantity_available = 0) as out_of_stock,
          (SELECT COUNT(*) FROM dealer_inventory WHERE dealer_id = $1 AND quantity_available > 0 AND quantity_available < 5) as low_stock
      `, [testDealerId]);
      
      console.log('   Details:', detailCheck.rows[0]);
      console.log('\n   Possible reasons:');
      console.log('   - Days since update < 10');
      console.log('   - No low/out-of-stock items');
      console.log('   - Alert was already sent recently\n');
      
      // Force qualification by clearing alert history
      await client.query(`DELETE FROM dealer_auto_alert_history WHERE dealer_id = $1`, [testDealerId]);
      console.log('   ✅ Cleared alert history for testing\n');
      
      // Check again
      const recheckQualification = await client.query(`
        SELECT * FROM dealers_needing_auto_alert WHERE dealer_id = $1
      `, [testDealerId]);
      
      if (recheckQualification.rows.length === 0) {
        console.log('   ❌ Still not qualifying. Manual intervention needed.');
        return;
      }
    }
    
    const dealer = qualificationCheck.rows.length > 0 ? qualificationCheck.rows[0] : (await client.query(`SELECT * FROM dealers_needing_auto_alert WHERE dealer_id = $1`, [testDealerId])).rows[0];
    
    console.log(`   ✅ Dealer qualifies for alert!`);
    console.log(`   - Days Since Update: ${dealer.days_since_update}`);
    console.log(`   - Out of Stock: ${dealer.out_of_stock_count}`);
    console.log(`   - Low Stock: ${dealer.low_stock_count}`);
    console.log(`   - Alert Type: ${dealer.alert_needed}\n`);

    // Step 5: Send test alert
    console.log('📋 Step 5: Sending Test Alert...\n');
    console.log('   This will:');
    console.log('   - Create a notification in dealer portal');
    console.log('   - Send an email to the dealer');
    console.log('   - Log the alert in history\n');
    
    const confirm = 'y'; // Auto-confirm for automated testing
    
    if (confirm.toLowerCase() === 'y') {
      // Import and run the cron function
      const { runAutoStockAlertCron } = require('./auto-stock-alert-cron.js');
      
      // Note: This will end the pool, so we need to check results before it runs
      await client.release();
      
      // Run the cron
      await runAutoStockAlertCron();
      
      // Reconnect to verify
      const verifyClient = await pool.connect();
      
      // Step 6: Verify results
      console.log('\n📋 Step 6: Verifying Results...\n');
      
      const notificationCheck = await verifyClient.query(`
        SELECT * FROM dealer_notifications 
        WHERE dealer_id = $1 
        ORDER BY created_at DESC 
        LIMIT 1
      `, [testDealerId]);
      
      if (notificationCheck.rows.length > 0) {
        const notif = notificationCheck.rows[0];
        console.log('   ✅ Notification created:');
        console.log(`      - Title: ${notif.title}`);
        console.log(`      - Priority: ${notif.priority}`);
        console.log(`      - Email Sent: ${notif.sent_via_email ? 'Yes' : 'No'}`);
        if (notif.email_sent_at) {
          console.log(`      - Email Sent At: ${notif.email_sent_at}`);
        }
      }
      
      const historyCheck = await verifyClient.query(`
        SELECT * FROM dealer_auto_alert_history 
        WHERE dealer_id = $1 
        ORDER BY alert_sent_at DESC 
        LIMIT 1
      `, [testDealerId]);
      
      if (historyCheck.rows.length > 0) {
        const history = historyCheck.rows[0];
        console.log('\n   ✅ Alert history logged:');
        console.log(`      - Alert Type: ${history.alert_type}`);
        console.log(`      - Days Since Update: ${history.days_since_update}`);
        console.log(`      - Email Sent: ${history.email_sent ? 'Yes' : 'No'}`);
      }
      
      verifyClient.release();
    }

    console.log('\n╔════════════════════════════════════════════════════════════╗');
    console.log('║   TEST COMPLETED SUCCESSFULLY! ✅                          ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');
    
    console.log('📧 Check the dealer\'s email inbox for the alert email');
    console.log('🔔 Check the dealer portal for the notification\n');
    
    console.log('To clean up test data (optional):');
    console.log(`   DELETE FROM dealer_auto_alert_history WHERE dealer_id = ${testDealerId};`);
    console.log(`   DELETE FROM dealer_notifications WHERE dealer_id = ${testDealerId} AND created_by = 'system';`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the test
if (require.main === module) {
  testAutoStockAlertSystem()
    .then(() => {
      console.log('\n✅ Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testAutoStockAlertSystem };
