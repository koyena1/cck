const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkAdvanceAmount() {
  try {
    const result = await pool.query(`
      SELECT 
        order_number, 
        payment_method,
        subtotal,
        advance_amount,
        total_amount
      FROM orders
      WHERE order_number LIKE 'PR-120326-025%'
    `);

    const order = result.rows[0];
    console.log('📋 Order PR-120326-025:');
    console.log(`   Subtotal (DB): RS ${order.subtotal}`);
    console.log(`   Advance Amount (DB): RS ${order.advance_amount} ⚠️ WRONG - Should be RS 500`);
    console.log(`   Total Amount: RS ${order.total_amount}`);
    
    console.log('\n💡 Where did RS 1,200 come from?');
    console.log(`   If 30% advance: RS 3,500 × 30% = RS ${3500 * 0.30}`);
    console.log(`   If including GST: (RS 3,500 + RS 500) × 30% = RS ${4000 * 0.30}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkAdvanceAmount();
