import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { syncDealerStockThresholdAlerts } from '@/lib/dealer-stock-alerts';

// POST - Dealer accepts or declines order request
export async function POST(request: Request) {
  try {
    const { requestId, dealerId, action, notes } = await request.json();

    if (!requestId || !dealerId || !action) {
      return NextResponse.json(
        { success: false, error: 'Request ID, dealer ID, and action are required' },
        { status: 400 }
      );
    }

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'Action must be either "accept" or "decline"' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Resolve dealerId: accept numeric dealer_id or unique_dealer_id string
    const dealerLookupPost = await pool.query(
      `SELECT dealer_id FROM dealers WHERE dealer_id = $1 OR unique_dealer_id = $1::TEXT LIMIT 1`,
      [dealerId]
    );
    if (dealerLookupPost.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer not found' },
        { status: 404 }
      );
    }
    const resolvedDealerIdPost = dealerLookupPost.rows[0].dealer_id;

    // Step 1: Get request details
    const requestResult = await pool.query(`
      SELECT dor.*, o.order_number, o.customer_name
      FROM dealer_order_requests dor
      JOIN orders o ON dor.order_id = o.order_id
      WHERE dor.id = $1 AND dor.dealer_id = $2
    `, [requestId, resolvedDealerIdPost]);

    if (requestResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Request not found or not assigned to this dealer' },
        { status: 404 }
      );
    }

    const orderRequest = requestResult.rows[0];

    // Check if request is still valid
    if (orderRequest.request_status !== 'pending') {
      return NextResponse.json(
        { success: false, error: `Request already ${orderRequest.request_status}` },
        { status: 400 }
      );
    }

    // Check if request has expired
    if (new Date(orderRequest.response_deadline) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Request has expired' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // ACCEPT ORDER
      await pool.query('BEGIN');

      try {
        // Update request status
        await pool.query(`
          UPDATE dealer_order_requests
          SET request_status = 'accepted',
              responded_at = CURRENT_TIMESTAMP,
              accepted_at = CURRENT_TIMESTAMP,
              dealer_notes = $1
          WHERE id = $2
        `, [notes, requestId]);

        // Look up the dealer's unique_dealer_id to append to the order number
        const dealerUidResult = await pool.query(
          `SELECT unique_dealer_id FROM dealers WHERE dealer_id = $1`,
          [resolvedDealerIdPost]
        );
        const dealerUniqueId = dealerUidResult.rows[0]?.unique_dealer_id;

        // Always update the order status to Accepted
        await pool.query(`
          UPDATE orders
          SET status = 'Accepted',
              assigned_dealer_id = $1,
              assigned_at = CURRENT_TIMESTAMP
          WHERE order_id = $2
        `, [resolvedDealerIdPost, orderRequest.order_id]);

        // Append/ensure dealer UID at end of order number (replace if different UID already there)
        if (dealerUniqueId) {
          await pool.query(`
            UPDATE orders
            SET order_number = CASE
              WHEN order_number ~ '^PR-[0-9]{6}-[0-9]+-[0-9]+$'
                THEN REGEXP_REPLACE(order_number, '-[0-9]+$', '') || '-' || $1
              ELSE order_number || '-' || $1
            END
            WHERE order_id = $2
              AND order_number NOT LIKE '%-' || $1
          `, [dealerUniqueId, orderRequest.order_id]);
        }

        // Cancel any other pending requests for this order
        await pool.query(`
          UPDATE dealer_order_requests
          SET request_status = 'cancelled',
              updated_at = CURRENT_TIMESTAMP
          WHERE order_id = $1 AND id != $2 AND request_status = 'pending'
        `, [orderRequest.order_id, requestId]);

        // Record status change in history so Admin portal reflects it immediately
        await pool.query(`
          INSERT INTO order_status_history (order_id, status, remarks, updated_by_dealer, created_at)
          VALUES ($1, 'Accepted', $2, $3, CURRENT_TIMESTAMP)
        `, [orderRequest.order_id,
          `Order accepted by dealer${notes ? ': ' + notes : ''}`,
          resolvedDealerIdPost]);

        // Log acceptance
        await pool.query(`
          INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
          VALUES ($1, $2, 'accepted', 'Dealer accepted order request', $3)
        `, [orderRequest.order_id, resolvedDealerIdPost, JSON.stringify({
          request_id: requestId,
          dealer_notes: notes
        })]);

        // 🔥 AUTOMATICALLY REDUCE DEALER INVENTORY
        // Get order items with product details
        const orderItemsResult = await pool.query(`
          SELECT oi.product_id, oi.quantity, oi.item_name
          FROM order_items oi
          WHERE oi.order_id = $1 AND oi.product_id IS NOT NULL
        `, [orderRequest.order_id]);

        console.log(`📦 Processing inventory reduction for ${orderItemsResult.rows.length} items`);

        // Track inventory updates for logging
        const inventoryUpdates = [];

        // Reduce inventory for each product
        for (const item of orderItemsResult.rows) {
          const { product_id, quantity, item_name } = item;

          // Check if dealer has this product in inventory
          const inventoryCheck = await pool.query(`
            SELECT id, quantity_available 
            FROM dealer_inventory 
            WHERE dealer_id = $1 AND product_id = $2
          `, [resolvedDealerIdPost, product_id]);

          if (inventoryCheck.rows.length > 0) {
            const currentStock = inventoryCheck.rows[0].quantity_available;
            
            // Reduce stock by incrementing quantity_sold
            await pool.query(`
              UPDATE dealer_inventory 
              SET quantity_sold = quantity_sold + $1,
                  last_sale_date = CURRENT_TIMESTAMP,
                  updated_at = CURRENT_TIMESTAMP
              WHERE dealer_id = $2 AND product_id = $3
            `, [quantity, resolvedDealerIdPost, product_id]);

            inventoryUpdates.push({
              product_id,
              product_name: item_name,
              quantity_reduced: quantity,
              previous_stock: currentStock,
              new_stock: currentStock - quantity
            });

            console.log(`✅ Reduced stock for ${item_name} (Product ID: ${product_id}): ${currentStock} → ${currentStock - quantity}`);
          } else {
            console.warn(`⚠️ Warning: Product ${item_name} (ID: ${product_id}) not found in dealer inventory`);
          }
        }

        // Log inventory reduction
        if (inventoryUpdates.length > 0) {
          await pool.query(`
            INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
            VALUES ($1, $2, 'inventory_reduced', 'Dealer inventory automatically reduced', $3)
          `, [orderRequest.order_id, resolvedDealerIdPost, JSON.stringify({
            items_processed: inventoryUpdates.length,
            inventory_updates: inventoryUpdates
          })]);

          console.log(`✅ Inventory reduced for ${inventoryUpdates.length} products`);
        }

        await pool.query('COMMIT');

        await syncDealerStockThresholdAlerts(parseInt(resolvedDealerIdPost));

        return NextResponse.json({
          success: true,
          action: 'accepted',
          message: `Order ${orderRequest.order_number} accepted successfully`,
          order_id: orderRequest.order_id,
          inventory_reduced: inventoryUpdates.length > 0,
          items_processed: inventoryUpdates.length,
          inventory_details: inventoryUpdates
        });

      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }

    } else {
      // DECLINE ORDER
      await pool.query('BEGIN');

      try {
        // Update request status
        await pool.query(`
          UPDATE dealer_order_requests
          SET request_status = 'declined',
              responded_at = CURRENT_TIMESTAMP,
              dealer_notes = $1,
              decline_reason = $2
          WHERE id = $3
        `, [notes, notes, requestId]);

        // Log decline
        await pool.query(`
          INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
          VALUES ($1, $2, 'declined', 'Dealer declined order request', $3)
        `, [orderRequest.order_id, resolvedDealerIdPost, JSON.stringify({
          request_id: requestId,
          reason: notes
        })]);

        // Set order status to Declined (admin will reassign manually or system will try next dealer)
        await pool.query(`
          UPDATE orders SET status = 'Declined' WHERE order_id = $1
        `, [orderRequest.order_id]);

        // Record status change in history so Admin portal reflects it immediately
        await pool.query(`
          INSERT INTO order_status_history (order_id, status, remarks, updated_by_dealer, created_at)
          VALUES ($1, 'Declined', $2, $3, CURRENT_TIMESTAMP)
        `, [orderRequest.order_id,
          `Order declined by dealer${notes ? ': ' + notes : ''}`,
          resolvedDealerIdPost]);

        // 🔄 TRIGGER REALLOCATION TO NEXT DEALER
        await pool.query('COMMIT');
        
        console.log(`🔄 Order ${orderRequest.order_number} declined by dealer ${resolvedDealerIdPost}, triggering reallocation...`);
        
        try {
          // Use absolute URL for server-side fetch
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
          const reallocationUrl = `${baseUrl}/api/reallocate-order`;
          
          console.log(`📍 Calling reallocation API: ${reallocationUrl}`);
          
          const reallocationResponse = await fetch(reallocationUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderRequest.order_id,
              previousDealerId: resolvedDealerIdPost,
              previousSequence: orderRequest.request_sequence
            })
          });

          const reallocationData = await reallocationResponse.json();
          
          console.log(`📥 Reallocation response:`, JSON.stringify(reallocationData, null, 2));

          if (reallocationData.success) {
            if (reallocationData.reallocated) {
              return NextResponse.json({
                success: true,
                action: 'declined',
                reallocated: true,
                message: `Request declined. Order escalated to ${reallocationData.dealer_name}`,
                next_dealer: reallocationData.dealer_name,
                distance_km: reallocationData.distance_km,
                dealers_tried: reallocationData.dealers_tried
              });
            } else if (reallocationData.escalated_to_admin) {
              return NextResponse.json({
                success: true,
                action: 'declined',
                escalated: true,
                escalated_to_admin: true,
                message: 'Request declined. No more dealers available. Order sent to admin panel.',
                dealers_tried: reallocationData.dealers_tried
              });
            }
          }

          // Reallocation failed but decline was successful
          console.error(`❌ Reallocation failed:`, reallocationData.error);
          
          // Log reallocation failure to database
          await pool.query(`
            INSERT INTO order_allocation_log (order_id, log_type, message, details)
            VALUES ($1, 'reallocation_failed', 'Automatic reallocation failed after decline', $2)
          `, [orderRequest.order_id, JSON.stringify({
            error: reallocationData.error || 'Unknown error',
            previousDealerId: resolvedDealerIdPost
          })]);
          
          return NextResponse.json({
            success: true,
            action: 'declined',
            message: 'Request declined.',
            reallocation_error: reallocationData.error || 'Unknown error'
          });

        } catch (reallocationError: unknown) {
          console.error('❌ Reallocation error:', reallocationError);
          const reallocationErrMsg = reallocationError instanceof Error ? reallocationError.message : String(reallocationError);
          
          // Log reallocation exception to database
          await pool.query(`
            INSERT INTO order_allocation_log (order_id, log_type, message, details)
            VALUES ($1, 'reallocation_exception', 'Reallocation API call failed', $2)
          `, [orderRequest.order_id, JSON.stringify({
            error: reallocationErrMsg,
            previousDealerId: resolvedDealerIdPost
          })]);
          
          return NextResponse.json({
            success: true,
            action: 'declined',
            message: 'Request declined.',
            reallocation_error: 'Failed to trigger automatic reallocation: ' + reallocationErrMsg
          });
        }

      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }

  } catch (error: any) {
    console.error('Error responding to order request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
}

// GET - Get pending order requests for a dealer
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');
    const status = searchParams.get('status'); // e.g., 'accepted', 'declined', 'pending'

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Resolve dealerId: accept either the numeric dealer_id primary key OR the
    // unique_dealer_id string (e.g. "101"). This handles cases where the dealer's
    // browser localStorage stores unique_dealer_id instead of dealer_id.
    const dealerLookup = await pool.query(
      `SELECT dealer_id FROM dealers WHERE dealer_id = $1 OR unique_dealer_id = $1::TEXT LIMIT 1`,
      [dealerId]
    );
    if (dealerLookup.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer not found' },
        { status: 404 }
      );
    }
    const resolvedDealerId = dealerLookup.rows[0].dealer_id;

    const overridesTableCheck = await pool.query(
      "SELECT to_regclass('public.dealer_product_pricing_overrides') IS NOT NULL AS exists"
    );
    const hasPricingOverrides = overridesTableCheck.rows[0]?.exists === true;
    const salePriceExpr = hasPricingOverrides
      ? 'COALESCE(dpo.dealer_sale_price, dp.dealer_sale_price)'
      : 'dp.dealer_sale_price';
    const pricingJoin = hasPricingOverrides
      ? 'LEFT JOIN dealer_product_pricing_overrides dpo ON dpo.dealer_id = dor.dealer_id AND dpo.product_id = dp.id'
      : '';

    let query;
    let params;

    if (status === 'accepted') {
      // Fetch accepted orders
      query = `
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
          CASE
            WHEN dor.request_status = 'reassigned' OR o.assigned_dealer_id != dor.dealer_id
              THEN REGEXP_REPLACE(o.order_number, '-[0-9]+$', '')
            ELSE o.order_number
          END AS order_number,
          o.customer_name,
          o.customer_phone,
          o.installation_address as address,
          o.pincode as customer_pincode,
          o.total_amount,
          o.status as order_status,
          o.assigned_dealer_id,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'item_name', oi.item_name,
                'product_code', COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')),
                'quantity', oi.quantity,
                'unit_price', ${salePriceExpr},
                'dealer_price', ${salePriceExpr},
                'dealer_total', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END,
                'total_price', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END
              )
            )
            FROM order_items oi
            LEFT JOIN dealer_products dp
              ON (
                (oi.product_id IS NOT NULL AND dp.id = oi.product_id)
                OR (oi.product_id IS NULL AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name)))
              )
            ${pricingJoin}
            WHERE oi.order_id = o.order_id),
            '[]'::json
          ) as order_items,
          EXTRACT(EPOCH FROM (dor.response_deadline - CURRENT_TIMESTAMP)) / 3600 as hours_remaining,
          (dor.response_deadline < CURRENT_TIMESTAMP) as is_expired
        FROM dealer_order_requests dor
        JOIN orders o ON dor.order_id = o.order_id
        WHERE dor.dealer_id = $1 AND dor.request_status IN ('accepted', 'reassigned')
        ORDER BY dor.responded_at DESC
      `;
      params = [resolvedDealerId];
    } else if (status === 'declined') {
      // Fetch declined orders
      query = `
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
          dor.expired_at,
          dor.dealer_notes,
          dor.decline_reason,
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
                'product_code', COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')),
                'quantity', oi.quantity,
                'unit_price', ${salePriceExpr},
                'dealer_price', ${salePriceExpr},
                'dealer_total', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END,
                'total_price', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END
              )
            )
            FROM order_items oi
            LEFT JOIN dealer_products dp
              ON (
                (oi.product_id IS NOT NULL AND dp.id = oi.product_id)
                OR (oi.product_id IS NULL AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name)))
              )
            ${pricingJoin}
            WHERE oi.order_id = o.order_id),
            '[]'::json
          ) as order_items,
          EXTRACT(EPOCH FROM (dor.response_deadline - CURRENT_TIMESTAMP)) / 3600 as hours_remaining,
          (dor.response_deadline < CURRENT_TIMESTAMP) as is_expired
        FROM dealer_order_requests dor
        JOIN orders o ON dor.order_id = o.order_id
        WHERE dor.dealer_id = $1 AND dor.request_status IN ('declined', 'expired')
        ORDER BY COALESCE(dor.responded_at, dor.expired_at) DESC
      `;
      params = [resolvedDealerId];
    } else {
      // Fetch pending requests (default behavior)
      // First: find expired pending requests for this dealer and auto-escalate them
      const expiredResult = await pool.query(`
        SELECT dor.id as request_id, dor.order_id, dor.request_sequence
        FROM dealer_order_requests dor
        WHERE dor.dealer_id = $1
          AND dor.request_status = 'pending'
          AND dor.response_deadline < CURRENT_TIMESTAMP
      `, [resolvedDealerId]);

      if (expiredResult.rows.length > 0) {
        // Process expired requests: mark as expired and trigger reallocation (fire-and-forget)
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000';
        for (const expired of expiredResult.rows) {
          // Mark as expired immediately so it disappears from the dealer's queue
          await pool.query(`
            UPDATE dealer_order_requests
            SET request_status = 'expired',
                expired_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND request_status = 'pending'
          `, [expired.request_id]);

          await pool.query(`
            INSERT INTO order_allocation_log (order_id, dealer_id, log_type, message, details)
            VALUES ($1, $2, 'expired', 'Dealer response deadline expired — auto-escalating', $3)
          `, [expired.order_id, resolvedDealerId, JSON.stringify({ request_id: expired.request_id })]);

          // Trigger reallocation to next nearest dealer asynchronously
          fetch(`${baseUrl}/api/reallocate-order`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: expired.order_id,
              previousDealerId: resolvedDealerId,
              previousSequence: expired.request_sequence,
            }),
          }).catch(err => console.error(`Auto-escalation failed for order ${expired.order_id}:`, err));
        }
      }

      // Now fetch only active (non-expired) pending requests
      query = `
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
          o.assigned_dealer_id,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'item_name', oi.item_name,
                'product_code', COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')),
                'quantity', oi.quantity,
                'unit_price', ${salePriceExpr},
                'dealer_price', ${salePriceExpr},
                'dealer_total', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END,
                'total_price', CASE WHEN ${salePriceExpr} IS NOT NULL THEN ${salePriceExpr} * oi.quantity ELSE NULL END
              )
            )
            FROM order_items oi
            LEFT JOIN dealer_products dp
              ON (
                (oi.product_id IS NOT NULL AND dp.id = oi.product_id)
                OR (oi.product_id IS NULL AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name)))
              )
            ${pricingJoin}
            WHERE oi.order_id = o.order_id),
            '[]'::json
          ) as order_items,
          EXTRACT(EPOCH FROM (dor.response_deadline - CURRENT_TIMESTAMP)) / 3600 as hours_remaining,
          (dor.response_deadline < CURRENT_TIMESTAMP) as is_expired
        FROM dealer_order_requests dor
        JOIN orders o ON dor.order_id = o.order_id
        WHERE dor.dealer_id = $1
          AND dor.request_status = 'pending'
          AND dor.response_deadline > CURRENT_TIMESTAMP
        ORDER BY dor.response_deadline ASC
      `;
      params = [resolvedDealerId];
    }

    const requestsResult = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      requests: requestsResult.rows,
      count: requestsResult.rows.length
    });

  } catch (error: any) {
    console.error('Error fetching dealer requests:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}
