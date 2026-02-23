const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function setupDealerPricingDatabase() {
  console.log('🚀 Setting up Dealer Pricing System Database...\n');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, 'schema-dealer-pricing.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    console.log('📝 Executing database schema...');
    await pool.query(schemaSql);
    
    console.log('✅ Database tables created successfully!');
    console.log('\nCreated tables:');
    console.log('  ✓ dealer_products');
    console.log('  ✓ dealer_product_price_history');
    console.log('  ✓ dealer_transactions');
    console.log('  ✓ dealer_transaction_items');
    console.log('  ✓ dealer_pricing_upload_log');
    
    // Verify tables were created
    const verifyQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN (
        'dealer_products', 
        'dealer_product_price_history', 
        'dealer_transactions',
        'dealer_transaction_items',
        'dealer_pricing_upload_log'
      )
      ORDER BY table_name
    `;
    
    const result = await pool.query(verifyQuery);
    
    console.log('\n📊 Verification:');
    console.log(`   Found ${result.rows.length} out of 5 tables`);
    
    if (result.rows.length === 5) {
      console.log('\n🎉 SUCCESS! All dealer pricing tables are ready!');
      
      // Check if sample data was inserted
      const countQuery = 'SELECT COUNT(*) as count FROM dealer_products';
      const countResult = await pool.query(countQuery);
      console.log(`   Sample products inserted: ${countResult.rows[0].count}`);
    } else {
      console.log('\n⚠️  WARNING: Not all tables were created. Please check for errors.');
      console.log('   Tables found:', result.rows.map(r => r.table_name).join(', '));
    }

    console.log('\n📋 Next Steps:');
    console.log('   1. Run: node generate-dealer-pricing-template.js');
    console.log('   2. Open Admin Panel → Dealers → Product Pricing');
    console.log('   3. Download sample template');
    console.log('   4. Upload your pricing Excel file');
    console.log('\n✨ Dealer Pricing System is ready to use!');

  } catch (error) {
    console.error('\n❌ Error setting up database:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the setup
if (require.main === module) {
  setupDealerPricingDatabase();
}

module.exports = { setupDealerPricingDatabase };
