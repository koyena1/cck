// Add more sample data for January and February 2026
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

async function addMoreData() {
  try {
    console.log('Adding more transaction data for January and February 2026...\n');
    
    // Get all dealers
    const dealers = await pool.query('SELECT dealer_id, full_name FROM dealers');
    
    for (const dealer of dealers.rows) {
      console.log(`Adding data for Dealer ${dealer.dealer_id} (${dealer.full_name})...`);
      
      try {
        // January 2026 Sales
        await pool.query(`
          INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
          VALUES 
          ($1, 'sale', '2026-01-05 10:30:00', $2, 25000.00, 4500.00, 29500.00, 'completed', 'online', 'January Installation'),
          ($1, 'sale', '2026-01-12 14:20:00', $3, 18000.00, 3240.00, 21240.00, 'completed', 'cash', 'Camera System'),
          ($1, 'sale', '2026-01-18 11:45:00', $4, 32000.00, 5760.00, 37760.00, 'completed', 'online', 'Complete Setup'),
          ($1, 'sale', '2026-01-25 16:00:00', $5, 15000.00, 2700.00, 17700.00, 'completed', 'upi', 'DVR System')
          ON CONFLICT (invoice_number) DO NOTHING
        `, [
          dealer.dealer_id, 
          `INV-JAN-${dealer.dealer_id}-001`,
          `INV-JAN-${dealer.dealer_id}-002`,
          `INV-JAN-${dealer.dealer_id}-003`,
          `INV-JAN-${dealer.dealer_id}-004`
        ]);
        
        // January 2026 Purchases
        await pool.query(`
          INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
          VALUES 
          ($1, 'purchase', '2026-01-03 10:00:00', $2, 8000.00, 1440.00, 9440.00, 'completed', 'online', 'Stock purchase'),
          ($1, 'purchase', '2026-01-15 15:30:00', $3, 6500.00, 1170.00, 7670.00, 'completed', 'bank_transfer', 'Equipment')
          ON CONFLICT (invoice_number) DO NOTHING
        `, [
          dealer.dealer_id,
          `PUR-JAN-${dealer.dealer_id}-001`,
          `PUR-JAN-${dealer.dealer_id}-002`
        ]);
        
        // Additional February 2026 Sales
        await pool.query(`
          INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
          VALUES 
          ($1, 'sale', '2026-02-05 10:15:00', $2, 28000.00, 5040.00, 33040.00, 'completed', 'online', 'Office Security'),
          ($1, 'sale', '2026-02-12 13:30:00', $3, 19500.00, 3510.00, 23010.00, 'completed', 'upi', 'Home CCTV'),
          ($1, 'sale', '2026-02-20 11:00:00', $4, 35000.00, 6300.00, 41300.00, 'completed', 'online', 'Commercial')
          ON CONFLICT (invoice_number) DO NOTHING
        `, [
          dealer.dealer_id,
          `INV-FEB-${dealer.dealer_id}-001`,
          `INV-FEB-${dealer.dealer_id}-002`,
          `INV-FEB-${dealer.dealer_id}-003`
        ]);
        
        // Additional February 2026 Purchases
        await pool.query(`
          INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
          VALUES 
          ($1, 'purchase', '2026-02-08 09:30:00', $2, 9000.00, 1620.00, 10620.00, 'completed', 'online', 'Stock'),
          ($1, 'purchase', '2026-02-18 14:00:00', $3, 5500.00, 990.00, 6490.00, 'completed', 'bank_transfer', 'Accessories')
          ON CONFLICT (invoice_number) DO NOTHING
        `, [
          dealer.dealer_id,
          `PUR-FEB-${dealer.dealer_id}-001`,
          `PUR-FEB-${dealer.dealer_id}-002`
        ]);
        
        console.log(`  ✓ Added transactions for Dealer ${dealer.dealer_id}`);
      } catch (err) {
        console.log(`  ✗ Error for Dealer ${dealer.dealer_id}: ${err.message}`);
      }
    }
    
    // Show summary
    console.log('\n📊 Summary of all transactions:');
    const summary = await pool.query(`
      SELECT 
        d.dealer_id,
        d.full_name,
        EXTRACT(MONTH FROM dt.transaction_date) as month,
        dt.transaction_type,
        COUNT(*) as count,
        SUM(dt.final_amount) as total
      FROM dealers d
      LEFT JOIN dealer_transactions dt ON d.dealer_id = dt.dealer_id
      WHERE EXTRACT(YEAR FROM dt.transaction_date) = 2026
        AND EXTRACT(MONTH FROM dt.transaction_date) IN (1, 2)
      GROUP BY d.dealer_id, d.full_name, EXTRACT(MONTH FROM dt.transaction_date), dt.transaction_type
      ORDER BY d.dealer_id, month, dt.transaction_type
    `);
    
    summary.rows.forEach(row => {
      const monthName = row.month === 1 ? 'Jan' : 'Feb';
      console.log(`Dealer ${row.dealer_id} (${row.full_name}) - ${monthName} - ${row.transaction_type}: ${row.count} transactions, RS ${parseFloat(row.total).toLocaleString('en-IN')}`);
    });
    
    console.log('\n✅ Data insertion complete! Refresh your dealer dashboard to see the Growth chart.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMoreData();
