const { Pool } = require('pg');

// Use the same credentials as your API
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('Starting brand image column migration...');
    
    // Check if column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'brands' 
      AND column_name = 'image_url';
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      console.log('Adding image_url column to brands table...');
      
      // Add the column
      await client.query('ALTER TABLE brands ADD COLUMN image_url TEXT;');
      console.log('✓ Column added successfully');
      
      // Add comment
      await client.query("COMMENT ON COLUMN brands.image_url IS 'URL/path to brand logo image uploaded by admin';");
      console.log('✓ Column comment added');
      
      console.log('\nMigration completed successfully!');
    } else {
      console.log('image_url column already exists. No migration needed.');
    }
    
    // Show current brands table structure
    const columnsQuery = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'brands' 
      ORDER BY ordinal_position;
    `;
    
    const columnsResult = await client.query(columnsQuery);
    console.log('\nCurrent brands table structure:');
    console.log(columnsResult.rows);
    
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Failed:', err);
    process.exit(1);
  });
