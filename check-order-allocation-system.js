// Check current order allocation and dealer setup
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkSystem() {
  try {
    console.log('\n========================================');
    console.log('CHECKING ORDER ALLOCATION SYSTEM');
    console.log('========================================\n');

    // 1. Check the order from screenshot
    console.log('📋 1. CHECKING ORDER ORD-20260224-0001:\n');
    const orderCheck = await pool.query(`
      SELECT 
        order_id,
        order_number,
        customer_name,
        customer_phone,
        pincode,
        city,
        state,
        installation_address,
        total_amount,
        status,
        assigned_dealer_id,
        payment_status,
        created_at
      FROM orders
      WHERE order_number = 'ORD-20260224-0001'
    `);

    if (orderCheck.rows.length > 0) {
      const order = orderCheck.rows[0];
      console.log('   ✅ Order found:');
      console.log(`      Order ID: ${order.order_id}`);
      console.log(`      Order Number: ${order.order_number}`);
      console.log(`      Customer: ${order.customer_name}`);
      console.log(`      PIN: ${order.pincode}`);
      console.log(`      Status: ${order.status}`);
      console.log(`      Assigned Dealer ID: ${order.assigned_dealer_id || 'NOT ASSIGNED'}`);
      console.log(`      Amount: RS ${order.total_amount}\n`);

      // Check order items
      const itemsCheck = await pool.query(`
        SELECT item_name, quantity, product_id, unit_price, total_price
        FROM order_items
        WHERE order_id = $1
      `, [order.order_id]);

      if (itemsCheck.rows.length > 0) {
        console.log('   📦 Order Items:');
        itemsCheck.rows.forEach(item => {
          console.log(`      - ${item.item_name} (Product ID: ${item.product_id || 'N/A'}) x${item.quantity} = RS ${item.total_price}`);
        });
        console.log('');
      }
    } else {
      console.log('   ❌ Order ORD-20260224-0001 not found!\n');
    }

    // 2. Check dealers with service_pin 721636, 721635, 721637
    console.log('👥 2. CHECKING DEALERS FOR PINS 721636, 721635, 721637:\n');
    const dealersCheck = await pool.query(`
      SELECT 
        dealer_id,
        business_name,
        full_name,
        phone_number,
        service_pin,
        location,
        latitude,
        longitude,
        status,
        rating
      FROM dealers
      WHERE service_pin IN ('721636', '721635', '721637')
        OR service_pin LIKE '7216%'
      ORDER BY service_pin
    `);

    if (dealersCheck.rows.length > 0) {
      console.log(`   ✅ Found ${dealersCheck.rows.length} dealers:`);
      dealersCheck.rows.forEach(d => {
        console.log(`      • ${d.business_name || d.full_name} (ID: ${d.dealer_id})`);
        console.log(`        PIN: ${d.service_pin}, Location: ${d.location || 'N/A'}`);
        console.log(`        GPS: ${d.latitude || 'N/A'}, ${d.longitude || 'N/A'}`);
        console.log(`        Status: ${d.status}, Rating: ${d.rating}\n`);
      });
    } else {
      console.log('   ❌ No dealers found for these PINs!\n');
    }

    // 3. Check dealer inventory for these dealers
    console.log('📊 3. CHECKING DEALER INVENTORY:\n');
    const inventoryCheck = await pool.query(`
      SELECT 
        di.dealer_id,
        d.business_name,
        d.service_pin,
        di.product_id,
        p.name as product_name,
        di.quantity_available,
        di.quantity_reserved,
        di.last_purchase_date,
        di.last_sale_date
      FROM dealer_inventory di
      JOIN dealers d ON di.dealer_id = d.dealer_id
      LEFT JOIN products p ON di.product_id = p.product_id
      WHERE d.service_pin IN ('721636', '721635', '721637')
        OR d.service_pin LIKE '7216%'
      ORDER BY d.service_pin, di.product_id
    `);

    if (inventoryCheck.rows.length > 0) {
      console.log(`   ✅ Found ${inventoryCheck.rows.length} inventory records:`);
      inventoryCheck.rows.forEach(inv => {
        console.log(`      • ${inv.business_name} (PIN: ${inv.service_pin})`);
        console.log(`        Product: ${inv.product_name || 'Unknown'} (ID: ${inv.product_id})`);
        console.log(`        Available: ${inv.quantity_available}, Reserved: ${inv.quantity_reserved}`);
        console.log(`        Last Purchase: ${inv.last_purchase_date || 'Never'}`);
        console.log(`        Last Sale: ${inv.last_sale_date || 'Never'}\n`);
      });
    } else {
      console.log('   ⚠️  No inventory found for these dealers!\n');
    }

    // 4. Check allocation log
    if (orderCheck.rows.length > 0) {
      console.log('📝 4. CHECKING ALLOCATION LOG:\n');
      const logCheck = await pool.query(`
        SELECT 
          log_type,
          dealer_id,
          message,
          details,
          created_at
        FROM order_allocation_log
        WHERE order_id = $1
        ORDER BY created_at DESC
      `, [orderCheck.rows[0].order_id]);

      if (logCheck.rows.length > 0) {
        console.log(`   ✅ Found ${logCheck.rows.length} allocation log entries:`);
        logCheck.rows.forEach((log, idx) => {
          console.log(`      ${idx + 1}. [${log.log_type}] ${log.message}`);
          console.log(`         Dealer ID: ${log.dealer_id || 'N/A'}`);
          console.log(`         Time: ${log.created_at}`);
          if (log.details) {
            console.log(`         Details: ${JSON.stringify(log.details)}`);
          }
          console.log('');
        });
      } else {
        console.log('   ⚠️  No allocation log found for this order!\n');
      }
    }

    // 5. Check dealer order requests
    if (orderCheck.rows.length > 0) {
      console.log('📨 5. CHECKING DEALER ORDER REQUESTS:\n');
      const requestsCheck = await pool.query(`
        SELECT 
          dor.id,
          dor.dealer_id,
          d.business_name,
          d.service_pin,
          dor.request_sequence,
          dor.request_status,
          dor.stock_verified,
          dor.stock_available,
          dor.dealer_distance_km,
          dor.requested_at,
          dor.response_deadline
        FROM dealer_order_requests dor
        JOIN dealers d ON dor.dealer_id = d.dealer_id
        WHERE dor.order_id = $1
        ORDER BY dor.request_sequence
      `, [orderCheck.rows[0].order_id]);

      if (requestsCheck.rows.length > 0) {
        console.log(`   ✅ Found ${requestsCheck.rows.length} request(s):`);
        requestsCheck.rows.forEach(req => {
          console.log(`      • Sequence #${req.request_sequence}: ${req.business_name} (PIN: ${req.service_pin})`);
          console.log(`        Status: ${req.request_status}`);
          console.log(`        Stock Verified: ${req.stock_verified}, Available: ${req.stock_available}`);
          console.log(`        Distance: ${req.dealer_distance_km} km`);
          console.log(`        Deadline: ${req.response_deadline}\n`);
        });
      } else {
        console.log('   ⚠️  No dealer requests found for this order!\n');
      }
    }

    console.log('========================================');
    console.log('SUMMARY & RECOMMENDATIONS');
    console.log('========================================\n');

    // Provide recommendations
    if (orderCheck.rows.length === 0) {
      console.log('❌ ISSUE: Order not found in database');
    } else if (dealersCheck.rows.length === 0) {
      console.log('❌ ISSUE: No dealers configured for PINs 721636, 721635, 721637');
      console.log('   → Need to create dealers for these locations');
    } else if (inventoryCheck.rows.length === 0) {
      console.log('⚠️  ISSUE: Dealers exist but have NO inventory');
      console.log('   → Dealers need to purchase products first');
    } else if (orderCheck.rows[0].assigned_dealer_id === null) {
      console.log('⚠️  ISSUE: Order exists but NOT allocated to any dealer');
      console.log('   → Allocation may have failed or not triggered');
    } else {
      console.log('✅ System appears to be functioning');
      console.log(`   Order assigned to Dealer ID: ${orderCheck.rows[0].assigned_dealer_id}`);
    }

    console.log('\n========================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkSystem();
