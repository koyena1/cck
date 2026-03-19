// Script to insert sample dealer transaction data for Growth chart
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

async function insertGrowthData() {
  try {
    console.log('Connecting to database...');
    
    // Get the first dealer ID
    const dealerResult = await pool.query('SELECT dealer_id FROM dealers LIMIT 1');
    
    if (dealerResult.rows.length === 0) {
      console.log('No dealers found in database. Please create a dealer first.');
      process.exit(1);
    }
    
    const dealerId = dealerResult.rows[0].dealer_id;
    console.log(`Using dealer ID: ${dealerId}`);
    
    // Check if data already exists
    const existingData = await pool.query(
      `SELECT COUNT(*) as count FROM dealer_transactions 
       WHERE dealer_id = $1 
       AND EXTRACT(YEAR FROM transaction_date) = 2026 
       AND EXTRACT(MONTH FROM transaction_date) IN (1, 2)`,
      [dealerId]
    );
    
    if (parseInt(existingData.rows[0].count) > 0) {
      console.log(`Found ${existingData.rows[0].count} existing transactions for Jan-Feb 2026.`);
      console.log('Skipping insertion to avoid duplicates.');
      process.exit(0);
    }
    
    console.log('Inserting January 2026 transactions...');
    
    // January Sales (Profit)
    await pool.query(`
      INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
      VALUES 
      ($1, 'sale', '2026-01-05 10:30:00', 'INV-JAN-001', 25000.00, 4500.00, 29500.00, 'completed', 'online', 'CCTV Installation - Customer A'),
      ($1, 'sale', '2026-01-12 14:20:00', 'INV-JAN-002', 18000.00, 3240.00, 21240.00, 'completed', 'cash', 'Camera System - Customer B'),
      ($1, 'sale', '2026-01-18 11:45:00', 'INV-JAN-003', 32000.00, 5760.00, 37760.00, 'completed', 'online', 'Complete Security Setup - Customer C'),
      ($1, 'sale', '2026-01-25 16:00:00', 'INV-JAN-004', 15000.00, 2700.00, 17700.00, 'completed', 'upi', 'DVR System - Customer D'),
      ($1, 'sale', '2026-01-28 09:30:00', 'INV-JAN-005', 22000.00, 3960.00, 25960.00, 'completed', 'online', 'IP Cameras - Customer E')
    `, [dealerId]);
    
    // January Purchases (Loss/Costs)
    await pool.query(`
      INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
      VALUES 
      ($1, 'purchase', '2026-01-03 10:00:00', 'PUR-JAN-001', 8000.00, 1440.00, 9440.00, 'completed', 'online', 'Stock purchase - Cameras'),
      ($1, 'purchase', '2026-01-10 15:30:00', 'PUR-JAN-002', 12000.00, 2160.00, 14160.00, 'completed', 'bank_transfer', 'Stock purchase - DVR Systems'),
      ($1, 'purchase', '2026-01-20 11:00:00', 'PUR-JAN-003', 6500.00, 1170.00, 7670.00, 'completed', 'online', 'Stock purchase - Cables & Accessories'),
      ($1, 'purchase', '2026-01-27 14:00:00', 'PUR-JAN-004', 4000.00, 720.00, 4720.00, 'completed', 'cash', 'Tools and Equipment')
    `, [dealerId]);
    
    console.log('Inserting February 2026 transactions...');
    
    // February Sales (Profit)
    await pool.query(`
      INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
      VALUES 
      ($1, 'sale', '2026-02-02 10:15:00', 'INV-FEB-001', 28000.00, 5040.00, 33040.00, 'completed', 'online', 'Office Security System - Customer F'),
      ($1, 'sale', '2026-02-08 13:30:00', 'INV-FEB-002', 19500.00, 3510.00, 23010.00, 'completed', 'upi', 'Home CCTV Setup - Customer G'),
      ($1, 'sale', '2026-02-15 11:00:00', 'INV-FEB-003', 35000.00, 6300.00, 41300.00, 'completed', 'online', 'Commercial Installation - Customer H'),
      ($1, 'sale', '2026-02-22 16:45:00', 'INV-FEB-004', 16000.00, 2880.00, 18880.00, 'completed', 'cash', 'Wireless Camera System - Customer I'),
      ($1, 'sale', '2026-02-26 10:30:00', 'INV-FEB-005', 24000.00, 4320.00, 28320.00, 'completed', 'online', 'NVR System - Customer J')
    `, [dealerId]);
    
    // February Purchases (Loss/Costs)
    await pool.query(`
      INSERT INTO dealer_transactions (dealer_id, transaction_type, transaction_date, invoice_number, total_amount, gst_amount, final_amount, payment_status, payment_method, notes)
      VALUES 
      ($1, 'purchase', '2026-02-05 09:30:00', 'PUR-FEB-001', 9000.00, 1620.00, 10620.00, 'completed', 'online', 'Stock purchase - IP Cameras'),
      ($1, 'purchase', '2026-02-12 14:00:00', 'PUR-FEB-002', 11000.00, 1980.00, 12980.00, 'completed', 'bank_transfer', 'Stock purchase - NVR Units'),
      ($1, 'purchase', '2026-02-18 10:30:00', 'PUR-FEB-003', 5500.00, 990.00, 6490.00, 'completed', 'online', 'Stock purchase - Accessories'),
      ($1, 'purchase', '2026-02-25 15:00:00', 'PUR-FEB-004', 3500.00, 630.00, 4130.00, 'completed', 'cash', 'Maintenance Costs')
    `, [dealerId]);
    
    console.log('\n✅ Sample growth data inserted successfully!');
    console.log(`Dealer ID: ${dealerId}`);
    console.log('January 2026: 5 sales, 4 purchases');
    console.log('February 2026: 5 sales, 4 purchases');
    
    // Verify inserted data
    const summary = await pool.query(`
      SELECT 
        TO_CHAR(transaction_date, 'Mon YYYY') as month_year,
        transaction_type,
        COUNT(*) as transaction_count,
        SUM(final_amount) as total_amount
      FROM dealer_transactions
      WHERE dealer_id = $1
        AND EXTRACT(YEAR FROM transaction_date) = 2026
        AND EXTRACT(MONTH FROM transaction_date) IN (1, 2)
      GROUP BY TO_CHAR(transaction_date, 'Mon YYYY'), transaction_type
      ORDER BY MIN(transaction_date), transaction_type
    `, [dealerId]);
    
    console.log('\nSummary:');
    summary.rows.forEach(row => {
      console.log(`${row.month_year} - ${row.transaction_type}: ${row.transaction_count} transactions, RS ${parseFloat(row.total_amount).toLocaleString('en-IN')}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error inserting growth data:', error);
    process.exit(1);
  }
}

insertGrowthData();
