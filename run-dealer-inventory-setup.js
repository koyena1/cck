const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'cctv_platform',
  user: 'postgres',
  password: 'Koyen@123',
});

async function runDealerInventorySetup() {
  try {
    console.log('📦 Setting up dealer inventory system...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-dealer-inventory-system.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    await pool.query(sql);
    
    console.log('✅ Dealer inventory system created successfully!');
    
    // Verify the table was created
    const checkResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'dealer_inventory'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table Structure:');
    checkResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    // Check if view was created
    const viewCheck = await pool.query(`
      SELECT COUNT(*) as count
      FROM information_schema.views
      WHERE table_name = 'dealer_inventory_view';
    `);
    
    if (viewCheck.rows[0].count > 0) {
      console.log('\n✅ View "dealer_inventory_view" created successfully');
    }
    
    console.log('\n✨ Dealer inventory system is ready to use!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

runDealerInventorySetup();
