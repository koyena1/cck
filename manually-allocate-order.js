// Manually allocate an existing order
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

async function allocateOrder(orderNumber) {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    // Get order ID
    const orderResult = await pool.query(
      'SELECT order_id, order_number, pincode FROM orders WHERE order_number = $1',
      [orderNumber]
    );

    if (orderResult.rows.length === 0) {
      console.log(`❌ Order ${orderNumber} not found`);
      return;
    }

    const order = orderResult.rows[0];
    console.log(`\n🚀 Allocating Order: ${order.order_number}`);
    console.log(`   Order ID: ${order.order_id}`);
    console.log(`   Pincode: ${order.pincode}\n`);

    // Call allocation API
    const response = await fetch('http://localhost:3000/api/order-allocation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: order.order_id })
    });

    const data = await response.json();

    if (data.success) {
      if (data.allocated) {
        console.log('✅ ORDER ALLOCATED SUCCESSFULLY!\n');
        console.log(`   Dealer: ${data.dealer_name}`);
        console.log(`   Dealer ID: ${data.dealer_id}`);
        console.log(`   Request ID: ${data.request_id}`);
        console.log(`   Response Deadline: ${data.response_deadline}`);
        console.log(`   Timeout: ${data.timeout_hours} hours`);
        console.log(`   Dealers Available: ${data.dealers_available}\n`);
        console.log(`📧 Dealer "${data.dealer_name}" can now view this request at:`);
        console.log(`   http://localhost:3000/dealer/order-requests\n`);
      } else if (data.escalated_to_admin) {
        console.log('⚠️ NO DEALER HAS STOCK - Escalated to Admin\n');
        console.log(`   Reason: ${data.message}`);
      } else {
        console.log('❌ Allocation failed:', data.message);
      }
    } else {
      console.log('❌ Error:', data.error);
    }

  } catch (error) {
    console.error('❌ Allocation error:', error.message);
  } finally {
    await pool.end();
  }
}

// Run allocation
const orderNumber = process.argv[2] || 'ORD-20260223-0002';
allocateOrder(orderNumber);
