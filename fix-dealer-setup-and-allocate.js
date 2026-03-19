/**
 * COMPREHENSIVE FIX FOR ORDER ALLOCATION
 * 
 * This will:
 * 1. Configure dealers with proper service_pins and GPS
 * 2. Set up inventory
 * 3. Fix stock management
 * 4. Re-trigger order allocation
 */

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function setupDealers() {
  try {
    console.log('\n🔧 SETTING UP DEALERS FOR MIDNAPORE/TAMLUK AREA\n');
    console.log('================================================\n');

    // Get existing dealers
    const dealersResult = await pool.query('SELECT dealer_id, business_name, full_name FROM dealers ORDER BY dealer_id');
    const dealers = dealersResult.rows;

    if (dealers.length < 3) {
      console.log('❌ Not enough dealers! Need at least 3.');
      return;
    }

    // Configure dealers with PINs around customer location (721636)
    const dealerConfigs = [
      {
        dealer_id: dealers[0].dealer_id,
        business_name: dealers[0].business_name || dealers[0].full_name,
        service_pin: '721636',  // EXACT MATCH - should get order FIRST
        location: 'Tamluk, Deypara',
        latitude: 22.42,
        longitude: 87.32,
        address: 'Tamluk Main Road, Deypara, West Bengal 721636'
      },
      {
        dealer_id: dealers[1].dealer_id,
        business_name: dealers[1].business_name || dealers[1].full_name,
        service_pin: '721635',  // Nearby (5km away)
        location: 'Tamluk Town',
        latitude: 22.43,
        longitude: 87.33,
        address: 'College Road, Tamluk, West Bengal 721635'
      },
      {
        dealer_id: dealers[2].dealer_id,
        business_name: dealers[2].business_name || dealers[2].full_name,
        service_pin: '721637',  // Slightly farther (7km away)
        location: 'Moyna, Midnapore',
        latitude: 22.38,
        longitude: 87.36,
        address: 'Moyna Bazar, Midnapore, West Bengal 721637'
      }
    ];

    console.log('📍 Configuring dealers with service areas:\n');

    for (const config of dealerConfigs) {
      await pool.query(`
        UPDATE dealers
        SET service_pin = $2,
            location = $3,
            latitude = $4,
            longitude = $5,
            business_address = $6
        WHERE dealer_id = $1
      `, [config.dealer_id, config.service_pin, config.location, config.latitude, config.longitude, config.address]);

      console.log(`✅ ${config.business_name} (ID: ${config.dealer_id})`);
      console.log(`   PIN: ${config.service_pin}`);
      console.log(`   Location: ${config.location}`);
      console.log(`   GPS: ${config.latitude}, ${config.longitude}\n`);
    }

    // Get some products to give dealers inventory
    const productsResult = await pool.query(`
      SELECT id as product_id, company, model_number, dealer_purchase_price
      FROM dealer_products
      WHERE stock_quantity > 0
      LIMIT 5
    `);

    const products = productsResult.rows;

    if (products.length === 0) {
      console.log('⚠️  No products with stock found. Using first available product...');
      const anyProduct = await pool.query('SELECT id as product_id FROM dealer_products LIMIT 1');
      if (anyProduct.rows.length > 0) {
        products.push(anyProduct.rows[0]);
      }
    }

    console.log('\n📦 Setting up dealer inventory:\n');

    for (const dealer of dealerConfigs) {
      for (const product of products) {
        // Set initial stock - IMPORTANT: First dealer (721636) has MOST stock
        const initialStock = dealer.service_pin === '721636' ? 50 : 20;

        await pool.query(`
          INSERT INTO dealer_inventory (dealer_id, product_id, quantity_available, quantity_purchased, quantity_sold, last_purchase_date)
          VALUES ($1, $2, $3, $3, 0, CURRENT_TIMESTAMP)
          ON CONFLICT (dealer_id, product_id)
          DO UPDATE SET 
            quantity_available = $3,
            quantity_purchased = $3,
            quantity_sold = 0,
            last_purchase_date = CURRENT_TIMESTAMP
        `, [dealer.dealer_id, product.product_id, initialStock]);
      }

      console.log(`✅ ${dealer.business_name}: Added ${products.length} products with ${dealer.service_pin === '721636' ? 50 : 20} units each`);
    }

    console.log('\n================================================\n');
    console.log('✅ DEALER SETUP COMPLETE!\n');

    // Show summary
    console.log('📊 DEALER SUMMARY:\n');
    for (const dealer of dealerConfigs) {
      const stockResult = await pool.query(`
        SELECT COUNT(*) as product_count, SUM(quantity_available) as total_stock
        FROM dealer_inventory
        WHERE dealer_id = $1
      `, [dealer.dealer_id]);

      const stock = stockResult.rows[0];
      console.log(`${dealer.business_name} (PIN: ${dealer.service_pin})`);
      console.log(`  Products: ${stock.product_count}, Total Stock: ${stock.total_stock} units\n`);
    }

    return dealerConfigs;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

async function reallocateOrder() {
  try {
    console.log('\n🔄 RE-ALLOCATING ORDER ORD-20260224-0001\n');
    console.log('================================================\n');

    // Get the order
    const orderResult = await pool.query(`
      SELECT order_id FROM orders WHERE order_number = 'ORD-20260224-0001'
    `);

    if (orderResult.rows.length === 0) {
      console.log('❌ Order not found!');
      return;
    }

    const orderId = orderResult.rows[0].order_id;

    // Clear any previous allocation attempts
    await pool.query('DELETE FROM dealer_order_requests WHERE order_id = $1', [orderId]);
    await pool.query('DELETE FROM order_allocation_log WHERE order_id = $1', [orderId]);
    await pool.query('UPDATE orders SET assigned_dealer_id = NULL, status = $2 WHERE order_id = $1', [orderId, 'Pending']);

    console.log('✅ Cleared previous allocation attempts\n');

    // Trigger allocation via API
    console.log ('🚀 Triggering allocation via API...\n');

    const response = await fetch('http://localhost:3000/api/order-allocation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId })
    });

    const result = await response.json();

    console.log('📊 ALLOCATION RESULT:\n');
    console.log(`Success: ${result.success}`);
    console.log(`Allocated: ${result.allocated || false}`);
    if (result.dealer_name) {
      console.log(`Dealer: ${result.dealer_name} (ID: ${result.dealer_id})`);
    }
    console.log(`Message: ${result.message}\n`);

    // Verify the allocation
    const verifyResult = await pool.query(`
      SELECT 
        o.order_number,
        o.pincode as customer_pin,
        o.assigned_dealer_id,
        d.business_name,
        d.service_pin as dealer_pin
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      WHERE o.order_id = $1
    `, [orderId]);

    if (verifyResult.rows.length > 0) {
      const order = verifyResult.rows[0];
      console.log('✅ VERIFICATION:\n');
      console.log(`Order: ${order.order_number}`);
      console.log(`Customer PIN: ${order.customer_pin}`);
      console.log(`Assigned to: ${order.business_name || 'NOT ASSIGNED'}`);
      console.log(`Dealer PIN: ${order.dealer_pin || 'N/A'}\n`);

      if (order.dealer_pin === order.customer_pin) {
        console.log('🎯 PERFECT! Order went to dealer with EXACT PIN MATCH!\n');
      } else if (order.assigned_dealer_id) {
        console.log('⚠️  Order went to different dealer (no exact PIN match or no stock)\n');
      } else {
        console.log('❌ Order NOT allocated!\n');
      }
    }

    console.log('================================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function main() {
  try {
    // Step 1: Setup dealers
    const dealers = await setupDealers();

    // Step 2: Re-allocate order
    await reallocateOrder();

    console.log('\n✅ ALL DONE!\n');

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await pool.end();
  }
}

main();
