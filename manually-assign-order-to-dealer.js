// Manually assign order to specific dealer
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

async function manuallyAssignOrder() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    const orderNumber = 'ORD-20260223-0002';
    const dealerEmail = 'jitesh@gmail.com';
    
    console.log(`\n🔧 Manually Assigning Order...\n`);
    
    // Get order and dealer IDs
    const orderResult = await pool.query(
      'SELECT order_id, order_number FROM orders WHERE order_number = $1',
      [orderNumber]
    );
    
    const dealerResult = await pool.query(
      'SELECT dealer_id, business_name FROM dealers WHERE email = $1',
      [dealerEmail]
    );
    
    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }
    
    if (dealerResult.rows.length === 0) {
      console.log('❌ Dealer not found');
      return;
    }
    
    const orderId = orderResult.rows[0].order_id;
    const dealerId = dealerResult.rows[0].dealer_id;
    const businessName = dealerResult.rows[0].business_name;
    
    await pool.query('BEGIN');
    
    try {
      // Create dealer order request
      const deadline = new Date();
      deadline.setHours(deadline.getHours() + 6); // 6 hour deadline
      
      const requestResult = await pool.query(`
        INSERT INTO dealer_order_requests (
          order_id, dealer_id, request_sequence, request_status,
          stock_verified, response_deadline, customer_pincode
        ) VALUES ($1, $2, 1, 'pending', false, $3, '721636')
        RETURNING id
      `, [orderId, dealerId, deadline]);
      
      const requestId = requestResult.rows[0].id;
      
      // Update order status
      await pool.query(`
        UPDATE orders 
        SET status = 'Awaiting Dealer Confirmation',
            assigned_dealer_id = $1
        WHERE order_id = $2
      `, [dealerId, orderId]);
      
      // Log allocation
      await pool.query(`
        INSERT INTO order_allocation_log (
          order_id, dealer_id, log_type, message, details
        ) VALUES ($1, $2, 'manual_allocation', 'Order manually assigned to dealer', $3)
      `, [orderId, dealerId, JSON.stringify({
        request_id: requestId,
        reason: 'manual_assignment_missing_product_ids'
      })]);
      
      await pool.query('COMMIT');
      
      console.log('✅ ORDER MANUALLY ASSIGNED!\n');
      console.log(`   Order: ${orderNumber}`);
      console.log(`   Dealer: ${businessName} (${dealerEmail})`);
      console.log(`   Request ID: ${requestId}`);
      console.log(`   Deadline: ${deadline.toLocaleString()}\n`);
      console.log(`📧 Dealer can view request at:`);
      console.log(`   http://localhost:3000/dealer/order-requests\n`);
      
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

manuallyAssignOrder();
