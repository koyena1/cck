const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkRecentOrders() {
  try {
    console.log('🔍 Checking recent orders and order #23...\n');

    // Get order by various methods
    const queries = [
      { label: 'By order number PR-120326-023', query: `SELECT * FROM orders WHERE order_number = 'PR-120326-023' LIMIT 1` },
      { label: 'By order_id 23', query: `SELECT * FROM orders WHERE order_id = 23 LIMIT 1` },
      { label: 'Recent orders', query: `SELECT order_id, order_number, status, assigned_dealer_id, created_at FROM orders ORDER BY created_at DESC LIMIT 5` }
    ];

    for (const q of queries) {
      console.log(`\n📋 ${q.label}:`);
      const result = await pool.query(q.query);
      if (result.rows.length === 0) {
        console.log('   No results found');
      } else {
        result.rows.forEach(row => {
          console.log(`   Order ${row.order_id}: ${row.order_number} | Status: ${row.status} | Dealer: ${row.assigned_dealer_id || 'None'}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkRecentOrders();
