require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkInvoiceData() {
  try {
    console.log('📄 Checking Invoice Data for Order PR-110326-021-101...\n');
    
    const orderResult = await pool.query(`
      SELECT
        o.order_number,
        o.assigned_dealer_id,
        d.business_name  AS dealer_business_name,
        d.full_name      AS dealer_full_name,
        d.phone_number   AS dealer_phone,
        d.gstin          AS dealer_gstin,
        d.business_address AS dealer_address,
        d.pincode        AS dealer_pincode,
        d.location       AS dealer_location,
        d.state          AS dealer_state
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_number = 'PR-110326-021-101'
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    console.log('✅ Invoice Query Result:');
    console.log(JSON.stringify(orderResult.rows[0], null, 2));
    
    console.log('\n📋 Dealer Fields in Invoice:');
    const order = orderResult.rows[0];
    console.log(`   Business Name: ${order.dealer_business_name || 'NOT SET'}`);
    console.log(`   Full Name: ${order.dealer_full_name || 'NOT SET'}`);
    console.log(`   GSTIN: ${order.dealer_gstin || 'NOT SET'}`);
    console.log(`   Address: ${order.dealer_address || 'NOT SET'}`);
    console.log(`   Pincode: ${order.dealer_pincode || 'NOT SET'}`);
    console.log(`   Location: ${order.dealer_location || 'NOT SET'}`);
    console.log(`   State: ${order.dealer_state || 'NOT SET'}`);
    console.log(`   Phone: ${order.dealer_phone || 'NOT SET'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkInvoiceData();
