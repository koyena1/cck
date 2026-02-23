// Test Dealer API Endpoint
// This simulates what the frontend does when fetching dealer info

const fetch = require('node-fetch');

async function testDealerAPI() {
  try {
    console.log('Testing /api/dealer/me endpoint for dealer ID 3...\n');
    
    const response = await fetch('http://localhost:3000/api/dealer/me?dealerId=3');
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API Response successful!\n');
      console.log('Dealer Information:');
      console.log('==================');
      console.log(`ID: ${data.dealer.dealer_id}`);
      console.log(`Full Name: ${data.dealer.full_name}`);
      console.log(`Business: ${data.dealer.business_name}`);
      console.log(`Email: ${data.dealer.email}`);
      console.log(`Phone: ${data.dealer.phone}`);
      console.log(`Address: ${data.dealer.address}`);
      console.log(`Location: ${data.dealer.location || 'Not set'}`);
      console.log(`GST: ${data.dealer.gst_number}`);
      console.log(`Status: ${data.dealer.status}`);
      console.log(`Rating: ${data.dealer.rating}`);
      console.log(`Jobs Completed: ${data.dealer.completed_jobs}`);
      console.log('\n✅ This should match what appears on the dealer profile page!');
    } else {
      console.log('❌ API Error:', data.error);
    }
  } catch (error) {
    console.error('❌ Failed to connect to API:', error.message);
    console.log('\nNote: Make sure Next.js dev server is running on http://localhost:3000');
  }
}

testDealerAPI();
