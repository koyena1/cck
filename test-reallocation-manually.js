/**
 * Test Reallocation API Directly
 * Manually trigger reallocation for the declined order
 */

const fetch = require('node-fetch');

async function testReallocation() {
  try {
    console.log('\n🔄 Testing Reallocation API...\n');
    
    const orderId = 76; // Order ORD-20260226-0002 (check from database)
    const previousDealerId = 3; // Jitesh Sahoo
    const previousSequence = 1;

    console.log(`Order ID: ${orderId}`);
    console.log(`Previous Dealer: ${previousDealerId}`);
    console.log(`Sequence: ${previousSequence}\n`);

    const response = await fetch('http://localhost:3000/api/reallocate-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: orderId,
        previousDealerId: previousDealerId,
        previousSequence: previousSequence
      })
    });

    const data = await response.json();
    
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.success && data.reallocated) {
      console.log(`\n✅ SUCCESS! Order reallocated to: ${data.dealer_name}`);
      console.log(`   Distance: ${data.distance_km} km`);
      console.log(`   Sequence: ${data.sequence}`);
    } else if (data.escalated_to_admin) {
      console.log(`\n⚠️  Order escalated to admin panel`);
    } else {
      console.log(`\n❌ Reallocation failed:`, data.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testReallocation();
