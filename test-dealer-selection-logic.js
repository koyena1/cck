/**
 * Test Dealer Selection Logic
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

function isDealerServicingPincode(dealer, pincode) {
  if (!dealer.serviceable_pincodes && !dealer.service_pin) {
    return true;
  }

  if (dealer.service_pin === pincode) {
    return true;
  }

  if (dealer.serviceable_pincodes) {
    const serviceablePins = dealer.serviceable_pincodes
      .split(',')
      .map(pin => pin.trim());
    
    if (serviceablePins.includes(pincode)) {
      return true;
    }
  }

  return false;
}

async function testDealerSelection() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    const orderId = 76;
    const customerPincode = '721636';
    
    console.log(`\n��� TESTING DEALER SELECTION FOR ORDER ${orderId}\n`);
    console.log(`Customer Pincode: ${customerPincode}\n`);
    
    // Step 1: Get contacted dealers  
    console.log('STEP 1: Get contacted dealers');
    const contactedResult = await pool.query(`
      SELECT dealer_id FROM dealer_order_requests WHERE order_id = $1
    `, [orderId]);
    
    const contactedDealerIds = contactedResult.rows.map(r => r.dealer_id);
    console.log('Contacted Dealer IDs:', contactedDealerIds);
    console.log('');
    
    // Step 2: Get all active dealers EXCLUDING contacted ones
    console.log('STEP 2: Query dealers (excluding contacted)');
    console.log(`SQL: WHERE dealer_id != ALL([${contactedDealerIds}])\n`);
    
    const allDealersResult = await pool.query(`
      SELECT 
        dealer_id,
        business_name,
        service_pin,
        serviceable_pincodes,
        latitude,
        longitude
      FROM dealers
      WHERE status = 'Active'
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND dealer_id != ALL($1::INTEGER[])
      ORDER BY dealer_id ASC
    `, [contactedDealerIds]);
    
    console.log('Dealers returned by query:');
    console.table(allDealersResult.rows);
    console.log('');
    
    // Step 3: Filter by pincode
    console.log('STEP 3: Filter by serviceable pincode');
    let eligibleDealers = allDealersResult.rows.filter(dealer =>
      isDealerServicingPincode(dealer, customerPincode)
    );
    
    console.log(`Dealers servicing ${customerPincode}:`);
    console.table(eligibleDealers);
    console.log('');
    
    // Step 4: Fallback if none match
    if (eligibleDealers.length === 0) {
      console.log('STEP 4: No pincode match - using ALL dealers');
      eligibleDealers = allDealersResult.rows;
      console.table(eligibleDealers);
    } else {
      console.log(`✅ Found ${eligibleDealers.length} eligible dealer(s)`);
    }
    
    // Step 5: Select first dealer
    if (eligibleDealers.length > 0) {
      const selected = eligibleDealers[0];
      console.log('\nFINAL SELECTION:');
      console.log(`  Dealer ID: ${selected.dealer_id}`);
      console.log(`  Name: ${selected.business_name}`);
      console.log(`  Location: ${selected.location || 'N/A'}`);
      console.log('');
      
      if (contactedDealerIds.includes(selected.dealer_id)) {
        console.log('⚠️  WARNING: Selected dealer was already contacted!');
      } else {
        console.log('✅ Selected dealer has NOT been contacted yet');
      }
    } else {
      console.log('\n❌ NO DEALERS AVAILABLE');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

testDealerSelection();
