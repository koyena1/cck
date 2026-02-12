const { Pool } = require('pg');

async function checkOrdersTable() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'cctv_platform',
    user: 'postgres',
    password: 'Koyen@123',
  });

  try {
    console.log('\n🔍 Checking orders table structure...\n');

    // Check orders table structure
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'orders'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Orders table columns:');
    result.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    // Check primary key
    const pkResult = await pool.query(`
      SELECT a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'orders'::regclass AND i.indisprimary;
    `);
    
    console.log('\n🔑 Primary key:');
    pkResult.rows.forEach(row => {
      console.log(`   ${row.attname}`);
    });
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkOrdersTable();
