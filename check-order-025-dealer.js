const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrder025() {
  try {
    console.log('🔍 Checking order PR-120326-025...\n');

    // Find the order
    const orderResult = await pool.query(`
      SELECT 
        o.order_id, o.order_number, o.status, o.assigned_dealer_id,
        d.business_name, d.full_name, d.phone_number,
        d.business_address, d.gstin, d.location, d.state, d.pincode
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_number LIKE 'PR-120326-025%'
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }

    const order = orderResult.rows[0];
    console.log('📋 Order Details:');
    console.log(`   Order ID: ${order.order_id}`);
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Assigned Dealer ID: ${order.assigned_dealer_id || 'NONE - Not Assigned!'}`);
    
    if (order.assigned_dealer_id) {
      console.log(`\n🏪 Dealer Details (should appear in invoice):`);
      console.log(`   Business Name: ${order.business_name || 'NULL'}`);
      console.log(`   Full Name: ${order.full_name || 'NULL'}`);
      console.log(`   Phone: ${order.phone_number || 'NULL'}`);
      console.log(`   Address: ${order.business_address || 'NULL'}`);
      console.log(`   GSTIN: ${order.gstin || 'NULL'}`);
      console.log(`   Location: ${order.location || 'NULL'}`);
      console.log(`   State: ${order.state || 'NULL'}`);
      console.log(`   Pincode: ${order.pincode || 'NULL'}`);
    } else {
      console.log('\n⚠️ ORDER HAS NO DEALER ASSIGNED!');
      console.log('   This is why invoice shows "DEALER" with "Address not available"');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrder025();
