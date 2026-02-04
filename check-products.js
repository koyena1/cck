// Check product status
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  password: 'Koyen@123',
  database: 'cctv_platform',
  host: 'localhost',
  port: 5432,
  ssl: false,
});

async function checkProducts() {
  try {
    console.log('📊 Checking products in database...\n');

    // Get all products
    const allResult = await pool.query('SELECT * FROM hd_combo_products');
    console.log(`Total products in database: ${allResult.rows.length}`);
    
    if (allResult.rows.length > 0) {
      console.log('\nProduct details:');
      allResult.rows.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product.id}`);
        console.log(`   Brand: ${product.brand}`);
        console.log(`   Channels: ${product.channels}`);
        console.log(`   Cable: ${product.cable}`);
        console.log(`   Price: ₹${product.price}`);
        console.log(`   Active: ${product.is_active ? '✓ YES' : '✗ NO'}`);
        console.log(`   Image: ${product.image ? 'Present' : 'Missing'}`);
        console.log(`   Specs: ${product.specs ? product.specs.join(', ') : 'None'}`);
      });

      // Check active products
      const activeResult = await pool.query('SELECT * FROM hd_combo_products WHERE is_active = true');
      console.log(`\n\n✅ Active products (visible on frontend): ${activeResult.rows.length}`);
      console.log(`❌ Inactive products (hidden): ${allResult.rows.length - activeResult.rows.length}`);

      if (activeResult.rows.length === 0) {
        console.log('\n⚠️  WARNING: No products are marked as active!');
        console.log('   Products need is_active = true to show on frontend.');
        console.log('\n   Run this to activate all products:');
        console.log('   UPDATE hd_combo_products SET is_active = true;');
      }
    } else {
      console.log('\n⚠️  No products found in database!');
      console.log('   Please add products from admin panel.');
    }
    
  } catch (error) {
    console.error('\n❌ Error checking products:');
    console.error(error.message);
  } finally {
    await pool.end();
  }
}

checkProducts();
