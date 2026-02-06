const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cctv',
  password: process.env.DB_PASSWORD || 'root',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkProducts() {
  try {
    console.log('🔍 Checking HD Combo Products in Database...\n');
    
    // Check total products
    const totalResult = await pool.query('SELECT COUNT(*) FROM hd_combo_products');
    console.log(`📦 Total products: ${totalResult.rows[0].count}`);
    
    // Check active products
    const activeResult = await pool.query('SELECT COUNT(*) FROM hd_combo_products WHERE is_active = true');
    console.log(`✅ Active products: ${activeResult.rows[0].count}`);
    
    // Check inactive products
    const inactiveResult = await pool.query('SELECT COUNT(*) FROM hd_combo_products WHERE is_active = false');
    console.log(`❌ Inactive products: ${inactiveResult.rows[0].count}\n`);
    
    // List all products
    const allProducts = await pool.query('SELECT id, name, brand, channels, is_active, created_at FROM hd_combo_products ORDER BY created_at DESC');
    
    if (allProducts.rows.length > 0) {
      console.log('📋 All Products:');
      console.log('─────────────────────────────────────────────────────────────');
      allProducts.rows.forEach((p, index) => {
        const status = p.is_active ? '✅ ACTIVE' : '❌ INACTIVE';
        console.log(`${index + 1}. [${status}] ${p.name}`);
        console.log(`   Brand: ${p.brand} | Channels: ${p.channels} | ID: ${p.id}`);
        console.log(`   Created: ${new Date(p.created_at).toLocaleString()}`);
        console.log('');
      });
    } else {
      console.log('⚠️  No products found in database!');
      console.log('\n💡 To add products:');
      console.log('   1. Go to http://localhost:3000/admin/categories/hd-combo');
      console.log('   2. Click "Add New Product"');
      console.log('   3. Fill in details and make sure "Active" checkbox is checked');
      console.log('   4. Click "Create Product"');
    }
    
    pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    pool.end();
    process.exit(1);
  }
}

checkProducts();
