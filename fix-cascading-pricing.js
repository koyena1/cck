require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixCascadingPricing() {
  try {
    console.log('🔧 Updating pricing calculation to cascading model...\n');

    // Update the trigger function to use cascading calculation
    console.log('📝 Updating calculate_dealer_prices() function...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION calculate_dealer_prices()
      RETURNS TRIGGER AS $$
      BEGIN
          -- Step 1: Calculate purchase price from base price
          -- purchase_percentage is stored as negative for discount (e.g., -20 for 20% off)
          NEW.dealer_purchase_price = NEW.base_price + (NEW.base_price * NEW.purchase_percentage / 100);
          
          -- Step 2: Calculate sale price FROM PURCHASE PRICE (not base!)
          -- sale_percentage is discount from purchase price
          NEW.dealer_sale_price = NEW.dealer_purchase_price + (NEW.dealer_purchase_price * NEW.sale_percentage / 100);
          
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('✅ Function updated!\n');

    // Recalculate sale percentages based on purchase price (not base)
    console.log('📝 Recalculating sale percentages from purchase prices...');
    await pool.query(`
      UPDATE dealer_products
      SET sale_percentage = CASE 
          WHEN dealer_purchase_price > 0 THEN 
              ROUND(((dealer_sale_price - dealer_purchase_price) / dealer_purchase_price * 100), 2)
          ELSE 0
      END
    `);
    console.log('✅ Sale percentages recalculated!\n');

    // Trigger recalculation by updating a dummy field
    console.log('📝 Triggering price recalculation...');
    await pool.query(`
      UPDATE dealer_products 
      SET updated_at = CURRENT_TIMESTAMP
    `);
    console.log('✅ Prices recalculated!\n');

    // Verify the results
    console.log('📊 Verification (Cascading Pricing):');
    const result = await pool.query(`
      SELECT 
        model_number,
        base_price::numeric(10,2) as base,
        purchase_percentage::numeric(5,2) as purch_pct,
        dealer_purchase_price::numeric(10,2) as purch_price,
        sale_percentage::numeric(5,2) as sale_pct,
        dealer_sale_price::numeric(10,2) as sale_price,
        ROUND((dealer_sale_price / base_price * 100 - 100), 2) as total_discount_from_base
      FROM dealer_products
      ORDER BY id
      LIMIT 8
    `);

    console.table(result.rows);

    console.log('\n✅ Cascading pricing model applied!');
    console.log('📌 Purchase Price = Base - discount');
    console.log('📌 Sale Price = Purchase Price - discount (NOT from base)');
    console.log('\nExample from first row:');
    const first = result.rows[0];
    console.log(`  Base: ₹${first.base}`);
    console.log(`  Purchase: ₹${first.base} + (₹${first.base} × ${first.purch_pct}%) = ₹${first.purch_price}`);
    console.log(`  Sale: ₹${first.purch_price} + (₹${first.purch_price} × ${first.sale_pct}%) = ₹${first.sale_price}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixCascadingPricing();
