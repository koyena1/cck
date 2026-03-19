const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrder112() {
  try {
    console.log('🔍 Checking order 112 (PR-120326-023)...\n');

    // Get order details with dealer info
    const orderResult = await pool.query(`
      SELECT 
        o.*,
        d.business_name, d.full_name, d.phone_number, d.email,
        d.business_address, d.gstin, d.location, d.state, d.pincode as dealer_pincode
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_id = 112
    `);

    const order = orderResult.rows[0];
    console.log('📋 Order Details:');
    console.log(`   Order ID: ${order.order_id}`);
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Payment Method: ${order.payment_method}`);
    console.log(`   Payment Status: ${order.payment_status}`);
    console.log(`   Assigned Dealer ID: ${order.assigned_dealer_id || 'NONE'}`);
    
    console.log(`\n🏪 Dealer Info (from JOIN):`);
    console.log(`   Business Name: ${order.business_name || 'NULL'}`);
    console.log(`   Full Name: ${order.full_name || 'NULL'}`);
    console.log(`   Phone: ${order.phone_number || 'NULL'}`);
    console.log(`   Address: ${order.business_address || 'NULL'}`);
    console.log(`   GSTIN: ${order.gstin || 'NULL'}`);
    console.log(`   Location: ${order.location || 'NULL'}`);
    console.log(`   State: ${order.state || 'NULL'}`);
    console.log(`   Pincode: ${order.dealer_pincode || 'NULL'}`);

    // Check dealer directly
    if (order.assigned_dealer_id) {
      console.log(`\n🔍 Checking dealer ${order.assigned_dealer_id} directly:`);
      const dealerResult = await pool.query(`
        SELECT * FROM dealers WHERE dealer_id = $1
      `, [order.assigned_dealer_id]);
      
      if (dealerResult.rows.length > 0) {
        const dealer = dealerResult.rows[0];
        console.log(`   Business Name: ${dealer.business_name || 'NULL'}`);
        console.log(`   Full Name: ${dealer.full_name || 'NULL'}`);
        console.log(`   Phone: ${dealer.phone_number || 'NULL'}`);
        console.log(`   Address: ${dealer.business_address || 'NULL'}`);
        console.log(`   GSTIN: ${dealer.gstin || 'NULL'}`);
        console.log(`   Status: ${dealer.status}`);
      } else {
        console.log(`   ❌ Dealer not found!`);
      }
    }

    console.log(`\n💰 Financial Details in DB:`);
    console.log(`   products_total: RS ${order.products_total}`);
    console.log(`   subtotal: RS ${order.subtotal}`);
    console.log(`   installation_charges: RS ${order.installation_charges}`);
    console.log(`   amc_cost: RS ${order.amc_cost}`);
    console.log(`   tax_amount: RS ${order.tax_amount}`);
    console.log(`   total_amount: RS ${order.total_amount}`);
    console.log(`   advance_amount: RS ${order.advance_amount}`);

    // Check order items
    console.log('\n📦 Order Items in DB:');
    const itemsResult = await pool.query(`
      SELECT item_name, quantity, unit_price, total_price, item_type
      FROM order_items
      WHERE order_id = 112
      ORDER BY id ASC
    `);

    let itemsTotal = 0;
    itemsResult.rows.forEach(item => {
      console.log(`   ${item.item_name} (${item.item_type})`);
      console.log(`      Qty: ${item.quantity}, Unit: RS ${item.unit_price}, Total: RS ${item.total_price}`);
      itemsTotal += parseFloat(item.total_price);
    });
    console.log(`   \n   ➕ Sum of all items: RS ${itemsTotal}`);
    
    // Check what should be shown
    const productTotalForInvoice = parseFloat(order.products_total || order.subtotal || itemsTotal);
    const gst = Math.round(productTotalForInvoice * 0.18 * 100) / 100;
    const codCharge = order.payment_method === 'cod' ? parseFloat(order.advance_amount || 0) : 0;
    const grandTotal = productTotalForInvoice + gst + codCharge;
    
    console.log(`\n🧮 Invoice Calculation:`);
    console.log(`   Product Total: RS ${productTotalForInvoice} (should match items sum)`);
    console.log(`   GST @ 18%: RS ${gst}`);
    if (codCharge > 0) console.log(`   COD Extra: RS ${codCharge}`);
    console.log(`   Grand Total: RS ${grandTotal}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrder112();
