const fetch = require('node-fetch');

async function testUpdateDealerAPI() {
  try {
    console.log('Testing dealer profile update API...\n');
    
    // Test data to update
    const updateData = {
      dealerId: '3',
      full_name: 'Jitesh Sahoo',
      business_name: 'Sahoo Electronics',
      email: 'jitesh@gmail.com',
      phone: '538730484',
      address: 'Purba Medinipur, West Bengal',
      location: 'Purba Medinipur',
      gst_number: '982938393',
      registration_number: '9888202'
    };

    const response = await fetch('http://localhost:3000/api/dealer/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Profile updated successfully!\n');
      console.log('Updated Dealer Information:');
      console.log('==========================');
      console.log(`Full Name: ${data.dealer.full_name}`);
      console.log(`Business: ${data.dealer.business_name}`);
      console.log(`Email: ${data.dealer.email}`);
      console.log(`Phone: ${data.dealer.phone}`);
      console.log(`Address: ${data.dealer.address}`);
      console.log(`Location: ${data.dealer.location || 'Not set'}`);
      console.log(`GST: ${data.dealer.gst_number}`);
      console.log(`Registration: ${data.dealer.registration_number}`);
      console.log(`\n${data.message}`);
    } else {
      console.log('❌ Update failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\nNote: Make sure Next.js dev server is running on http://localhost:3000');
  }
}

testUpdateDealerAPI();
