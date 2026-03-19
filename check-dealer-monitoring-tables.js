const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkTables() {
  try {
    console.log('Checking dealer_stock_updates table...\n');
    
    // Check if table exists
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dealer_stock_updates'
      );
    `);
    
    console.log('dealer_stock_updates table exists:', tableCheck.rows[0].exists);
    
    if (tableCheck.rows[0].exists) {
      // Check table structure
      const columnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'dealer_stock_updates'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable columns:');
      columnsCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check row count
      const countCheck = await pool.query('SELECT COUNT(*) FROM dealer_stock_updates');
      console.log(`\nTotal records: ${countCheck.rows[0].count}`);
    }
    
    console.log('\n\nChecking dealer_notifications table...\n');
    
    // Check if notifications table exists
    const notifTableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'dealer_notifications'
      );
    `);
    
    console.log('dealer_notifications table exists:', notifTableCheck.rows[0].exists);
    
    if (notifTableCheck.rows[0].exists) {
      // Check table structure
      const notifColumnsCheck = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'dealer_notifications'
        ORDER BY ordinal_position;
      `);
      
      console.log('\nTable columns:');
      notifColumnsCheck.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check row count
      const notifCountCheck = await pool.query('SELECT COUNT(*) FROM dealer_notifications');
      console.log(`\nTotal records: ${notifCountCheck.rows[0].count}`);
    }
    
    console.log('\n\nChecking sample dealer...\n');
    
    // Get a sample dealer
    const dealerCheck = await pool.query(`
      SELECT dealer_id, full_name, email 
      FROM dealers 
      LIMIT 1
    `);
    
    if (dealerCheck.rows.length > 0) {
      const dealer = dealerCheck.rows[0];
      console.log(`Sample dealer: ID=${dealer.dealer_id}, Name=${dealer.full_name}, Email=${dealer.email}`);
      
      // Check if this dealer has any inventory
      const inventoryCheck = await pool.query(`
        SELECT COUNT(*) 
        FROM dealer_inventory 
        WHERE dealer_id = $1
      `, [dealer.dealer_id]);
      
      console.log(`Inventory items: ${inventoryCheck.rows[0].count}`);
    } else {
      console.log('No dealers found in database');
    }
    
  } catch (error) {
    console.error('Error checking tables:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

checkTables();
