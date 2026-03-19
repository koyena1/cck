require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function runMigration() {
  try {
    console.log('Running purchase_source migration...');

    await pool.query(`
      ALTER TABLE dealer_transactions 
        ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(20) DEFAULT 'protechtur'
    `);
    console.log('✅ Added purchase_source to dealer_transactions');

    await pool.query(`
      ALTER TABLE dealer_inventory 
        ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(20) DEFAULT 'protechtur'
    `);
    console.log('✅ Added purchase_source to dealer_inventory');

    await pool.query(`
      UPDATE dealer_transactions SET purchase_source = 'protechtur' WHERE purchase_source IS NULL
    `);
    await pool.query(`
      UPDATE dealer_inventory SET purchase_source = 'protechtur' WHERE purchase_source IS NULL
    `);
    console.log('✅ Backfilled existing records with protechtur');

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
  } finally {
    await pool.end();
  }
}

runMigration();
