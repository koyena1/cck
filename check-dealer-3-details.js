require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDealerDetails() {
  try {
    console.log('🔍 Checking Dealer 3 (Protechtur) Details...\n');
    
    // Check what columns exist in dealers table
    const columnsResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'dealers'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Available columns in dealers table:');
    columnsResult.rows.forEach(col => {
      console.log(`   ${col.column_name} (${col.data_type})`);
    });
    console.log('');
    
    // Get Dealer 3 details
    const dealerResult = await pool.query(`
      SELECT *
      FROM dealers
      WHERE dealer_id = 3
    `);
    
    if (dealerResult.rows.length === 0) {
      console.log('❌ Dealer 3 not found');
      return;
    }
    
    const dealer = dealerResult.rows[0];
    console.log('👤 Dealer 3 Details:');
    console.log(JSON.stringify(dealer, null, 2));
    
    // Now check what the invoice query returns
    console.log('\n📄 Invoice Query Result:');
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
        d.location       AS dealer_location
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_number = 'PR-110326-021'
    `);
    
    if (orderResult.rows.length > 0) {
      console.log(JSON.stringify(orderResult.rows[0], null, 2));
    } else {
      console.log('❌ Order PR-110326-021 not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkDealerDetails();
