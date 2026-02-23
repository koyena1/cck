require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    console.log('🚀 Starting migration to percentage-based pricing...\n');

    // Read the migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-to-percentage-pricing.sql'),
      'utf-8'
    );

    // Execute the migration
    console.log('📝 Applying database changes...');
    await pool.query(migrationSQL);
    console.log('✅ Migration completed successfully!\n');

    // Verify the results
    console.log('📊 Verification Results:');
    const result = await pool.query(`
      SELECT 
        model_number,
        base_price::numeric(10,2) as base_price,
        purchase_percentage::numeric(5,2) as purchase_pct,
        dealer_purchase_price::numeric(10,2) as purchase_price,
        sale_percentage::numeric(5,2) as sale_pct,
        dealer_sale_price::numeric(10,2) as sale_price
      FROM dealer_products
      ORDER BY id
      LIMIT 8
    `);

    console.table(result.rows);

    console.log('\n✅ All products now use percentage-based pricing!');
    console.log('📌 Purchase/Sale prices will auto-calculate from base price + percentage');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
