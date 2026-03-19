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

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkInventory() {
  try {
    console.log('='.repeat(60));
    console.log('CHECKING DEALER INVENTORY STATUS');
    console.log('='.repeat(60));

    // Check total inventory records
    const totalResult = await pool.query(`
      SELECT COUNT(*) as total FROM dealer_inventory
    `);
    console.log(`\n📊 Total dealer_inventory records: ${totalResult.rows[0].total}`);

    if (parseInt(totalResult.rows[0].total) === 0) {
      console.log('\n❌ DEALER INVENTORY TABLE IS EMPTY!');
      console.log('   The dealer_inventory table has no data.');
      console.log('   Dealers need to be assigned inventory first.');
    } else {
      // Show summary by dealer
      const summaryResult = await pool.query(`
        SELECT 
          d.dealer_id,
          d.business_name,
          d.full_name,
          COUNT(di.id) as product_count,
          SUM(di.quantity_available) as total_available
        FROM dealers d
        LEFT JOIN dealer_inventory di ON di.dealer_id = d.dealer_id
        WHERE d.status = 'Approved'
        GROUP BY d.dealer_id, d.business_name, d.full_name
        ORDER BY product_count DESC
      `);

      console.log('\n📦 INVENTORY SUMMARY BY DEALER:');
      summaryResult.rows.forEach(dealer => {
        console.log(`\n  ${dealer.business_name || dealer.full_name}`);
        console.log(`    - Products in inventory: ${dealer.product_count || 0}`);
        console.log(`    - Total units available: ${dealer.total_available || 0}`);
      });

      // Check specific product: CP-UVR-0401E1-CS
      console.log('\n\n🔍 CHECKING SPECIFIC PRODUCT: CP-UVR-0401E1-CS');
      const productCheck = await pool.query(`
        SELECT 
          dp.id,
          dp.model_number,
          dp.company,
          COUNT(di.id) as dealer_count
        FROM dealer_products dp
        LEFT JOIN dealer_inventory di ON di.product_id = dp.id
        WHERE dp.model_number = 'CP-UVR-0401E1-CS'
        GROUP BY dp.id, dp.model_number, dp.company
      `);

      if (productCheck.rows.length > 0) {
        const prod = productCheck.rows[0];
        console.log(`  Product ID: ${prod.id}`);
        console.log(`  Model: ${prod.model_number}`);
        console.log(`  Company: ${prod.company}`);
        console.log(`  Dealers with this product: ${prod.dealer_count}`);
        
        if (prod.dealer_count === 0) {
          console.log('\n  ❌ NO DEALERS HAVE THIS PRODUCT IN INVENTORY!');
          console.log('     The product exists in dealer_products table,');
          console.log('     but NO dealer has it in their dealer_inventory.');
        }
      }
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkInventory();
