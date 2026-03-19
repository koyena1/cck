// Test geocode API with pincode
const http = require('http');

const testPincode = '721637';

const options = {
  hostname: 'localhost',
  port: 3000,
  path: `/api/geocode?type=search&q=${encodeURIComponent(testPincode)}`,
  method: 'GET',
  headers: {
    'Accept': 'application/json'
  }
};

console.log(`Testing geocode API with pincode: ${testPincode}`);
console.log(`URL: http://localhost:3000${options.path}\n`);

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('\nResponse:');
    try {
      const data = JSON.parse(body);
      console.log(JSON.stringify(data, null, 2));
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('\n✅ SUCCESS! Found location:');
        console.log(`   Name: ${data.data[0].display_name}`);
        console.log(`   Lat: ${data.data[0].lat}`);
        console.log(`   Lon: ${data.data[0].lon}`);
      } else {
        console.log('\n❌ No location found');
      }
    } catch (e) {
      console.log('Not JSON, raw response:');
      console.log(body);
    }
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.end();
