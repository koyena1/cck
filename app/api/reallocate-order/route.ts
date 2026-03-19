import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';


/**
 * Order Reallocation API
 * Reallocates order to next nearest dealer when previous dealer declines
 */

export async function POST(request: Request) {
  try {
    const { orderId, previousDealerId, previousSequence } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    console.log(`🔄 Reallocating order ${orderId} after dealer ${previousDealerId || 'unknown'} declined`);

    // Get order details and items
    const orderResult = await pool.query(`
      SELECT o.*, 
        array_agg(oi.product_id) FILTER (WHERE oi.product_id IS NOT NULL) as product_ids,
        array_agg(oi.quantity) FILTER (WHERE oi.product_id IS NOT NULL) as quantities
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

    // Get already contacted dealers
    const contactedDealersResult = await pool.query(`
      SELECT dealer_id FROM dealer_order_requests WHERE order_id = $1
    `, [orderId]);
    
    const contactedDealerIds = contactedDealersResult.rows.map(r => r.dealer_id);

    // Get timeout setting
    const settingsResult = await pool.query(`
      SELECT setting_value FROM order_allocation_settings 
      WHERE setting_key = 'dealer_response_timeout_hours'
    `);
    const timeoutHours = parseInt(settingsResult.rows[0]?.setting_value || '6');

    // Get max dealer attempts
    const maxAttemptsResult = await pool.query(`
      SELECT setting_value FROM order_allocation_settings 
      WHERE setting_key = 'max_dealer_attempts'
    `);
    const maxAttempts = parseInt(maxAttemptsResult.rows[0]?.setting_value || '3');

    // Check if we've exceeded max attempts
    const nextSequence = (previousSequence || 0) + 1;
    if (nextSequence > maxAttempts) {
      // Escalate to admin
      await pool.query(`
        UPDATE orders 
        SET status = 'Pending Admin Review',
            assigned_dealer_id = NULL
        WHERE order_id = $1
      `, [orderId]);

      await pool.query(`
        INSERT INTO order_status_history (order_id, status, remarks, created_at)
        VALUES ($1, 'Pending Admin Review', 'Maximum dealer attempts reached - escalated to admin', CURRENT_TIMESTAMP)
      `, [orderId]);

      await pool.query(`
        INSERT INTO order_allocation_log (order_id, log_type, message, details)
        VALUES ($1, 'escalated_to_admin', 'Maximum dealer attempts reached - sent to admin', $2)
      `, [orderId, JSON.stringify({
        dealers_tried: contactedDealerIds.length,
        max_attempts: maxAttempts
      })]);

      console.log(`⚠️ Order ${orderId} escalated to admin after ${contactedDealerIds.length} attempts`);

      return NextResponse.json({
        success: true,
        reallocated: false,
        escalated_to_admin: true,
        message: 'Maximum dealer attempts reached. Order sent to admin panel.',
        dealers_tried: contactedDealerIds.length
      });
    }

    // Find next nearest dealer with required inventory
    // Check dealer_inventory to ensure dealer has all products with quantity_available > 0
    let nextDealersResult;

    // Count how many unique products are in the order (filter out nulls)
    const uniqueProductIds = order.product_ids.filter((id: any) => id !== null);
    const requiredProductCount = uniqueProductIds.length;

    console.log(`📦 Checking inventory for ${requiredProductCount} product(s):`, uniqueProductIds);
    console.log(`🔍 Excluding dealers already contacted:`, contactedDealerIds);

    // Find next nearest active dealer who has ALL products in stock
    const nextDealerQuery = await pool.query(`
      SELECT
        d.dealer_id, d.business_name, d.unique_dealer_id,
        d.service_pin, d.latitude, d.longitude,
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
          SELECT COUNT(DISTINCT di.product_id)
          FROM dealer_inventory di
          WHERE di.dealer_id = d.dealer_id
            AND di.product_id = ANY($3::INTEGER[])
            AND di.quantity_available > 0
        ) as available_product_count
      FROM dealers d
      LEFT JOIN pincode_master pm ON pm.pincode = $1
      WHERE d.status = 'Active'
        AND d.dealer_id != ALL($2::INTEGER[])
        AND (
          SELECT COUNT(DISTINCT di.product_id)
          FROM dealer_inventory di
          WHERE di.dealer_id = d.dealer_id
            AND di.product_id = ANY($3::INTEGER[])
            AND di.quantity_available > 0
        ) = $4
      ORDER BY distance_km ASC
      LIMIT 1
    `, [customerPincode, contactedDealerIds, uniqueProductIds, requiredProductCount]);

    nextDealersResult = nextDealerQuery;

    // Check if next dealer found with inventory
    if (nextDealersResult.rows.length === 0) {
      // No more dealers with inventory - escalate to admin
      console.log(`⚠️ No more dealers with required inventory for order ${orderId}`);
      
      await pool.query(`
        UPDATE orders 
        SET status = 'Pending Admin Review',
            assigned_dealer_id = NULL
        WHERE order_id = $1
      `, [orderId]);

      await pool.query(`
        INSERT INTO order_status_history (order_id, status, remarks, created_at)
        VALUES ($1, 'Pending Admin Review', 'No more dealers with required inventory - escalated to admin', CURRENT_TIMESTAMP)
      `, [orderId]);

      await pool.query(`
        INSERT INTO order_allocation_log (order_id, log_type, message, details)
        VALUES ($1, 'escalated_to_admin', 'No more dealers with required inventory - sent to admin', $2)
      `, [orderId, JSON.stringify({
        dealers_tried: contactedDealerIds.length,
        reason: 'no_dealers_with_inventory',
        required_products: uniqueProductIds,
        product_count: requiredProductCount
      })]);

      console.log(`⚠️ Order ${orderId} escalated to admin after ${contactedDealerIds.length} attempts - no dealers have required inventory`);

      return NextResponse.json({
        success: true,
        reallocated: false,
        escalated_to_admin: true,
        message: 'No more dealers have the required products in stock. Order sent to admin panel.',
        dealers_tried: contactedDealerIds.length
      });
    }

    // Send request to next dealer with verified inventory
    const nextDealer = nextDealersResult.rows[0];
    console.log(`✅ Found next dealer with inventory: ${nextDealer.business_name} (ID: ${nextDealer.dealer_id})`);
    console.log(`   Distance: ${nextDealer.distance_km}km`);
    console.log(`   Has ${nextDealer.available_product_count}/${requiredProductCount} products in stock`);
    
    const responseDeadline = new Date();
    responseDeadline.setHours(responseDeadline.getHours() + timeoutHours);

    const dealerDistance = parseFloat(nextDealer.distance_km) || 0;

    const requestResult = await pool.query(`
      INSERT INTO dealer_order_requests (
        order_id, dealer_id, request_sequence, 
        stock_verified, stock_available, stock_check_details,
        response_deadline, dealer_distance_km, customer_pincode, dealer_service_pin
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `, [
      orderId,
      nextDealer.dealer_id,
      nextSequence,
      true,
      true,
      JSON.stringify({
        verified_at: new Date().toISOString(),
        products_verified: uniqueProductIds,
        all_products_available: true
      }),
      responseDeadline,
      dealerDistance,
      customerPincode,
      nextDealer.service_pin
    ]);

    // Update order assignment
    await pool.query(`
      UPDATE orders 
      SET assigned_dealer_id = $1,
          assigned_at = CURRENT_TIMESTAMP,
          status = 'Awaiting Dealer Confirmation'
      WHERE order_id = $2
    `, [nextDealer.dealer_id, orderId]);

    // Replace dealer UID in order number with the new dealer's UID
    if (nextDealer.unique_dealer_id) {
      await pool.query(`
        UPDATE orders
        SET order_number = CASE
          WHEN order_number ~ '^PR-[0-9]{6}-[0-9]+-[0-9]+$'
            THEN REGEXP_REPLACE(order_number, '-[0-9]+$', '') || '-' || $1
          ELSE order_number || '-' || $1
        END
        WHERE order_id = $2
          AND order_number NOT LIKE '%-' || $1
      `, [nextDealer.unique_dealer_id, orderId]);
    }

    // Record reallocation in status history so Admin portal reflects it
    await pool.query(`
      INSERT INTO order_status_history (order_id, status, remarks, created_at)
      VALUES ($1, 'Awaiting Dealer Confirmation', $2, CURRENT_TIMESTAMP)
    `, [orderId, `Reallocated to dealer #${nextDealer.business_name || nextDealer.dealer_id} (attempt ${nextSequence}) - inventory verified`]);

    // Log reallocation with inventory verification
    await pool.query(`
      INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
      VALUES ($1, $2, 'request_sent', 'Order reallocated to next nearest dealer with verified inventory', $3)
    `, [orderId, nextDealer.dealer_id, JSON.stringify({
      request_id: requestResult.rows[0].id,
      sequence: nextSequence,
      previous_dealer_id: previousDealerId,
      distance_km: dealerDistance,
      reason: 'previous_dealer_declined',
      stock_verified: true,
      products_in_stock: uniqueProductIds
    })]);

    console.log(`✅ Order ${orderId} reallocated to dealer ${nextDealer.dealer_id} (${nextDealer.business_name})`);

    return NextResponse.json({
      success: true,
      reallocated: true,
      request_id: requestResult.rows[0].id,
      dealer_id: nextDealer.dealer_id,
      dealer_name: nextDealer.business_name,
      distance_km: dealerDistance,
      sequence: nextSequence,
      response_deadline: responseDeadline,
      message: `Order reallocated to ${nextDealer.business_name}`,
      dealers_tried: contactedDealerIds.length + 1
    });

  } catch (error: any) {
    console.error('Error reallocating order:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reallocate order' },
      { status: 500 }
    );
  }
}
