const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432
});

async function testDealerAcceptedOrders() {
  try {
    console.log('Testing dealer accepted orders...\n');

    // Get all dealers
    const dealersResult = await pool.query(`
      SELECT dealer_id, full_name, email, business_name
      FROM dealers
      ORDER BY dealer_id
    `);

    console.log(`Found ${dealersResult.rows.length} dealers\n`);

    // Check accepted orders for each dealer
    for (const dealer of dealersResult.rows) {
      const acceptedResult = await pool.query(`
        SELECT 
          dor.id as request_id,
          dor.order_id,
          dor.dealer_id,
          dor.request_status,
          dor.responded_at,
          o.order_number
        FROM dealer_order_requests dor
        JOIN orders o ON dor.order_id = o.order_id
        WHERE dor.dealer_id = $1 AND dor.request_status = 'accepted'
        ORDER BY dor.responded_at DESC
      `, [dealer.dealer_id]);

      if (acceptedResult.rows.length > 0) {
        console.log(`\n✅ Dealer: ${dealer.full_name} (${dealer.business_name}) - ID: ${dealer.dealer_id}`);
        console.log(`   Email: ${dealer.email}`);
        console.log(`   Accepted Orders: ${acceptedResult.rows.length}`);
        
        acceptedResult.rows.forEach((order, idx) => {
          console.log(`   ${idx + 1}. Order: ${order.order_number}`);
          console.log(`      Request ID: ${order.request_id}`);
          console.log(`      Status: ${order.request_status}`);
          console.log(`      Responded: ${order.responded_at}`);
        });
      } else {
        console.log(`❌ Dealer: ${dealer.full_name} (${dealer.business_name}) - ID: ${dealer.dealer_id} - No accepted orders`);
      }
    }

    console.log('\n\n=== Testing API Query ===');
    console.log('Testing the exact query used by the API for dealer ID 1...\n');

    const apiQuery = `
      SELECT 
        dor.id as request_id,
        dor.order_id,
        dor.dealer_id,
        dor.request_sequence,
        dor.request_status,
        dor.stock_verified,
        dor.stock_available,
        dor.stock_check_details,
        dor.requested_at,
        dor.response_deadline,
        dor.responded_at,
        dor.dealer_notes,
        dor.dealer_distance_km,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.installation_address as address,
        o.pincode as customer_pincode,
        o.total_amount,
        o.status as order_status,
        COALESCE(
          (SELECT json_agg(
            json_build_object(
              'item_name', COALESCE(oi.camera_model, oi.product_name, oi.dvr_model, 'Unknown Item'),
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price
            )
          )
          FROM order_items oi
          WHERE oi.order_id = o.order_id),
          '[]'::json
        ) as order_items,
        EXTRACT(EPOCH FROM (dor.response_deadline - CURRENT_TIMESTAMP)) / 3600 as hours_remaining,
        (dor.response_deadline < CURRENT_TIMESTAMP) as is_expired
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      WHERE dor.dealer_id = $1 AND dor.request_status = 'accepted'
      ORDER BY dor.responded_at DESC
    `;

    const apiResult = await pool.query(apiQuery, [1]);
    console.log(`API Query Result for Dealer ID 1: ${apiResult.rows.length} rows`);
    
    if (apiResult.rows.length > 0) {
      apiResult.rows.forEach((row, idx) => {
        console.log(`\n${idx + 1}. Order Number: ${row.order_number}`);
        console.log(`   Request ID: ${row.request_id}`);
        console.log(`   Status: ${row.request_status}`);
        console.log(`   Order Items: ${row.order_items.length} items`);
      });
    }

  } catch (error) {
    console.error('Error testing dealer accepted orders:', error);
  } finally {
    await pool.end();
  }
}

testDealerAcceptedOrders();
