const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkOrder() {
  try {
    console.log('🔍 Checking order PR-120326-023...\n');

    // Get order details
    const orderResult = await pool.query(`
      SELECT 
        o.*,
        d.business_name, d.full_name, d.phone_number, d.email,
        d.business_address, d.gstin, d.location, d.state, d.pincode as dealer_pincode
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_number = 'PR-120326-023'
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found');
      return;
    }

    const order = orderResult.rows[0];
    console.log('📋 Order Details:');
    console.log(`   Order Number: ${order.order_number}`);
    console.log(`   Status: ${order.status}`);
    console.log(`   Payment Method: ${order.payment_method}`);
    console.log(`   Payment Status: ${order.payment_status}`);
    console.log(`   Assigned Dealer ID: ${order.assigned_dealer_id || 'NONE'}`);
    
    if (order.assigned_dealer_id) {
      console.log(`\n🏪 Dealer Details:`);
      console.log(`   Business Name: ${order.business_name || 'N/A'}`);
      console.log(`   Full Name: ${order.full_name || 'N/A'}`);
      console.log(`   Phone: ${order.phone_number || 'N/A'}`);
      console.log(`   Address: ${order.business_address || 'N/A'}`);
      console.log(`   GSTIN: ${order.gstin || 'N/A'}`);
      console.log(`   Location: ${order.location || 'N/A'}`);
      console.log(`   State: ${order.state || 'N/A'}`);
      console.log(`   Pincode: ${order.dealer_pincode || 'N/A'}`);
    }

    console.log(`\n💰 Financial Details:`);
    console.log(`   Products Total: RS ${order.products_total || order.subtotal || 0}`);
    console.log(`   Installation Charges: RS ${order.installation_charges || 0}`);
    console.log(`   AMC Cost: RS ${order.amc_cost || 0}`);
    console.log(`   Tax Amount: RS ${order.tax_amount || 0}`);
    console.log(`   Total Amount: RS ${order.total_amount || 0}`);
    console.log(`   Advance Amount (COD): RS ${order.advance_amount || 0}`);

    // Check order items
    console.log('\n📦 Order Items:');
    const itemsResult = await pool.query(`
      SELECT item_name, quantity, unit_price, total_price, item_type
      FROM order_items
      WHERE order_id = $1
      ORDER BY id ASC
    `, [order.order_id]);

    let itemsTotal = 0;
    itemsResult.rows.forEach(item => {
      console.log(`   ${item.item_name} (${item.item_type})`);
      console.log(`      Qty: ${item.quantity}, Unit: RS ${item.unit_price}, Total: RS ${item.total_price}`);
      itemsTotal += parseFloat(item.total_price);
    });
    console.log(`   \n   Sum of all items: RS ${itemsTotal}`);
    
    // Calculate what GST should be
    const gstBase = itemsTotal;
    const calculatedGST = Math.round(gstBase * 0.18 * 100) / 100;
    const calculatedTotal = gstBase + calculatedGST;
    
    console.log(`\n🧮 Calculated Values:`);
    console.log(`   Base for GST (items total): RS ${gstBase}`);
    console.log(`   GST @ 18%: RS ${calculatedGST}`);
    console.log(`   Expected Grand Total: RS ${calculatedTotal}`);
    
    // Check for COD charges
    if (order.payment_method === 'cod') {
      const codCharge = parseFloat(order.advance_amount || 0);
      console.log(`\n💵 COD Payment:`);
      console.log(`   COD Extra Charge: RS ${codCharge}`);
      if (codCharge > 0) {
        console.log(`   Expected Grand Total with COD: RS ${calculatedTotal + codCharge}`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkOrder();
