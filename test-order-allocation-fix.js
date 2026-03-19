require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testAllocationFix() {
  console.log('🔍 Testing Fixed Order Allocation for Order PR-110326-020...\n');
  
  try {
    // Step 1: Get order details
    const orderResult = await pool.query(`
      SELECT o.order_id, o.order_number, o.status, o.assigned_dealer_id, 
        o.pincode as customer_pincode,
        array_agg(oi.item_name) as product_names
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_number = 'PR-110326-020'
      GROUP BY o.order_id
    `);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Order PR-110326-020 not found');
      return;
    }
    
    const order = orderResult.rows[0];
    console.log('📦 Order Details:');
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Assigned Dealer: ${order.assigned_dealer_id || 'None'}`);
    console.log(`   Customer Pincode: ${order.customer_pincode}`);
    console.log(`   Products: ${order.product_names.join(', ')}\n`);
    
    // Step 2: Check dealers with matching products using NEW logic
    console.log('🔎 Checking dealers with product using NEW LOGIC (model_number matching)...');
    
    const dealersResult = await pool.query(`
      SELECT d.dealer_id, d.business_name, d.service_pin,
        array_agg(dp.model_number) as available_products,
        array_agg(di.quantity_available) as quantities
      FROM dealers d
      JOIN dealer_inventory di ON di.dealer_id = d.dealer_id
      JOIN dealer_products dp ON di.product_id = dp.id
      WHERE d.status = 'Active'
        AND dp.model_number = ANY($1::TEXT[])
        AND di.quantity_available > 0
      GROUP BY d.dealer_id, d.business_name, d.service_pin
    `, [order.product_names]);
    
    console.log(`✅ Found ${dealersResult.rows.length} dealer(s) with required product:\n`);
    
    dealersResult.rows.forEach(dealer => {
      console.log(`   Dealer ID: ${dealer.dealer_id}`);
      console.log(`   Business: ${dealer.business_name}`);
      console.log(`   Pincode: ${dealer.service_pin}`);
      console.log(`   Products: ${dealer.available_products.join(', ')}`);
      console.log(`   Quantities: ${dealer.quantities.join(', ')}`);
      console.log('');
    });
    
    /* 
    // Step 3: Trigger actual allocation API (requires dev server running)
    console.log('🚀 Triggering allocation API...');
    const allocateResult = await fetch(`http://localhost:3000/api/order-allocation?orderId=${order.order_id}`, {
      method: 'POST'
    });
    
    const allocateData = await allocateResult.json();
    console.log('📊 Allocation Result:', JSON.stringify(allocateData, null, 2));
    
    // Step 4: Check updated order status
    const updatedOrder = await pool.query(`
      SELECT order_number, status, assigned_dealer_id
      FROM orders
      WHERE order_id = $1
    `, [order.order_id]);
    
    console.log('\n✅ Updated Order Status:');
    console.log(`   Status: ${updatedOrder.rows[0].status}`);
    console.log(`   Assigned Dealer: ${updatedOrder.rows[0].assigned_dealer_id || 'None'}`);
    */
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testAllocationFix();
