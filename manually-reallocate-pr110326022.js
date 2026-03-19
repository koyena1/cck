const fetch = require('node-fetch');

async function reallocateOrder() {
  try {
    console.log('🔄 Manually triggering allocation for order PR-110326-022...\n');

    // Trigger allocation API
    const response = await fetch('http://localhost:3000/api/order-allocation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: 111 }) // Order ID from previous check
    });

    const result = await response.json();
    
    console.log('📋 Allocation Result:');
    console.log(JSON.stringify(result, null, 2));

    if (result.success) {
      if (result.allocated) {
        console.log('\n✅ Order successfully allocated to dealer:', result.dealer_name);
      } else if (result.escalated_to_admin) {
        console.log('\n⚠️ Order escalated to admin:', result.message);
      } else {
        console.log('\n⚠️ Allocation not completed:', result.message);
      }
    } else {
      console.log('\n❌ Allocation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

reallocateOrder();
