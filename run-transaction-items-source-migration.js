require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function run() {
  try {
    await pool.query(`
      ALTER TABLE dealer_transaction_items
        ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(20) DEFAULT 'protechtur'
    `);
    console.log('✅ Added purchase_source to dealer_transaction_items');

    await pool.query(`
      UPDATE dealer_transaction_items SET purchase_source = 'protechtur' WHERE purchase_source IS NULL
    `);
    console.log('✅ Backfilled existing rows');
    console.log('\n✅ Migration complete!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
}
run();
