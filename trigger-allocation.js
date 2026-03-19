// Simple script to trigger allocation API directly
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function triggerAllocation() {
  try {
    // Get order ID
    const orderResult = await pool.query(`
      SELECT order_id 
      FROM orders 
      WHERE order_number = 'PR-110326-020'
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    const orderId = orderResult.rows[0].order_id;
    console.log('📦 Order ID:', orderId);
    console.log('🚀 Calling allocation API...\n');
    
    // Import and call the allocation logic directly
    const { POST } = require('./app/api/order-allocation/route.ts');
    const { NextRequest } = require('next/server');
    
    // Create mock request
    const url = new URL(`http://localhost:3000/api/order-allocation?orderId=${orderId}`);
    const request = new NextRequest(url);
    
    const response = await POST(request);
    const data = await response.json();
    
    console.log('📊 Result:', JSON.stringify(data, null, 2));
    
    // Check final order status
    const finalOrder = await pool.query(`
      SELECT order_number, status, assigned_dealer_id
      FROM orders
      WHERE order_id = $1
    `, [orderId]);
    
    console.log('\n✅ Final Order Status:');
    console.log(`   Status: ${finalOrder.rows[0].status}`);
    console.log(`   Assigned Dealer: ${finalOrder.rows[0].assigned_dealer_id || 'None'}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

triggerAllocation();
