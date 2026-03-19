// Test geocode with enhanced pincode + region search
const http = require('http');

async function testSearch(query) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api/geocode?type=search&q=${encodeURIComponent(query)}`,
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('Testing Enhanced Pincode Geocoding');
  console.log('='.repeat(60));

  // Test 1: Just pincode
  console.log('\n📍 Test 1: Searching with just pincode "721637"...');
  const test1 = await testSearch('721637');
  console.log(`Status: ${test1.status}`);
  if (test1.data.suggestedRegion) {
    console.log(`✅ Suggested Region: ${test1.data.suggestedRegion}`);
    console.log(`💬 Message: ${test1.data.message}`);
  }

  // Add delay for rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 2: Pincode with suggested region
  console.log('\n📍 Test 2: Searching with "721637, Midnapore"...');
  const test2 = await testSearch('721637, Midnapore');
  console.log(`Status: ${test2.status}`);
  if (test2.data.data && test2.data.data.length > 0) {
    console.log(`✅ Found ${test2.data.data.length} results!`);
    console.log(`   Location: ${test2.data.data[0].display_name}`);
    console.log(`   Coordinates: ${test2.data.data[0].lat}, ${test2.data.data[0].lon}`);
  } else {
    console.log('❌ No results found');
  }

  // Add delay for rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test 3: Full location search
  console.log('\n📍 Test 3: Searching with "Midnapore, West Bengal"...');
  const test3 = await testSearch('Midnapore, West Bengal');
  console.log(`Status: ${test3.status}`);
  if (test3.data.data && test3.data.data.length > 0) {
    console.log(`✅ Found ${test3.data.data.length} results!`);
    console.log(`   Location: ${test3.data.data[0].display_name}`);
    console.log(`   Coordinates: ${test3.data.data[0].lat}, ${test3.data.data[0].lon}`);
  } else {
    console.log('❌ No results found');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Tests Complete!');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
