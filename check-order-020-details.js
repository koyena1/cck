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

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkOrder() {
  try {
    console.log('='.repeat(60));
    console.log('CHECKING ORDER PR-110326-020');
    console.log('='.repeat(60));

    // Get order details
    const orderResult = await pool.query(`
      SELECT 
        o.*,
        d.dealer_id as assigned_dealer_id_fk,
        d.business_name as dealer_name,
        d.full_name as dealer_full_name,
        d.business_address as dealer_address,
        d.pincode as dealer_pincode,
        d.location as dealer_location,
        d.phone_number as dealer_phone,
        d.gstin as dealer_gstin
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_number LIKE 'PR-110326-020%'
      ORDER BY o.created_at DESC
      LIMIT 1
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found!');
      await pool.end();
      return;
    }

    const order = orderResult.rows[0];
    console.log('\n📦 ORDER DETAILS:');
    console.log('Order Number:', order.order_number);
    console.log('Status:', order.status);
    console.log('Assigned Dealer ID:', order.assigned_dealer_id);
    console.log('Dealer Name:', order.dealer_name || 'NOT ASSIGNED');
    console.log('Customer Pincode:', order.pincode);

    // Get order items
    const itemsResult = await pool.query(`
      SELECT * FROM order_items WHERE order_id = $1
    `, [order.order_id]);

    console.log('\n📋 ORDER ITEMS:');
    itemsResult.rows.forEach((item, idx) => {
      console.log(`  ${idx + 1}. ${item.item_name} (Quantity: ${item.quantity})`);
    });

    // Check if any dealer has this product
    if (itemsResult.rows.length > 0) {
      const productName = itemsResult.rows[0].item_name;
      
      console.log('\n🔍 CHECKING DEALER INVENTORY FOR:', productName);
      
      // First check if this product exists in dealer_products
      const dealerProductResult = await pool.query(`
        SELECT * FROM dealer_products 
        WHERE model_number = $1 OR description ILIKE $1
        LIMIT 1
      `, [productName]);

      if (dealerProductResult.rows.length === 0) {
        console.log('❌ Product not found in dealer_products table!');
        console.log('   This product needs to be added to dealer_products first.');
      } else {
        const product = dealerProductResult.rows[0];
        console.log('✅ Product found in dealer_products:');
        console.log(`   ID: ${product.id}`);
        console.log(`   Model: ${product.model_number}`);
        console.log(`   Type: ${product.product_type}`);
        console.log(`   Company: ${product.company}`);

        // Now check dealer inventory
        const inventoryResult = await pool.query(`
          SELECT 
            di.dealer_id,
            d.business_name,
            d.full_name,
            d.pincode as dealer_pincode,
            d.location,
            d.serviceable_pincodes,
            dp.model_number,
            dp.product_type,
            di.quantity_available,
            di.quantity_purchased,
            di.quantity_sold
          FROM dealer_inventory di
          JOIN dealers d ON d.dealer_id = di.dealer_id
          JOIN dealer_products dp ON dp.id = di.product_id
          WHERE di.product_id = $1 AND d.status = 'Approved'
          ORDER BY di.quantity_available DESC
        `, [product.id]);

        if (inventoryResult.rows.length === 0) {
          console.log('\n❌ No dealers have this product in inventory!');
        } else {
          console.log(`\n✅ Found ${inventoryResult.rows.length} dealer(s) with this product:`);
          inventoryResult.rows.forEach((inv, idx) => {
            console.log(`\n  Dealer ${idx + 1}:`);
            console.log(`    - Name: ${inv.business_name || inv.full_name}`);
            console.log(`    - Location: ${inv.location || 'N/A'}`);
            console.log(`    - Pincode: ${inv.dealer_pincode || 'N/A'}`);
            console.log(`    - Purchased: ${inv.quantity_purchased || 0}`);
            console.log(`    - Sold: ${inv.quantity_sold || 0}`);
            console.log(`    - Available: ${inv.quantity_available || 0}`);
            
            // Check if can service customer pincode
            const serviceablePincodes = inv.serviceable_pincodes || '';
            const customerPincode = order.pincode;
            const canService = serviceablePincodes.split(',').map(p => p.trim()).includes(customerPincode);
            
            if (canService) {
              console.log(`    - ✅ CAN SERVICE customer pincode ${customerPincode}`);
            } else {
              console.log(`    - ❌ CANNOT service customer pincode ${customerPincode}`);
              console.log(`    - Serviceable: ${serviceablePincodes || 'Not set'}`);
            }
          });
        }
      }
    }

    // Check allocation logs if any
    console.log('\n📝 CHECKING ORDER HISTORY/NOTES:');
    if (order.notes) {
      console.log('Notes:', order.notes);
    }
    if (order.escalation_reason) {
      console.log('Escalation Reason:', order.escalation_reason);
    }

    await pool.end();
  } catch (error) {
    console.error('Error:', error);
    await pool.end();
  }
}

checkOrder();
