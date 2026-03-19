const fetch = require('node-fetch');

async function testInvoiceAPI() {
  try {
    console.log('🔍 Testing invoice API for order 112...\n');

    // Test the API endpoint
    const response = await fetch('http://localhost:3000/api/orders/112/invoice?phone=6294880595');
    const data = await response.json();

    if (!data.success) {
      console.log('❌ API Error:', data.error);
      return;
    }

    console.log('✅ API Response Successful\n');
    console.log('📋 Invoice Number:', data.invoiceNumber);
    console.log('\n🏪 Dealer Fields in Response:');
    const order = data.order;
    console.log(`   dealer_business_name: ${order.dealer_business_name || 'MISSING'}`);
    console.log(`   dealer_full_name: ${order.dealer_full_name || 'MISSING'}`);
    console.log(`   dealer_address: ${order.dealer_address || 'MISSING'}`);  
    console.log(`   dealer_phone: ${order.dealer_phone || 'MISSING'}`);
    console.log(`   dealer_gstin: ${order.dealer_gstin || 'MISSING'}`);
    console.log(`   dealer_location: ${order.dealer_location || 'MISSING'}`);
    console.log(`   dealer_state: ${order.dealer_state || 'MISSING'}`);
    console.log(`   dealer_pincode: ${order.dealer_pincode || 'MISSING'}`);

    console.log('\n💰 Financial Fields:');
    console.log(`   products_total: ${order.products_total}`);
    console.log(`   subtotal: ${order.subtotal}`);
    console.log(`   total_amount: ${order.total_amount}`);
    console.log(`   tax_amount: ${order.tax_amount}`);
    console.log(`   advance_amount: ${order.advance_amount}`);

    console.log('\n📦 Order Items:');
    data.items.forEach(item => {
      console.log(`   ${item.item_name}: RS ${item.total_price}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testInvoiceAPI();
