const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'cctv_platform',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkTable() {
  try {
    console.log('🔍 Checking dealer_notifications table...\n');

    // Check if table exists
    const tableExistsQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dealer_notifications'
      );
    `;
    
    const tableExists = await pool.query(tableExistsQuery);
    console.log('✅ Table exists:', tableExists.rows[0].exists);

    if (tableExists.rows[0].exists) {
      // Get table structure
      const columnsQuery = `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = 'dealer_notifications'
        ORDER BY ordinal_position;
      `;
      
      const columns = await pool.query(columnsQuery);
      console.log('\n📋 Table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Check if we have any records
      const countQuery = 'SELECT COUNT(*) as total FROM dealer_notifications';
      const count = await pool.query(countQuery);
      console.log(`\n📊 Total notifications: ${count.rows[0].total}`);

      // Check notifications per dealer
      const perDealerQuery = `
        SELECT dealer_id, COUNT(*) as count, 
               SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread
        FROM dealer_notifications
        GROUP BY dealer_id
        ORDER BY dealer_id;
      `;
      const perDealer = await pool.query(perDealerQuery);
      console.log('\n👥 Notifications per dealer:');
      if (perDealer.rows.length === 0) {
        console.log('  No notifications found');
      } else {
        perDealer.rows.forEach(row => {
          console.log(`  Dealer ${row.dealer_id}: ${row.count} total (${row.unread} unread)`);
        });
      }
    } else {
      console.log('\n❌ Table does not exist! You need to run: add-dealer-monitoring-system.sql');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkTable();
