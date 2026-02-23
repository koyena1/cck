const fetch = require('node-fetch');

async function testPricingAPIs() {
  const dealerId = 3; // Jitesh's dealer ID
  
  console.log('Testing Dealer Pricing APIs...\n');
  
  try {
    // Test 1: Get dealer stats
    console.log('1. Testing /api/dealer-transactions/stats...');
    const statsResponse = await fetch(`http://localhost:3000/api/dealer-transactions/stats?dealerId=${dealerId}`);
    const statsData = await statsResponse.json();
    console.log('Stats Response:', statsData);
    console.log('');
    
    // Test 2: Get dealer products
    console.log('2. Testing /api/dealer-products...');
    const productsResponse = await fetch('http://localhost:3000/api/dealer-products?active=true');
    const productsData = await productsResponse.json();
    console.log(`Products Response: ${productsData.success ? 'Success' : 'Failed'}`);
    console.log(`Total Products: ${productsData.products?.length || 0}`);
    console.log(`In Stock: ${productsData.products?.filter(p => p.in_stock).length || 0}`);
    console.log('');
    
    // Test 3: Create a test invoice (purchase)
    console.log('3. Testing invoice generation...');
    const invoiceResponse = await fetch('http://localhost:3000/api/dealer-transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dealerId: dealerId,
        transactionType: 'purchase',
        items: [
          {
            productId: 1,
            productName: 'Test Camera',
            modelNumber: 'TEST-001',
            quantity: 1,
            unitPrice: 1000,
            totalPrice: 1000
          }
        ]
      })
    });
    
    const invoiceData = await invoiceResponse.json();
    console.log('Invoice Response:', invoiceData);
    
    if (invoiceData.success) {
      console.log('\n✅ All APIs working correctly!');
      console.log(`Invoice ID: ${invoiceData.transaction.transaction_id}`);
      console.log(`Total Amount: ₹${invoiceData.transaction.total_amount}`);
    } else {
      console.log('\n❌ Invoice generation failed:', invoiceData.error);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nMake sure Next.js dev server is running on http://localhost:3000');
  }
}

testPricingAPIs();
