// Check existing dealer transaction data
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function checkData() {
  try {
    console.log('Checking existing transaction data...\n');
    
    // Get dealer info
    const dealers = await pool.query('SELECT dealer_id, full_name, business_name FROM dealers LIMIT 5');
    console.log(`Found ${dealers.rows.length} dealer(s):`);
    dealers.rows.forEach(d => {
      console.log(`  - Dealer ID ${d.dealer_id}: ${d.full_name} (${d.business_name})`);
    });
    
    // Check transactions for each dealer
    for (const dealer of dealers.rows) {
      const summary = await pool.query(`
        SELECT 
          EXTRACT(YEAR FROM transaction_date) as year,
          EXTRACT(MONTH FROM transaction_date) as month,
          transaction_type,
          COUNT(*) as count,
          SUM(final_amount) as total
        FROM dealer_transactions
        WHERE dealer_id = $1
          AND EXTRACT(YEAR FROM transaction_date) = 2026
        GROUP BY EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date), transaction_type
        ORDER BY year, month, transaction_type
      `, [dealer.dealer_id]);
      
      if (summary.rows.length > 0) {
        console.log(`\nDealer ${dealer.dealer_id} (${dealer.full_name}) - 2026 Data:`);
        summary.rows.forEach(row => {
          const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][row.month - 1];
          console.log(`  ${monthName} ${row.year} - ${row.transaction_type}: ${row.count} transactions, RS ${parseFloat(row.total).toLocaleString('en-IN')}`);
        });
      } else {
        console.log(`\nDealer ${dealer.dealer_id} (${dealer.full_name}): No 2026 transactions`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkData();
