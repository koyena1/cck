/**
 * Check Order Inventory Assignment
 * Verifies whether assigned dealer actually has the products in stock
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

async function checkOrderInventory() {
  const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
  });

  try {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 CHECKING ORDER INVENTORY ASSIGNMENT`);
    console.log(`${'='.repeat(80)}\n`);
    
    console.log(`Looking for orders with "testing" product or order number containing 110326-816...\n`);
    
    // Get recent orders with testing product
    const searchResult = await pool.query(`
      SELECT 
        o.order_id,
        o.order_number,
        o.assigned_dealer_id,
        o.status,
        o.created_at,
        d.business_name as dealer_name,
        d.unique_dealer_id,
        json_agg(
          json_build_object(
            'product_id', oi.product_id,
            'product_name', oi.item_name,
            'quantity', oi.quantity
          )
        ) as products
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      LEFT JOIN order_items oi ON oi.order_id = o.order_id
      WHERE (oi.item_name ILIKE '%testing%' OR o.order_number LIKE '%110326-816%')
        AND o.assigned_dealer_id IS NOT NULL
      GROUP BY o.order_id, d.business_name, d.unique_dealer_id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    let orders;
    if (searchResult.rows.length === 0) {
      console.log(`❌ No orders found with "testing" product or matching order number`);
      console.log(`\nChecking the most recent assigned order instead...\n`);
      
      const recentOrderResult = await pool.query(`
        SELECT 
          o.order_id,
          o.order_number,
          o.assigned_dealer_id,
          o.status,
          o.created_at,
          d.business_name as dealer_name,
          d.unique_dealer_id,
          json_agg(
            json_build_object(
              'product_id', oi.product_id,
              'product_name', oi.item_name,
              'quantity', oi.quantity
            )
          ) as products
        FROM orders o
        LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
        LEFT JOIN order_items oi ON oi.order_id = o.order_id
        WHERE o.assigned_dealer_id IS NOT NULL
        GROUP BY o.order_id, d.business_name, d.unique_dealer_id
        ORDER BY o.created_at DESC
        LIMIT 1
      `);
      
      if (recentOrderResult.rows.length === 0) {
        console.log(`❌ No assigned orders found in database`);
        await pool.end();
        return;
      }
      
      orders = recentOrderResult.rows;
    } else {
      orders = searchResult.rows;
      console.log(`✅ Found ${orders.length} order(s) matching search criteria\n`);
    }
    
    // Check each order found
    for (const order of orders) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`📦 Order: ${order.order_number}`);
      console.log(`📍 Status: ${order.status}`);
      console.log(`📅 Created: ${new Date(order.created_at).toLocaleString()}`);
      console.log(`👤 Assigned Dealer: ${order.dealer_name || 'None'} (ID: ${order.assigned_dealer_id || 'N/A'}, UID: ${order.unique_dealer_id || 'N/A'})`);
      console.log(`\n📋 Products in Order:`);
      
      const products = order.products.filter(p => p.product_id !== null);
      
      if (products.length === 0) {
        console.log(`   ⚠️  No products found in this order!`);
        console.log(`\n❌ RESULT: Order has NO products - This is a data issue`);
        continue;
      }
      
      products.forEach((p, idx) => {
        console.log(`   ${idx + 1}. ${p.product_name} (ID: ${p.product_id}) - Qty: ${p.quantity}`);
      });

      if (!order.assigned_dealer_id) {
        console.log(`\n✅ Order is not assigned to any dealer (correct state)`);
        continue;
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
          console.log(`   ❌ ${product.product_name}: NOT IN INVENTORY`);
          allProductsAvailable = false;
        } else {
          const inv = inventoryResult.rows[0];
          const hasStock = inv.quantity_available > 0;
          const icon = hasStock ? '✅' : '❌';
          console.log(`   ${icon} ${product.product_name}:`);
          console.log(`      - Available: ${inv.quantity_available}`);
          console.log(`      - Purchased: ${inv.quantity_purchased}`);
          console.log(`      - Sold: ${inv.quantity_sold}`);
          console.log(`      - Last Purchase: ${inv.last_purchase_date || 'Never'}`);
          
          if (!hasStock) {
            allProductsAvailable = false;
          }
        }
      }

      console.log(`\n${'─'.repeat(80)}`);
      if (allProductsAvailable) {
        console.log(`✅ RESULT: Dealer has all products in stock - Assignment is CORRECT`);
      } else {
        console.log(`❌ RESULT: Dealer DOES NOT have all required products - Assignment is INCORRECT`);
        console.log(`\n💡 RECOMMENDATION: This order should be in "Not Assigned" status for admin review`);
        console.log(`   The new inventory checking system will prevent this for future orders.`);
      }
    }
    
    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('Error checking order inventory:', error);
  } finally {
    await pool.end();
  }
}

checkOrderInventory();
