// Debug specific order allocation
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

async function debugOrder() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    const orderNumber = 'ORD-20260223-0002';
    
    console.log(`\n🔍 Debugging Order: ${orderNumber}\n`);
    
    // 1. Get order details
    const orderResult = await pool.query(`
      SELECT order_id, order_number, customer_name, pincode, status, total_amount, created_at
      FROM orders 
      WHERE order_number = $1
    `, [orderNumber]);
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found!');
      return;
    }
    
    const order = orderResult.rows[0];
    console.log('📦 Order Details:');
    console.log(`   Order ID: ${order.order_id}`);
    console.log(`   Customer: ${order.customer_name}`);
    console.log(`   Pincode: ${order.pincode}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Amount: RS ${order.total_amount}`);
    console.log(`   Created: ${order.created_at}\n`);
    
    // 2. Check order items
    const itemsResult = await pool.query(`
      SELECT item_name, quantity, unit_price
      FROM order_items
      WHERE order_id = $1
    `, [order.order_id]);
    
    console.log('📋 Order Items:');
    if (itemsResult.rows.length === 0) {
      console.log('   ⚠️ No items found in order_items table');
    } else {
      itemsResult.rows.forEach(item => {
        console.log(`   - ${item.item_name} x${item.quantity} @ RS ${item.unit_price}`);
      });
    }
    console.log('');
    
    // 3. Check dealer jitesh@gmail.com
    const dealerResult = await pool.query(`
      SELECT dealer_id, business_name, email, service_pin, status
      FROM dealers
      WHERE email = $1
    `, ['jitesh@gmail.com']);
    
    console.log('👤 Dealer (jitesh@gmail.com):');
    if (dealerResult.rows.length === 0) {
      console.log('   ❌ Dealer not found!');
    } else {
      const dealer = dealerResult.rows[0];
      console.log(`   Dealer ID: ${dealer.dealer_id}`);
      console.log(`   Business: ${dealer.business_name}`);
      console.log(`   Service PIN: ${dealer.service_pin || 'NOT SET'}`);
      console.log(`   Status: ${dealer.status}\n`);
      
      // 4. Check dealer inventory
      const inventoryResult = await pool.query(`
        SELECT product_id, quantity_available
        FROM dealer_inventory
        WHERE dealer_id = $1 AND quantity_available > 0
        ORDER BY quantity_available DESC
      `, [dealer.dealer_id]);
      
      console.log('   📦 Inventory (Available Stock):');
      if (inventoryResult.rows.length === 0) {
        console.log('      ⚠️ No products in stock');
      } else {
        inventoryResult.rows.forEach(inv => {
          console.log(`      - Product ID ${inv.product_id}: ${inv.quantity_available} units`);
        });
      }
    }
    console.log('');
    
    // 5. Check all dealers in that area
    const areaDealersResult = await pool.query(`
      SELECT dealer_id, business_name, email, service_pin, status
      FROM dealers
      WHERE service_pin = $1 OR service_pin IS NULL
      ORDER BY business_name
    `, [order.pincode]);
    
    console.log(`🗺️  Dealers serving PIN ${order.pincode}:`);
    if (areaDealersResult.rows.length === 0) {
      console.log('   ❌ No dealers found for this area!');
    } else {
      areaDealersResult.rows.forEach(d => {
        console.log(`   - ${d.business_name} (${d.email}) - PIN: ${d.service_pin || 'ALL AREAS'} - Status: ${d.status}`);
      });
    }
    console.log('');
    
    // 6. Check dealer order requests
    const requestsResult = await pool.query(`
      SELECT dor.id, dor.dealer_id, d.business_name, dor.request_status, 
             dor.requested_at, dor.response_deadline
      FROM dealer_order_requests dor
      LEFT JOIN dealers d ON dor.dealer_id = d.dealer_id
      WHERE dor.order_id = $1
      ORDER BY dor.request_sequence
    `, [order.order_id]);
    
    console.log('📨 Allocation History:');
    if (requestsResult.rows.length === 0) {
      console.log('   ⚠️ ORDER WAS NEVER ALLOCATED! (Order placed before integration)');
      console.log('   💡 Solution: Manually trigger allocation or re-test with a new order');
    } else {
      requestsResult.rows.forEach(req => {
        console.log(`   - ${req.business_name}: ${req.request_status} (Requested: ${req.requested_at})`);
      });
    }
    
    console.log('\n✅ Debug complete\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugOrder();
