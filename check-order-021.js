require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkOrder021() {
  try {
    // Check if order exists with similar number
    const ordersResult = await pool.query(`
      SELECT order_id, order_number, status, assigned_dealer_id
      FROM orders
      WHERE order_number LIKE 'PR-110326-%'
      ORDER BY order_id DESC
      LIMIT 10
    `);
    
    console.log('📦 Orders with PR-110326-xxx pattern:\n');
    ordersResult.rows.forEach(order => {
      console.log(`   ${order.order_number} - Status: ${order.status} - Dealer: ${order.assigned_dealer_id || 'None'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrder021();
