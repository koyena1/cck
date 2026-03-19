/**
 * Dealer Distance Test Utility
 * Tests distance calculation between dealers and a specific location
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
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

/**
 * Calculate distance using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c * 100) / 100; // Round to 2 decimals
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

async function testDealerDistances() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log('\n' + '='.repeat(70));
    console.log('🗺️  DEALER DISTANCE CALCULATOR TEST');
    console.log('='.repeat(70) + '\n');

    // Customer location (example: Kolkata)
    const customerLat = 22.5726;
    const customerLon = 88.3639;
    const customerLocation = 'Kolkata';

    console.log(`📍 Customer Location: ${customerLocation}`);
    console.log(`   Coordinates: ${customerLat}, ${customerLon}\n`);

    // Get all active dealers
    const dealersResult = await pool.query(`
      SELECT 
        dealer_id,
        business_name,
        location,
        service_pin,
        serviceable_pincodes,
        latitude,
        longitude,
        status
      FROM dealers
      WHERE status = 'Active'
      ORDER BY dealer_id
    `);

    if (dealersResult.rows.length === 0) {
      console.log('❌ No active dealers found');
      return;
    }

    console.log(`Found ${dealersResult.rows.length} active dealer(s)\n`);
    console.log('='.repeat(70));

    // Calculate distances
    const dealersWithDistance = dealersResult.rows.map(dealer => {
      if (!dealer.latitude || !dealer.longitude) {
        return {
          ...dealer,
          distance_km: 9999,
          has_coordinates: false
        };
      }

      const distance = calculateDistance(
        customerLat,
        customerLon,
        parseFloat(dealer.latitude),
        parseFloat(dealer.longitude)
      );

      return {
        ...dealer,
        distance_km: distance,
        has_coordinates: true
      };
    });

    // Sort by distance
    dealersWithDistance.sort((a, b) => a.distance_km - b.distance_km);

    // Display results
    console.log('\n🏪 DEALERS SORTED BY DISTANCE:\n');

    dealersWithDistance.forEach((dealer, index) => {
      console.log(`${index + 1}. ${dealer.business_name}`);
      console.log(`   Dealer ID: ${dealer.dealer_id}`);
      console.log(`   Location: ${dealer.location || 'Not specified'}`);
      console.log(`   Service PIN: ${dealer.service_pin || 'Not specified'}`);
      
      if (dealer.has_coordinates) {
        console.log(`   Coordinates: ${dealer.latitude}, ${dealer.longitude}`);
        console.log(`   📏 Distance: ${dealer.distance_km} km`);
      } else {
        console.log(`   ⚠️  No coordinates available`);
      }
      
      if (dealer.serviceable_pincodes) {
        console.log(`   Serviceable Pincodes: ${dealer.serviceable_pincodes}`);
      }
      
      console.log('');
    });

    console.log('='.repeat(70));

    // Test specific pincode matching
    const testPincode = '700001';
    console.log(`\n🔍 Testing pincode match for: ${testPincode}\n`);

    const pincodeMatches = dealersWithDistance.filter(dealer => {
      if (dealer.service_pin === testPincode) {
        return true;
      }
      if (dealer.serviceable_pincodes) {
        const pincodes = dealer.serviceable_pincodes.split(',').map(p => p.trim());
        return pincodes.includes(testPincode);
      }
      return false;
    });

    if (pincodeMatches.length > 0) {
      console.log(`✅ Found ${pincodeMatches.length} dealer(s) servicing ${testPincode}:\n`);
      pincodeMatches.forEach(dealer => {
        console.log(`   • ${dealer.business_name} - ${dealer.distance_km} km away`);
      });
    } else {
      console.log(`❌ No dealers found servicing pincode ${testPincode}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ Test completed successfully\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

// Run the test
async function main() {
  // You can customize these values
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node test-dealer-distances.js [OPTIONS]

Test the distance calculation between dealers and customer location.

Options:
  --help, -h     Show this help message

Example:
  node test-dealer-distances.js

Note: Edit the customerLat and customerLon variables in the script
      to test different customer locations.
    `);
    return;
  }

  await testDealerDistances();
}

main();
