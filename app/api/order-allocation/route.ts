import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// POST - Allocate order to nearest dealer with stock
export async function POST(request: Request) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Check if order is already allocated to prevent duplicates
    const existingAllocation = await pool.query(`
      SELECT COUNT(*) as count FROM dealer_order_requests WHERE order_id = $1
    `, [orderId]);

    if (parseInt(existingAllocation.rows[0].count) > 0) {
      console.log(`⚠️ Order ${orderId} already has dealer requests. Skipping duplicate allocation.`);
      return NextResponse.json({
        success: true,
        allocated: false,
        message: 'Order already allocated',
        skip_reason: 'duplicate_allocation_prevented'
      });
    }

    // Step 1: Get order details and items (ONLY products, not services)
    const orderResult = await pool.query(`
      SELECT o.*, 
        array_agg(oi.item_name) FILTER (WHERE oi.item_type = 'Product') as product_names,
        array_agg(oi.quantity) FILTER (WHERE oi.item_type = 'Product') as quantities
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1
      GROUP BY o.order_id
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];
    const customerPincode = order.customer_pincode || order.pincode || '';

    // Log allocation start
    await pool.query(`
      INSERT INTO order_allocation_log (order_id, log_type, message, details)
      VALUES ($1, 'allocation_started', 'Order allocation process initiated', $2)
    `, [orderId, JSON.stringify({ 
      customer_pincode: customerPincode,
      products_count: order.product_names ? order.product_names.length : 0
    })]);

    // Step 2: Get timeout setting
    const settingsResult = await pool.query(`
      SELECT setting_value FROM order_allocation_settings 
      WHERE setting_key = 'dealer_response_timeout_hours'
    `);
    const timeoutHours = parseInt(settingsResult.rows[0]?.setting_value || '6');

    // Step 3: Find the nearest active dealer who has ALL products in stock
    // Match order item names to dealer_products model numbers
    // NOTE: We only check PRODUCTS, not services (Installation, AMC, etc.)
    console.log(`📍 Finding nearest dealer for order ${order.order_number} (pincode: ${customerPincode})`);
    console.log(`📦 Checking inventory for ${order.product_names ? order.product_names.length : 0} product(s):`, order.product_names);

    // Count how many unique products are in the order (filter out nulls and ensure array exists)
    const uniqueProductNames = (order.product_names || []).filter((name: any) => name !== null);
    
    // Extract model numbers from product names (remove "(with Installation)" or "(with AMC)" suffixes)
    // Example: "CP-UVC-T1100L2 (with Installation)" → "CP-UVC-T1100L2"
    const productModelNumbers = uniqueProductNames.map((name: string) => {
      // Extract text before first parenthesis, trim whitespace
      const match = name.match(/^([^(]+)/);
      return match ? match[1].trim() : name.trim();
    });
    
    const requiredProductCount = productModelNumbers.length;

    // 🛑 CRITICAL: If order has NO products, escalate to admin immediately
    if (requiredProductCount === 0) {
      console.log(`⚠️ Order ${order.order_number} has NO products - escalating to admin`);
      
      await pool.query(`
        UPDATE orders 
        SET status = 'Pending Admin Review',
            assigned_dealer_id = NULL
        WHERE order_id = $1
      `, [orderId]);

      await pool.query(`
        INSERT INTO order_allocation_log (order_id, log_type, message, details)
        VALUES ($1, 'escalated_to_admin', 'Order has no products - sent to admin', $2)
      `, [orderId, JSON.stringify({ 
        customer_pincode: customerPincode,
        reason: 'no_products_in_order'
      })]);

      return NextResponse.json({
        success: true,
        allocated: false,
        escalated_to_admin: true,
        message: 'Order has no products. Sent to admin panel for review.'
      });
    }

    console.log(`📦 Extracted model numbers for inventory check:`, productModelNumbers);

    const finalDealersResult = await pool.query(`
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
    `, [customerPincode, productModelNumbers, requiredProductCount]);

    // Step 4: Check if any dealer was found
    if (finalDealersResult.rows.length === 0) {
      // No dealer found with required inventory - escalate to admin
      console.log(`⚠️ No dealer found with required inventory for order ${order.order_number}`);
      
      await pool.query(`
        UPDATE orders 
        SET status = 'Pending Admin Review',
            assigned_dealer_id = NULL
        WHERE order_id = $1
      `, [orderId]);

      await pool.query(`
        INSERT INTO order_allocation_log (order_id, log_type, message, details)
        VALUES ($1, 'escalated_to_admin', 'No dealer with required inventory - sent to admin', $2)
      `, [orderId, JSON.stringify({ 
        customer_pincode: customerPincode,
        reason: 'no_dealer_with_inventory',
        required_products: productModelNumbers,
        product_count: requiredProductCount
      })]);

      return NextResponse.json({
        success: true,
        allocated: false,
        escalated_to_admin: true,
        message: 'No dealer has the required products in stock. Order sent to admin panel.'
      });
    }

    // Step 5: Send request to nearest dealer with verified inventory
    const firstDealer = finalDealersResult.rows[0];
    console.log(`✅ Found dealer with inventory: ${firstDealer.business_name} (ID: ${firstDealer.dealer_id})`);
    console.log(`   Distance: ${firstDealer.distance_km}km`);
    console.log(`   Has ${firstDealer.available_product_count}/${requiredProductCount} products in stock`);
    
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + timeoutHours);

    const dealerDistance = parseFloat(firstDealer.distance_km) || 0;

    const requestResult = await pool.query(`
      INSERT INTO dealer_order_requests (
        order_id, dealer_id, request_sequence, 
        stock_verified, stock_available, stock_check_details,
        response_deadline, dealer_distance_km, customer_pincode, dealer_service_pin
      )
      VALUES ($1, $2, 1, true, true, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      orderId,
      firstDealer.dealer_id,
      JSON.stringify({
        verified_at: new Date().toISOString(),
        products_verified: uniqueProductNames,
        all_products_available: true
      }),
      responseDeadline,
      dealerDistance,
      customerPincode,
      firstDealer.service_pin
    ]);

    // Step 6: Update order status AND append dealer UID to order number immediately
    await pool.query(`
      UPDATE orders 
      SET status = 'Awaiting Dealer Confirmation',
          assigned_dealer_id = $2,
          assigned_at = CURRENT_TIMESTAMP
      WHERE order_id = $1
    `, [orderId, firstDealer.dealer_id]);

    // Append dealer unique ID to order number so admin can see who has the order
    if (firstDealer.unique_dealer_id) {
      await pool.query(`
        UPDATE orders
        SET order_number = CASE
          WHEN order_number ~ '^PR-[0-9]{6}-[0-9]+-[0-9]+$'
            THEN REGEXP_REPLACE(order_number, '-[0-9]+$', '') || '-' || $1
          ELSE order_number || '-' || $1
        END
        WHERE order_id = $2
          AND order_number NOT LIKE '%-' || $1
      `, [firstDealer.unique_dealer_id, orderId]);
    }

    // Record in status history so Admin portal reflects it immediately
    await pool.query(`
      INSERT INTO order_status_history (order_id, status, remarks, created_at)
      VALUES ($1, 'Awaiting Dealer Confirmation', $2, CURRENT_TIMESTAMP)
    `, [orderId, `Order sent to dealer ${firstDealer.business_name || firstDealer.dealer_id} (${dealerDistance} km) - inventory verified`]);

    // Log request sent with inventory verification
    await pool.query(`
      INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
      VALUES ($1, $2, 'request_sent', 'Order request sent to nearest dealer with verified inventory', $3)
    `, [orderId, firstDealer.dealer_id, JSON.stringify({
      request_id: requestResult.rows[0].id,
      sequence: 1,
      deadline: responseDeadline,
      stock_verified: true,
      products_in_stock: uniqueProductNames,
      distance_km: dealerDistance
    })]);

    return NextResponse.json({
      success: true,
      allocated: true,
      request_id: requestResult.rows[0].id,
      dealer_id: firstDealer.dealer_id,
      dealer_name: firstDealer.business_name,
      distance_km: dealerDistance,
      response_deadline: responseDeadline,
      timeout_hours: timeoutHours,
      message: `Order request sent to ${firstDealer.business_name}`
    });

  } catch (error: any) {
    console.error('Error allocating order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to allocate order' },
      { status: 500 }
    );
  }
}

// GET - Check allocation status for an order
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Get current allocation status
    const statusResult = await pool.query(`
      SELECT 
        dor.*,
        d.business_name as dealer_name,
        d.phone_number as dealer_phone,
        EXTRACT(EPOCH FROM (dor.response_deadline - NOW())) / 3600 as hours_remaining,
        CASE 
          WHEN dor.response_deadline < NOW() AND dor.request_status = 'pending' THEN true
          ELSE false
        END as is_expired
      FROM dealer_order_requests dor
      JOIN dealers d ON dor.dealer_id = d.dealer_id
      WHERE dor.order_id = $1
      ORDER BY dor.request_sequence DESC
      LIMIT 1
    `, [orderId]);

    // Get allocation log
    const logResult = await pool.query(`
      SELECT * FROM order_allocation_log
      WHERE order_id = $1
      ORDER BY created_at DESC
    `, [orderId]);

    if (statusResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        allocated: false,
        message: 'Order has not been allocated to any dealer yet'
      });
    }

    const currentRequest = statusResult.rows[0];

    return NextResponse.json({
      success: true,
      allocated: true,
      current_request: currentRequest,
      allocation_log: logResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching allocation status:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch allocation status' },
      { status: 500 }
    );
  }
}
