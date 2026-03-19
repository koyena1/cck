import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { notifyNewOrderPlaced } from '@/lib/portal-notifications';
import { ensureOrderTaskAcceptanceColumns } from '@/lib/order-task-acceptance';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const pool = getPool();

    const {
      customerName,
      email,
      phone,
      address,
      city,
      state,
      pinCode,
      landmark,
      products,
      productsTotal,
      withInstallation,
      installationCost,
      withAmc,
      amcDetails,
      amcCost,
      totalAmount,
      paymentMethod,
      status,
      // Referral and rewards
      referralCode,
      referralDiscount,
      pointsRedeemed,
    } = orderData;

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Check if referral columns exist in the database (for backward compatibility)
      let referralColumnsExist = false;
      try {
        const columnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'orders' 
          AND column_name IN ('referral_code_used', 'referral_discount', 'points_redeemed', 'is_first_order')
        `);
        referralColumnsExist = columnCheck.rows.length === 4;
      } catch (err) {
        console.log('Could not check for referral columns:', err);
      }

      // Check if this is the first order for this customer
      let isFirstOrder = false;
      if (email) {
        const orderCountResult = await pool.query(
          'SELECT COUNT(*) as order_count FROM orders WHERE customer_email = $1',
          [email]
        );
        isFirstOrder = parseInt(orderCountResult.rows[0].order_count) === 0;
      }

      // If referral code is provided, create pending referral transaction
      if (referralCode && email && isFirstOrder && referralColumnsExist) {
        try {
          // Get referrer and referred customer IDs
          const referrerResult = await pool.query(
            'SELECT customer_id FROM customers WHERE referral_id = $1',
            [referralCode]
          );

          const referredResult = await pool.query(
            'SELECT customer_id FROM customers WHERE email = $1',
            [email]
          );

          if (referrerResult.rows.length > 0 && referredResult.rows.length > 0) {
            const referrerId = referrerResult.rows[0].customer_id;
            const referredId = referredResult.rows[0].customer_id;

            // Create pending referral transaction
            await pool.query(
              `INSERT INTO referral_transactions 
              (referrer_customer_id, referred_customer_id, referral_code, referrer_reward, referred_discount, status)
              VALUES ($1, $2, $3, $4, $5, 'pending')`,
              [referrerId, referredId, referralCode, 100, referralDiscount || 50]
            );
          }
        } catch (err) {
          console.log('Could not create referral transaction:', err);
          // Continue with order creation even if referral fails
        }
      }

      // Insert order - with or without referral columns based on what exists
      let query, values;
      
      if (referralColumnsExist) {
        // Include referral columns
        query = `
          INSERT INTO orders (
            customer_name,
            customer_phone,
            customer_email,
            order_type,
            installation_address,
            pincode,
            city,
            state,
            landmark,
            products,
            products_total,
            includes_installation,
            installation_charges,
            with_amc,
            amc_details,
            amc_cost,
            total_amount,
            payment_method,
            payment_status,
            status,
            referral_code_used,
            referral_discount,
            points_redeemed,
            is_first_order,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW())
          RETURNING *
        `;

        values = [
          customerName,
          phone,
          email,
          'product_cart',
          address,
          pinCode,
          city,
          state,
          landmark || null,
          JSON.stringify(products),
          productsTotal,
          withInstallation,
          installationCost || 0,
          withAmc || false,
          amcDetails ? JSON.stringify(amcDetails) : null,
          amcCost || 0,
          totalAmount,
          paymentMethod,
          paymentMethod === 'cod' ? 'Pending' : 'Pending',
          status || 'Pending',
          referralCode || null,
          referralDiscount || 0,
          pointsRedeemed || 0,
          isFirstOrder,
        ];
      } else {
        // Exclude referral columns for backward compatibility
        query = `
          INSERT INTO orders (
            customer_name,
            customer_phone,
            customer_email,
            order_type,
            installation_address,
            pincode,
            city,
            state,
            landmark,
            products,
            products_total,
            includes_installation,
            installation_charges,
            with_amc,
            amc_details,
            amc_cost,
            total_amount,
            payment_method,
            payment_status,
            status,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
          RETURNING *
        `;

        values = [
          customerName,
          phone,
          email,
          'product_cart',
          address,
          pinCode,
          city,
          state,
          landmark || null,
          JSON.stringify(products),
          productsTotal,
          withInstallation,
          installationCost || 0,
          withAmc || false,
          amcDetails ? JSON.stringify(amcDetails) : null,
          amcCost || 0,
          totalAmount,
          paymentMethod,
          paymentMethod === 'cod' ? 'Pending' : 'Pending',
          status || 'Pending',
        ];
      }

      const result = await pool.query(query, values);
      const createdOrder = result.rows[0];

      // Insert individual order_items rows so downstream queries (verify-payment, email) can find them
      try {
        const productsList = Array.isArray(products) ? products : [];
        
        // Calculate additional charges to be distributed across products
        const additionalCharges = (withInstallation ? (installationCost || 0) : 0) + (withAmc ? (amcCost || 0) : 0);
        const totalProducts = productsList.length || 1;
        
        // When installation or AMC is included, add those costs to the product price
        // so the invoice shows a single line item with the combined total
        for (const p of productsList) {
          const qty = p.quantity || 1;
          
          // Calculate the share of additional charges for this product
          const additionalPerProduct = additionalCharges / totalProducts;
          
          // Combined unit price includes product price + share of installation/AMC
          const combinedUnitPrice = p.price + (additionalPerProduct / qty);
          const combinedTotalPrice = (p.price * qty) + additionalPerProduct;
          
          // Build product name with indication of what's included
          let productName = p.name;
          const inclusions = [];
          if (withInstallation) inclusions.push('Installation');
          if (withAmc) inclusions.push('AMC');
          if (inclusions.length > 0) {
            productName = `${p.name} (with ${inclusions.join(' + ')})`;
          }
          
          await pool.query(
            `INSERT INTO order_items (order_id, item_name, quantity, unit_price, total_price, item_type)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [createdOrder.order_id, productName, qty, combinedUnitPrice, combinedTotalPrice, 'Product']
          );
        }
        
        // Note: We no longer insert separate rows for Installation or AMC
        // They are now included in the product price above
      } catch (itemsError) {
        console.error('Non-blocking error inserting order_items:', itemsError);
      }

      // Commit transaction
      await pool.query('COMMIT');

      // 🚀 TRIGGER ORDER ALLOCATION TO NEAREST DEALER
      try {
        const allocationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/order-allocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: createdOrder.order_id })
        });

        const allocationData = await allocationResponse.json();
        
        if (allocationData.success) {
          if (allocationData.allocated) {
            console.log(`✅ Order #${createdOrder.order_number} allocated to dealer: ${allocationData.dealer_name}`);
          } else if (allocationData.escalated_to_admin) {
            console.log(`⚠️ Order #${createdOrder.order_number} escalated to admin - no dealer has stock`);
          }
        } else {
          console.error(`❌ Order allocation failed for #${createdOrder.order_number}:`, allocationData.error);
        }
      } catch (allocationError) {
        // Don't fail the order if allocation fails - log and continue
        console.error('Order allocation error:', allocationError);
      }

      try {
        const notifyOrderResult = await pool.query(
          `SELECT o.order_id, o.order_number, o.city, o.pincode, d.district AS dealer_district
           FROM orders o
           LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
           WHERE o.order_id = $1`,
          [createdOrder.order_id]
        );
        const notifyOrder = notifyOrderResult.rows[0] || createdOrder;
        await notifyNewOrderPlaced({
          orderId: createdOrder.order_id,
          orderNumber: notifyOrder.order_number || createdOrder.order_number,
          customerName,
          city: notifyOrder.city || city || null,
          pincode: notifyOrder.pincode || pinCode || null,
          totalAmount,
          district: notifyOrder.dealer_district || null,
        });
      } catch (notifyErr) {
        console.error('Failed to send new-order portal notifications:', notifyErr);
      }

      // Send order confirmation email for ALL orders (COD and online) immediately on creation.
      // For COD: verify-payment will additionally send a payment-received email once advance is paid.
      if (email) {
        try {
          // Re-fetch full order row with dealer details — allocation may have renamed the order_number to include dealer UID
          const [refreshedOrderResult, orderItemsResult, codSettingsResult] = await Promise.all([
            pool.query(`
              SELECT o.*,
                d.business_name AS dealer_business_name,
                d.full_name AS dealer_full_name,
                d.unique_dealer_id AS dealer_unique_id,
                d.dealer_id AS dealer_id,
                d.phone_number AS dealer_phone,
                d.gstin AS dealer_gstin,
                d.business_address AS dealer_address,
                d.pincode AS dealer_pincode,
                d.location AS dealer_location,
                d.state AS dealer_state,
                d.district AS dealer_district
              FROM orders o
              LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
              WHERE o.order_id = $1
            `, [createdOrder.order_id]),
            pool.query(
              `SELECT oi.item_name, oi.quantity, oi.unit_price, oi.total_price, oi.item_type, COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END, 'PIC' || LPAD(oi.item_id::text, 3, '0')) AS product_code
               FROM order_items oi
               LEFT JOIN dealer_products dp ON dp.id = oi.product_id
               WHERE oi.order_id = $1
               ORDER BY oi.item_id`,
              [createdOrder.order_id]
            ),
            pool.query('SELECT cod_advance_amount FROM installation_settings LIMIT 1'),
          ]);
          const refreshedOrder = refreshedOrderResult.rows[0] || createdOrder;

          const codFlatAmount = parseFloat(codSettingsResult.rows[0]?.cod_advance_amount || '500');
          refreshedOrder._codFlatAmount = codFlatAmount;
          const actualOrderNumber = refreshedOrder.order_number || createdOrder.order_number;
          const actualOrderToken  = refreshedOrder.order_token  || createdOrder.order_token;

          // Customer-facing order number (strip dealer UID suffix like -101)
          const customerOrderNumber = /^PR-\d{6}-\d+-\d+$/.test(actualOrderNumber)
            ? actualOrderNumber.replace(/-\d+$/, '')
            : actualOrderNumber;

          const trackingUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${actualOrderToken}`;

          const emailSent = await sendOrderConfirmationEmail({
            orderNumber: customerOrderNumber,
            orderToken: actualOrderToken,
            customerName,
            customerEmail: email,
            totalAmount,
            paymentMethod,
            paymentStatus: refreshedOrder.payment_status || 'Pending',
            orderDate: refreshedOrder.created_at || new Date().toISOString(),
            trackingUrl,
            orderItems: orderItemsResult.rows,
            fullOrderData: refreshedOrder,
          });

          if (emailSent) {
            const pool2 = getPool();
            await pool2.query(
              `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, sent_at)
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [createdOrder.order_id, email, 'order_confirmation', `Order Confirmation - ${customerOrderNumber}`, 'sent', new Date()]
            );
            await pool2.query(
              'UPDATE orders SET tracking_link_sent = true WHERE order_id = $1',
              [createdOrder.order_id]
            );
          }
        } catch (emailError) {
          console.error('Order confirmation email error (non-blocking):', emailError);
        }
      }

      return NextResponse.json({
        success: true,
        order: createdOrder,
      });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pool = getPool();
    await ensureOrderTaskAcceptanceColumns(pool);
    const query = `
      SELECT 
        o.*,
        d.unique_dealer_id    AS assigned_dealer_uid,
        d.business_name       AS assigned_dealer_name,
        d.full_name           AS assigned_dealer_full_name,
        d.phone_number        AS assigned_dealer_phone,
        d.latitude            AS assigned_dealer_lat,
        d.longitude           AS assigned_dealer_lng,
        latest_msg.remarks    AS latest_dealer_remark
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      LEFT JOIN LATERAL (
        SELECT remarks
        FROM order_status_history
        WHERE order_id = o.order_id
          AND remarks IS NOT NULL
          AND remarks <> ''
        ORDER BY created_at DESC
        LIMIT 1
      ) latest_msg ON true
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, paymentStatus } = await request.json();
    const pool = getPool();

    let query = '';
    let values: any[] = [];

    if (status && paymentStatus) {
      query = `
        UPDATE orders 
        SET status = $1, payment_status = $2, updated_at = NOW()
        WHERE order_id = $3
        RETURNING *
      `;
      values = [status, paymentStatus, id];
    } else if (status) {
      query = `
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        WHERE order_id = $2
        RETURNING *
      `;
      values = [status, id];
    } else if (paymentStatus) {
      query = `
        UPDATE orders 
        SET payment_status = $1, updated_at = NOW()
        WHERE order_id = $2
        RETURNING *
      `;
      values = [paymentStatus, id];
    } else {
      return NextResponse.json(
        { success: false, error: 'Status or paymentStatus is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
