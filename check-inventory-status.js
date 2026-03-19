const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:123456@localhost:5432/cctv_platform'
});

async function checkInventoryStatus() {
  try {
    console.log('Checking inventory status for all dealers...\n');

    // Get all dealers
    const dealersResult = await pool.query('SELECT dealer_id, full_name FROM dealers ORDER BY dealer_id');
    
    for (const dealer of dealersResult.rows) {
      console.log(`\n=== Dealer: ${dealer.full_name} (ID: ${dealer.dealer_id}) ===`);
      
      const query = `
        SELECT 
          dp.id as product_id,
          dp.company,
          dp.model_number,
          COALESCE(di.quantity_available, 0) as quantity_available,
          COALESCE(di.quantity_purchased, 0) as quantity_purchased,
          COALESCE(di.quantity_sold, 0) as quantity_sold,
          dp.dealer_sale_price
        FROM dealer_products dp
        LEFT JOIN dealer_inventory di ON di.product_id = dp.id AND di.dealer_id = $1
        WHERE dp.is_active = true
        ORDER BY COALESCE(di.quantity_available, 0) ASC
        LIMIT 15
      `;
      
      const result = await pool.query(query, [dealer.dealer_id]);
      
      const outOfStock = result.rows.filter(r => r.quantity_available === 0);
      const lowStock = result.rows.filter(r => r.quantity_available > 0 && r.quantity_available < 5);
      const goodStock = result.rows.filter(r => r.quantity_available >= 5);
      
      console.log(`Out of Stock: ${outOfStock.length} products`);
      console.log(`Low Stock (1-4): ${lowStock.length} products`);
      console.log(`Good Stock (5+): ${goodStock.length} products`);
      
      if (outOfStock.length > 0) {
        console.log('\nOut of Stock Products:');
        outOfStock.slice(0, 5).forEach(p => {
          console.log(`  - ${p.company} ${p.model_number}: ${p.quantity_available} units (RS ${p.dealer_sale_price})`);
        });
      }
      
      if (lowStock.length > 0) {
        console.log('\nLow Stock Products (below 5 units):');
        lowStock.forEach(p => {
          console.log(`  - ${p.company} ${p.model_number}: ${p.quantity_available} units (RS ${p.dealer_sale_price})`);
        });
      }
      
      if (goodStock.length > 0 && goodStock.length <= 5) {
        console.log('\nGood Stock Products:');
        goodStock.forEach(p => {
          console.log(`  - ${p.company} ${p.model_number}: ${p.quantity_available} units`);
        });
      }
    }

    console.log('\n=== Summary ===');
    console.log('Check complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await pool.end();
  }
}

checkInventoryStatus();
