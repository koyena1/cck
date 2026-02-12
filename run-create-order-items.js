const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function createOrderItemsTable() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'cctv_platform',
    user: 'postgres',
    password: 'Koyen@123',
  });

  try {
    console.log('\n🔧 Creating order_items table...\n');

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create-order-items-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute SQL
    await pool.query(sql);
    
    console.log('✅ order_items table created successfully!');
    
    // Verify table was created
    const checkResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'order_items'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📋 Table structure:');
    checkResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n✅ Migration complete!\n');
    
  } catch (error) {
    console.error('\n❌ Error creating order_items table:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createOrderItemsTable();
