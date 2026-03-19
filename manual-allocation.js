// Manual allocation simulation - assign order to nearest dealer
require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function manualAllocation() {
  try {
    console.log('🔍 Manual Order Allocation for PR-110326-020...\n');
    
    // Step 1: Get order details
    const orderResult = await pool.query(`
      SELECT o.order_id, o.order_number, o.pincode as customer_pincode,
        array_agg(oi.item_name) as product_names
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_number = 'PR-110326-020'
      GROUP BY o.order_id, o.pincode
    `);
    
    const order = orderResult.rows[0];
    console.log('📦 Order:', order.order_number, '| Pincode:', order.customer_pincode);
    console.log('   Products:', order.product_names.join(', '), '\n');
    
    // Step 2: Find nearest dealer with ALL products (using NEW logic)
    const dealersResult = await pool.query(`
      SELECT
        d.dealer_id, d.business_name, d.unique_dealer_id,
        d.service_pin, d.latitude, d.longitude, d.phone_number,
        CASE
          WHEN d.latitude IS NOT NULL AND pm.latitude IS NOT NULL THEN
            ROUND((6371 * acos(LEAST(1,
              cos(radians(pm.latitude)) * cos(radians(d.latitude::NUMERIC)) *
              cos(radians(d.longitude::NUMERIC) - radians(pm.longitude)) +
              sin(radians(pm.latitude)) * sin(radians(d.latitude::NUMERIC))
            )))::NUMERIC, 2)
          ELSE 9999
        END AS distance_km,
        (
          SELECT COUNT(DISTINCT dp.id)
          FROM dealer_inventory di
          JOIN dealer_products dp ON di.product_id = dp.id
          WHERE di.dealer_id = d.dealer_id
            AND dp.model_number = ANY($2::TEXT[])
            AND di.quantity_available > 0
        ) as available_product_count
      FROM dealers d
      LEFT JOIN pincode_master pm ON pm.pincode = $1
      WHERE d.status = 'Active'
        AND (
          SELECT COUNT(DISTINCT dp.id)
          FROM dealer_inventory di
          JOIN dealer_products dp ON di.product_id = dp.id
          WHERE di.dealer_id = d.dealer_id
            AND dp.model_number = ANY($2::TEXT[])
            AND di.quantity_available > 0
        ) = $3
      ORDER BY distance_km ASC
      LIMIT 1
    `, [order.customer_pincode, order.product_names, order.product_names.length]);
    
    if (dealersResult.rows.length === 0) {
      console.log('❌ No dealer found with required inventory');
      return;
    }
    
    const nearestDealer = dealersResult.rows[0];
    console.log('✅ Nearest Dealer Found:');
    console.log(`   Dealer ID: ${nearestDealer.dealer_id}`);
    console.log(`   Business: ${nearestDealer.business_name}`);
    console.log(`   Pincode: ${nearestDealer.service_pin}`);
    console.log(`   Distance: ${nearestDealer.distance_km} km`);
    console.log(`   Products Available: ${nearestDealer.available_product_count}\n`);
    
    // Step 3: Calculate response deadline
    const timeoutHours = 6;
    const responseDeadline = new Date(Date.now() + timeoutHours * 60 * 60 * 1000);
    
    // Step 4: Create dealer order request
    console.log('📝 Creating dealer order request...');
    const requestResult = await pool.query(`
      INSERT INTO dealer_order_requests (
        order_id, dealer_id, request_sequence,
        stock_verified, stock_available, stock_check_details,
        response_deadline, dealer_distance_km, 
        customer_pincode, dealer_service_pin, request_status
      )
      VALUES ($1, $2, 1, true, true, $3, $4, $5, $6, $7, 'pending')
      RETURNING id
    `, [
      order.order_id,
      nearestDealer.dealer_id,
      JSON.stringify({
        verified_at: new Date().toISOString(),
        products_verified: order.product_names,
        all_products_available: true
      }),
      responseDeadline,
      nearestDealer.distance_km,
      order.customer_pincode,
      nearestDealer.service_pin
    ]);
    
    console.log(`   Request ID: ${requestResult.rows[0].id}`);
    
    // Step 5: Update order status
    console.log('📦 Updating order status...');
    await pool.query(`
      UPDATE orders 
      SET status = 'Dealer Pending',
          assigned_dealer_id = $1,
          updated_at = NOW()
      WHERE order_id = $2
    `, [nearestDealer.dealer_id, order.order_id]);
    
    console.log('   Status updated to: Dealer Pending\n');
    
    // Step 6: Add allocation log
    await pool.query(`
      INSERT INTO order_allocation_log (order_id, log_type, message, details)
      VALUES ($1, 'dealer_assigned', 'Order allocated to dealer', $2)
    `, [order.order_id, JSON.stringify({
      dealer_id: nearestDealer.dealer_id,
      distance_km: nearestDealer.distance_km,
      products_verified: order.product_names,
      assigned_at: new Date().toISOString()
    })]);
    
    // Step 7: Verify final status
    const finalOrder = await pool.query(`
      SELECT o.order_number, o.status, o.assigned_dealer_id, d.business_name
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      WHERE o.order_id = $1
    `, [order.order_id]);
    
    console.log('✅ ALLOCATION COMPLETE!');
    console.log(`   Order: ${finalOrder.rows[0].order_number}`);
    console.log(`   Status: ${finalOrder.rows[0].status}`);
    console.log(`   Assigned to: Dealer ${finalOrder.rows[0].assigned_dealer_id} (${finalOrder.rows[0].business_name})`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

manualAllocation();
