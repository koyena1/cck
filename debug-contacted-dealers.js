/**
 * Debug - Check contacted dealers for order
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

async function checkContactedDealers() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    const orderId = 76;
    
    console.log(`\n🔍 Checking contacted dealers for Order ID: ${orderId}\n`);
    
    // Get all dealer requests
    const result = await pool.query(`
      SELECT dealer_id, request_sequence, request_status
      FROM dealer_order_requests
      WHERE order_id = $1
      ORDER BY request_sequence
    `, [orderId]);
    
    console.log('Dealer Requests:');
    console.table(result.rows);
    
    const contactedDealerIds = result.rows.map(r => r.dealer_id);
    console.log('\nContacted Dealer IDs:', contactedDealerIds);
    console.log('Array type:', Array.isArray(contactedDealerIds));
    console.log('Length:', contactedDealerIds.length);
    
    // Test the query used in reallocation
    console.log('\n--- Testing exclusion query ---\n');
    
    const testResult = await pool.query(`
      SELECT dealer_id, business_name
      FROM dealers
      WHERE status = 'Active'
        AND dealer_id != ALL($1::INTEGER[])
    `, [contactedDealerIds]);
    
    console.log('Dealers NOT in contacted list:');
    console.table(testResult.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkContactedDealers();
