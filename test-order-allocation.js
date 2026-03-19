/**
 * AUTOMATED ORDER ALLOCATION TEST
 * 
 * This script:
 * 1. Creates 3 test dealers at different distances
 * 2. Gives them all stock
 * 3. Creates a test order
 * 4. Triggers allocation
 * 5. Checks which dealer was selected
 * 6. Reports if nearest dealer was chosen
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// Test configuration
const CUSTOMER_LOCATION = {
  name: 'Test Customer',
  phone: '9876543210',
  email: 'testcustomer@example.com',
  address: '123 Test Street, Midnapore',
  pincode: '721637',
  city: 'Midnapore',
  state: 'West Bengal',
  latitude: 22.42,
  longitude: 87.32
};

const TEST_DEALERS = [
  {
    name: 'FAR Dealer (Should NOT be selected)',
    email: 'testdealer_far@example.com',
    phone: '9999999001',
    business_name: 'Far CCTV Store',
    address: 'Kharagpur, West Bengal',
    service_pin: '721301',
    location: 'Kharagpur',
    latitude: 22.33,
    longitude: 87.23,
    expected_distance_km: 30
  },
  {
    name: 'NEAREST Dealer (Should BE selected)',
    email: 'testdealer_near@example.com',
    phone: '9999999002',
    business_name: 'Near CCTV Store',
    address: 'Midnapore Town, West Bengal',
    service_pin: '721101',
    location: 'Midnapore',
    latitude: 22.43,
    longitude: 87.33,
    expected_distance_km: 5
  },
  {
    name: 'MEDIUM Dealer (Should NOT be selected)',
    email: 'testdealer_medium@example.com',
    phone: '9999999003',
    business_name: 'Medium CCTV Store',
    address: 'Panskura, West Bengal',
    service_pin: '721139',
    location: 'Panskura',
    latitude: 22.38,
    longitude: 87.45,
    expected_distance_km: 15
  }
];

// Helper function to calculate distance (simple Haversine approximation)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

async function cleanup() {
  console.log('\n🧹 Cleaning up old test data...');
  
  // Delete old test dealers and related data
  await pool.query(`DELETE FROM dealers WHERE email LIKE '%testdealer%'`);
  await pool.query(`DELETE FROM orders WHERE customer_email = 'testcustomer@example.com'`);
  
  console.log('✅ Cleanup complete\n');
}

async function createTestDealers() {
  console.log('👥 Creating test dealers at different distances...\n');
  
  const dealerIds = [];
  
  for (const dealer of TEST_DEALERS) {
    const result = await pool.query(`
      INSERT INTO dealers (
        full_name, email, phone_number, business_name, business_address,
        service_pin, location, latitude, longitude,
        password_hash, status, rating
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING dealer_id
    `, [
      dealer.name, dealer.email, dealer.phone, dealer.business_name, dealer.address,
      dealer.service_pin, dealer.location, dealer.latitude, dealer.longitude,
      'password123', 'Active', 4.5
    ]);
    
    const dealerId = result.rows[0].dealer_id;
    dealerIds.push({ ...dealer, dealer_id: dealerId });
    
    const actualDistance = calculateDistance(
      CUSTOMER_LOCATION.latitude, CUSTOMER_LOCATION.longitude,
      dealer.latitude, dealer.longitude
    );
    
    console.log(`   ✅ Created: ${dealer.business_name}`);
    console.log(`      Dealer ID: ${dealerId}`);
    console.log(`      Location: ${dealer.latitude}, ${dealer.longitude}`);
    console.log(`      Distance: ${actualDistance.toFixed(2)} km\n`);
  }
  
  return dealerIds;
}

async function addStockToDealers(dealerIds) {
  console.log('📦 Adding stock to all dealers...\n');
  
  // Get or create a test product
  let productResult = await pool.query(`
    SELECT product_id FROM products LIMIT 1
  `);
  
  let productId;
  if (productResult.rows.length === 0) {
    // Create a test product if none exists
    const createResult = await pool.query(`
      INSERT INTO products (name, description, base_price, category)
      VALUES ('Test CCTV Camera', 'Test product for allocation', 5000, 'Camera')
      RETURNING product_id
    `);
    productId = createResult.rows[0].product_id;
    console.log(`   ℹ️  Created test product ID: ${productId}\n`);
  } else {
    productId = productResult.rows[0].product_id;
    console.log(`   ℹ️  Using existing product ID: ${productId}\n`);
  }
  
  // Add stock to all dealers
  for (const dealer of dealerIds) {
    await pool.query(`
      INSERT INTO dealer_inventory (dealer_id, product_id, quantity_available, quantity_reserved)
      VALUES ($1, $2, 100, 0)
      ON CONFLICT (dealer_id, product_id) 
      DO UPDATE SET quantity_available = 100, quantity_reserved = 0
    `, [dealer.dealer_id, productId]);
    
    console.log(`   ✅ Added stock to ${dealer.business_name} (ID: ${dealer.dealer_id})`);
  }
  
  console.log('\n');
  return productId;
}

async function createTestOrder(productId) {
  console.log('📝 Creating test order...\n');
  
  const orderResult = await pool.query(`
    INSERT INTO orders (
      customer_name, customer_phone, customer_email,
      order_type, installation_address, 
      pincode, city, state,
      latitude, longitude,
      total_amount, status, payment_method, payment_status
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    RETURNING order_id, order_number
  `, [
    CUSTOMER_LOCATION.name, CUSTOMER_LOCATION.phone, CUSTOMER_LOCATION.email,
    'installation', CUSTOMER_LOCATION.address,
    CUSTOMER_LOCATION.pincode, CUSTOMER_LOCATION.city, CUSTOMER_LOCATION.state,
    CUSTOMER_LOCATION.latitude, CUSTOMER_LOCATION.longitude,
    10000, 'Pending', 'cod', 'Pending'
  ]);
  
  const order = orderResult.rows[0];
  
  // Add order item
  await pool.query(`
    INSERT INTO order_items (order_id, item_type, item_name, product_id, quantity, unit_price, total_price)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [order.order_id, 'Product', 'Test CCTV Camera', productId, 2, 5000, 10000]);
  
  console.log(`   ✅ Order created: #${order.order_number} (ID: ${order.order_id})`);
  console.log(`   📍 Location: ${CUSTOMER_LOCATION.latitude}, ${CUSTOMER_LOCATION.longitude}`);
  console.log(`   📦 Product ID: ${productId}, Quantity: 2\n`);
  
  return order;
}

async function triggerAllocation(orderId) {
  console.log('🚀 Triggering order allocation...\n');
  
  const response = await fetch('http://localhost:3000/api/order-allocation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId })
  });
  
  const result = await response.json();
  
  console.log('   📊 Allocation Result:');
  console.log(`      Success: ${result.success}`);
  console.log(`      Allocated: ${result.allocated}`);
  if (result.dealer_name) {
    console.log(`      Dealer: ${result.dealer_name} (ID: ${result.dealer_id})`);
  }
  console.log(`      Message: ${result.message}\n`);
  
  return result;
}

async function verifyAllocation(orderId, dealerIds) {
  console.log('🔍 Verifying allocation results...\n');
  
  // Get order assignment
  const result = await pool.query(`
    SELECT 
      o.order_number,
      o.assigned_dealer_id,
      o.latitude as customer_lat,
      o.longitude as customer_lng,
      d.business_name as assigned_dealer,
      d.latitude as dealer_lat,
      d.longitude as dealer_lng,
      d.location
    FROM orders o
    LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
    WHERE o.order_id = $1
  `, [orderId]);
  
  if (result.rows.length === 0) {
    console.log('   ❌ ERROR: Order not found!\n');
    return false;
  }
  
  const orderData = result.rows[0];
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(' TEST RESULTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  if (!orderData.assigned_dealer_id) {
    console.log('   ❌ TEST FAILED: No dealer assigned!\n');
    return false;
  }
  
  console.log(`   📍 Customer Location: ${orderData.customer_lat}, ${orderData.customer_lng}`);
  console.log(`   👤 Assigned Dealer: ${orderData.assigned_dealer} (ID: ${orderData.assigned_dealer_id})`);
  console.log(`   📍 Dealer Location: ${orderData.dealer_lat}, ${orderData.dealer_lng}\n`);
  
  // Calculate distances to all dealers
  console.log('   📏 Distance Analysis:\n');
  
  let nearestDealer = null;
  let minDistance = Infinity;
  let assignedDistance = null;
  
  for (const dealer of dealerIds) {
    const distance = calculateDistance(
      orderData.customer_lat, orderData.customer_lng,
      dealer.latitude, dealer.longitude
    );
    
    const isAssigned = dealer.dealer_id === orderData.assigned_dealer_id;
    const icon = isAssigned ? '👉' : '   ';
    const status = isAssigned ? '← SELECTED' : '';
    
    console.log(`${icon}  ${dealer.business_name}: ${distance.toFixed(2)} km ${status}`);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestDealer = dealer;
    }
    
    if (isAssigned) {
      assignedDistance = distance;
    }
  }
  
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Determine if test passed
  const testPassed = nearestDealer.dealer_id === orderData.assigned_dealer_id;
  
  if (testPassed) {
    console.log('   ✅ TEST PASSED!');
    console.log(`      Order was allocated to the NEAREST dealer`);
    console.log(`      ${nearestDealer.business_name} (${minDistance.toFixed(2)} km away)\n`);
  } else {
    console.log('   ❌ TEST FAILED!');
    console.log(`      Expected: ${nearestDealer.business_name} (${minDistance.toFixed(2)} km)`);
    console.log(`      Got: ${orderData.assigned_dealer} (${assignedDistance.toFixed(2)} km)`);
    console.log(`      \n      💡 The system is NOT using GPS distance for allocation!`);
    console.log(`         It's likely using dealer_id or row_number ordering.\n`);
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  return testPassed;
}

async function runTest() {
  try {
    console.log('\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('  ORDER ALLOCATION TEST - NEAREST DEALER SELECTION');
    console.log('═══════════════════════════════════════════════════\n');
    
    // Step 1: Cleanup
    await cleanup();
    
    // Step 2: Create test dealers at different distances
    const dealerIds = await createTestDealers();
    
    // Step 3: Add stock to all dealers
    const productId = await addStockToDealers(dealerIds);
    
    // Step 4: Create test order
    const order = await createTestOrder(productId);
    
    // Step 5: Trigger allocation
    const allocationResult = await triggerAllocation(order.order_id);
    
    // Step 6: Verify results
    const testPassed = await verifyAllocation(order.order_id, dealerIds);
    
    // Cleanup test data
    console.log('🧹 Cleaning up test data...');
    await cleanup();
    console.log('✅ Cleanup complete\n');
    
    console.log('═══════════════════════════════════════════════════\n');
    
    process.exit(testPassed ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the test
runTest();
