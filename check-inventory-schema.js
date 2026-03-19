require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

pool.query(`
  SELECT column_name, data_type, is_nullable
  FROM information_schema.columns 
  WHERE table_name='dealer_inventory' 
  ORDER BY ordinal_position
`).then(r => {
  console.log('\ndealer_inv entory table columns:');
  r.rows.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} (${c.is_nullable})`));
  pool.end();
}).catch(e => {
  console.error('Error:', e.message);
  pool.end();
});
