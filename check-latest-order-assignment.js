/**
 * Check Latest Order Assignment
 * Verifies the most recent order and its dealer assignment with inventory check
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        process.env[key.trim()] = value;
      }
    });
  }
}

loadEnv();

async function checkLatestOrder() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 CHECKING LATEST ORDER ASSIGNMENT`);
    console.log(`${'='.repeat(80)}\n`);
    
    // Get the most recent order
    const orderResult = await pool.query(`
      SELECT 
        o.order_id,
        o.order_number,
        o.assigned_dealer_id,
        o.status,
        o.created_at,
        o.total_amount,
        o.tax_amount,
        o.subtotal,
        d.business_name as dealer_name,
        d.unique_dealer_id,
        array_agg(
          DISTINCT jsonb_build_object(
            'product_id', oi.product_id,
            'item_name', oi.item_name,
            'quantity', oi.quantity
          )
        ) FILTER (WHERE oi.product_id IS NOT NULL) as products
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      GROUP BY o.order_id, d.business_name, d.unique_dealer_id
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log(`❌ No orders found in database`);
      await pool.end();
      return;
    }

    const order = orderResult.rows[0];
    
    console.log(`📦 Order: ${order.order_number}`);
    console.log(`📍 Status: ${order.status}`);
    console.log(`📅 Created: ${new Date(order.created_at).toLocaleString()}`);
    console.log(`💰 Subtotal: Rs.${order.subtotal || 0}, Tax: Rs.${order.tax_amount || 0}, Total: Rs.${order.total_amount || 0}`);
    console.log(`👤 Assigned Dealer: ${order.dealer_name || 'None'} (ID: ${order.assigned_dealer_id || 'N/A'}, UID: ${order.unique_dealer_id || 'N/A'})`);
    console.log(`\n📋 Products in Order:`);
    
    const products = order.products || [];
    
    if (products.length === 0) {
      console.log(`   ⚠️  No products found!`);
      console.log(`\n❌ RESULT: Order has NO products - This is a data issue`);
      await pool.end();
      return;
    }
    
    products.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.item_name} (ID: ${p.product_id}) - Qty: ${p.quantity}`);
    });

    if (!order.assigned_dealer_id) {
      console.log(`\n✅ Order is NOT assigned to any dealer - Status: ${order.status}`);
      console.log(`   (This is correct if no dealers have the product in stock)`);
      await pool.end();
      return;
    }

    // Check if dealer has these products in inventory
    console.log(`\n🔍 Checking Dealer ${order.assigned_dealer_id} Inventory:\n`);
    
    let allProductsAvailable = true;
    
    for (const product of products) {
      const inventoryResult = await pool.query(`
        SELECT 
          di.quantity_purchased,
          di.quantity_sold,
          di.quantity_available,
          di.last_purchase_date
        FROM dealer_inventory di
        WHERE di.dealer_id = $1 AND di.product_id = $2
      `, [order.assigned_dealer_id, product.product_id]);

      if (inventoryResult.rows.length === 0) {
        console.log(`   ❌ ${product.item_name} (ID: ${product.product_id}): NOT IN INVENTORY`);
        allProductsAvailable = false;
      } else {
        const inv = inventoryResult.rows[0];
        const hasStock = inv.quantity_available > 0;
        const icon = hasStock ? '✅' : '❌';
        console.log(`   ${icon} ${product.item_name}:`);
        console.log(`      - Available: ${inv.quantity_available}`);
        console.log(`      - Purchased: ${inv.quantity_purchased}`);
        console.log(`      - Sold: ${inv.quantity_sold}`);
        console.log(`      - Last Purchase: ${inv.last_purchase_date || 'Never'}`);
        
        if (!hasStock) {
          allProductsAvailable = false;
        }
      }
    }

    console.log(`\n${'='.repeat(80)}`);
    if (allProductsAvailable) {
      console.log(`✅ RESULT: Dealer HAS all products in stock - Assignment is CORRECT`);
    } else {
      console.log(`❌ RESULT: Dealer DOES NOT have all required products!`);
      console.log(`\n💡 PROBLEM DETECTED:`);
      console.log(`   This order should NOT have been assigned to this dealer.`);
      console.log(`   It should be in "Pending Admin Review" status.`);
      console.log(`\n🔍 Investigating order allocation log...`);
      
      // Check allocation log
      const logResult = await pool.query(`
        SELECT log_type, message, details, created_at
        FROM order_allocation_log
        WHERE order_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      `, [order.order_id]);
      
      if (logResult.rows.length > 0) {
        console.log(`\n📜 Allocation Log:`);
        logResult.rows.forEach(log => {
          console.log(`   - ${new Date(log.created_at).toLocaleTimeString()}: [${log.log_type}] ${log.message}`);
          if (log.details) {
            console.log(`     Details: ${JSON.stringify(log.details, null, 2)}`);
          }
        });
      } else {
        console.log(`\n⚠️  No allocation log found for this order!`);
      }
    }
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('Error checking latest order:', error);
  } finally {
    await pool.end();
  }
}

checkLatestOrder();
