const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'cctv_platform',
  password: 'Koyen@123',
  port: 5432
});

async function testAcceptedOrdersAPI() {
  try {
    console.log('Testing the fixed API query for accepted orders...\n');

    // Test for dealer ID 3 (jitesh sahoo)
    const dealerId = 3;
    
    const query = `
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
              'item_name', oi.item_name,
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

    console.log(`Fetching accepted orders for Dealer ID ${dealerId}...\n`);
    
    const result = await pool.query(query, [dealerId]);

    console.log(`✅ Query executed successfully!`);
    console.log(`Found ${result.rows.length} accepted order(s)\n`);

    if (result.rows.length > 0) {
      result.rows.forEach((order, idx) => {
        console.log(`${idx + 1}. Order Number: ${order.order_number}`);
        console.log(`   Request ID: ${order.request_id}`);
        console.log(`   Customer: ${order.customer_name} (${order.customer_phone})`);
        console.log(`   Address: ${order.address}`);
        console.log(`   Total Amount: RS ${order.total_amount}`);
        console.log(`   Order Status: ${order.order_status}`);
        console.log(`   Request Status: ${order.request_status}`);
        console.log(`   Responded At: ${order.responded_at}`);
        console.log(`   Order Items (${order.order_items.length} items):`);
        
        order.order_items.forEach((item, itemIdx) => {
          console.log(`      ${itemIdx + 1}. ${item.item_name} x${item.quantity} @ RS ${item.unit_price} = RS ${item.total_price}`);
        });
        console.log('');
      });

      console.log('\n✅ The API query is now working correctly!');
      console.log('✅ Accepted orders should now display in the dealer portal.');
    } else {
      console.log('No accepted orders found for this dealer.');
    }

  } catch (error) {
    console.error('❌ Error testing API query:', error.message);
    console.error('Full error:', error);
  } finally {
    await pool.end();
  }
}

testAcceptedOrdersAPI();
