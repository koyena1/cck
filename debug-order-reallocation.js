/**
 * Check Recent Order Allocation Status
 * Investigates why order wasn't reallocated after dealer decline
 */

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

async function checkRecentOrderAllocation() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 INVESTIGATING RECENT ORDER ALLOCATION ISSUE');
    console.log('='.repeat(80) + '\n');

    // Get most recent order (today around 10:02)
    const recentOrderResult = await pool.query(`
      SELECT 
        order_id,
        order_number,
        customer_name,
        customer_phone,
        pincode,
        status,
        assigned_dealer_id,
        created_at
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
      ORDER BY created_at DESC
      LIMIT 5
    `);

    if (recentOrderResult.rows.length === 0) {
      console.log('❌ No orders found for today');
      return;
    }

    console.log(`📦 Recent Orders Today:\n`);
    recentOrderResult.rows.forEach((order, idx) => {
      console.log(`${idx + 1}. Order ${order.order_number}`);
      console.log(`   Customer: ${order.customer_name}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Assigned Dealer ID: ${order.assigned_dealer_id || 'None'}`);
      console.log(`   Created: ${order.created_at}`);
      console.log('');
    });

    const targetOrder = recentOrderResult.rows[0];
    console.log('─'.repeat(80));
    console.log(`\n🎯 Analyzing Order: ${targetOrder.order_number}\n`);

    // Get all dealer requests for this order
    const requestsResult = await pool.query(`
      SELECT 
        dor.id,
        dor.dealer_id,
        d.business_name,
        d.full_name,
        dor.request_sequence,
        dor.request_status,
        dor.requested_at,
        dor.responded_at,
        dor.response_deadline,
        dor.decline_reason,
        dor.dealer_notes,
        dor.dealer_distance_km
      FROM dealer_order_requests dor
      JOIN dealers d ON dor.dealer_id = d.dealer_id
      WHERE dor.order_id = $1
      ORDER BY dor.request_sequence ASC
    `, [targetOrder.order_id]);

    console.log(`📋 Dealer Requests (${requestsResult.rows.length}):\n`);
    
    if (requestsResult.rows.length === 0) {
      console.log('❌ NO DEALER REQUESTS FOUND!');
      console.log('   This means the order allocation API was not triggered.\n');
    } else {
      requestsResult.rows.forEach(req => {
        console.log(`${req.request_sequence}. ${req.business_name} (${req.full_name})`);
        console.log(`   Dealer ID: ${req.dealer_id}`);
        console.log(`   Status: ${req.request_status}`);
        console.log(`   Distance: ${req.dealer_distance_km || 'N/A'} km`);
        console.log(`   Requested: ${req.requested_at}`);
        console.log(`   Deadline: ${req.response_deadline}`);
        
        if (req.responded_at) {
          console.log(`   Responded: ${req.responded_at}`);
        }
        
        if (req.decline_reason) {
          console.log(`   ⛔ Decline Reason: ${req.decline_reason}`);
        }
        
        if (req.dealer_notes) {
          console.log(`   📝 Notes: ${req.dealer_notes}`);
        }
        
        console.log('');
      });
    }

    // Check allocation logs
    console.log('─'.repeat(80));
    console.log('\n📜 Allocation Log:\n');
    
    const logsResult = await pool.query(`
      SELECT 
        log_type,
        dealer_id,
        message,
        details,
        created_at
      FROM order_allocation_log
      WHERE order_id = $1
      ORDER BY created_at ASC
    `, [targetOrder.order_id]);

    if (logsResult.rows.length === 0) {
      console.log('❌ NO ALLOCATION LOGS FOUND!\n');
    } else {
      logsResult.rows.forEach((log, idx) => {
        console.log(`${idx + 1}. [${log.log_type}] ${log.message}`);
        console.log(`   Time: ${log.created_at}`);
        if (log.dealer_id) {
          console.log(`   Dealer ID: ${log.dealer_id}`);
        }
        if (log.details) {
          console.log(`   Details: ${JSON.stringify(log.details, null, 2)}`);
        }
        console.log('');
      });
    }

    // Check if Jitesh Sahoo declined
    const jiteshResult = await pool.query(`
      SELECT dealer_id, business_name, full_name 
      FROM dealers 
      WHERE full_name ILIKE '%jitesh%' OR business_name ILIKE '%jitesh%'
    `);

    if (jiteshResult.rows.length > 0) {
      console.log('─'.repeat(80));
      console.log('\n👤 Jitesh Sahoo Details:\n');
      jiteshResult.rows.forEach(dealer => {
        console.log(`   Dealer ID: ${dealer.dealer_id}`);
        console.log(`   Name: ${dealer.full_name}`);
        console.log(`   Business: ${dealer.business_name}`);
      });
      console.log('');
    }

    // Check what other dealers are available
    console.log('─'.repeat(80));
    console.log('\n🏪 Available Active Dealers:\n');
    
    const availableDealersResult = await pool.query(`
      SELECT 
        dealer_id,
        business_name,
        full_name,
        location,
        service_pin,
        latitude,
        longitude,
        status
      FROM dealers
      WHERE status = 'Active'
      ORDER BY dealer_id
    `);

    availableDealersResult.rows.forEach(dealer => {
      console.log(`   ${dealer.dealer_id}. ${dealer.business_name} - ${dealer.full_name}`);
      console.log(`      Location: ${dealer.location}`);
      console.log(`      PIN: ${dealer.service_pin}`);
      console.log(`      Coordinates: ${dealer.latitude}, ${dealer.longitude}`);
      console.log('');
    });

    // DIAGNOSIS
    console.log('='.repeat(80));
    console.log('\n🔬 DIAGNOSIS:\n');

    const hasRequests = requestsResult.rows.length > 0;
    const hasDecline = requestsResult.rows.some(r => r.request_status === 'declined');
    const hasReallocation = requestsResult.rows.length > 1;

    if (!hasRequests) {
      console.log('❌ ISSUE: Order allocation was never triggered');
      console.log('   SOLUTION: Check if order creation calls /api/order-allocation endpoint\n');
    } else if (hasDecline && !hasReallocation) {
      console.log('❌ ISSUE: Dealer declined but reallocation did NOT happen');
      console.log('   SOLUTION: Check if dealer-order-response API is triggering reallocation\n');
      console.log('   POSSIBLE CAUSES:');
      console.log('   1. Reallocation API not being called');
      console.log('   2. Reallocation API failed silently');
      console.log('   3. No other dealers found (check coordinates/pincodes)\n');
    } else if (hasReallocation) {
      console.log('✅ System appears to be working - order was reallocated');
    }

    console.log('='.repeat(80) + '\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

checkRecentOrderAllocation();
