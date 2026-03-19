// app/api/guest-checkout/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import { notifyNewOrderPlaced } from '@/lib/portal-notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    console.log('🔍 Guest Checkout API - Received Data:', JSON.stringify(body, null, 2));
    
    const {
      // Customer Info (Guest)
      customerName,
      customerPhone,
      customerEmail,
      
      // Product/Order Details
      productId,
      productName,
      productPrice,
      quantity = 1,
      
      // Order Type
      orderType = 'product', // 'product', 'combo', 'customize'
      comboId,
      
      // Address
      installationAddress,
      pincode,
      city,
      state,
      
      // Additional Options
      includesInstallation = false,
      installationCharges = 0,
      includesAmc = false,
      amcCharges = 0,
      
      // Technical Details (optional - for customize)
      cameraType,
      brand,
      channels,
      dvrModel,
      indoorCameras,
      outdoorCameras,
      storageSize,
      cableOption,
      includesAccessories,
      
      // Pricing
      subtotal,
      deliveryCharges = 0,
      taxAmount = 0,
      discountAmount = 0,
      totalAmount,
      
      // Payment
      paymentMethod, // 'cod', 'razorpay'
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      
      // COD Advance
      codAdvanceAmount = 0,
      
    } = body;

    // Validation
    console.log('📋 Validating required fields...');
    console.log('   customerName:', customerName);
    console.log('   customerPhone:', customerPhone);
    console.log('   installationAddress:', installationAddress);
    console.log('   pincode:', pincode);
    console.log('   totalAmount:', totalAmount);
    
    if (!customerName || !customerPhone || !installationAddress || !pincode || !totalAmount) {
      const missing = [];
      if (!customerName) missing.push('customerName');
      if (!customerPhone) missing.push('customerPhone');
      if (!installationAddress) missing.push('installationAddress');
      if (!pincode) missing.push('pincode');
      if (!totalAmount) missing.push('totalAmount');
      
      console.error('❌ Validation failed - Missing:', missing);
      
      return NextResponse.json({
        success: false,
        message: 'Required fields missing: ' + missing.join(', ')
      }, { status: 400 });
    }

    // Validate email format if provided
    if (customerEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerEmail)) {
        return NextResponse.json({
          success: false,
          message: 'Invalid email format'
        }, { status: 400 });
      }
    }

    // Validate payment method
    if (!paymentMethod || !['cod', 'razorpay'].includes(paymentMethod)) {
      console.error('❌ Invalid payment method:', paymentMethod);
      return NextResponse.json({
        success: false,
        message: 'Invalid payment method. Must be "cod" or "razorpay"'
      }, { status: 400 });
    }
    
    console.log('✅ All validations passed');

    const pool = getPool();

    // Use a dedicated client for the transaction so BEGIN/COMMIT run on the same connection
    const client = await pool.connect();
    let clientReleased = false;

    try {
      await client.query('BEGIN');

      // Determine payment status
      let paymentStatus = 'Pending';
      if (paymentMethod === 'razorpay' && razorpayPaymentId) {
        paymentStatus = 'Paid';
      } else if (paymentMethod === 'cod' && codAdvanceAmount > 0) {
        paymentStatus = 'Advance Paid';
      }

      // Insert order with guest flag
      const orderResult = await client.query(
        `INSERT INTO orders (
          customer_name, customer_phone, customer_email,
          order_type, combo_id,
          installation_address, pincode, city, state,
          camera_type, brand, channels, dvr_model,
          indoor_cameras, outdoor_cameras, storage_size, cable_option,
          includes_accessories, includes_installation,
          subtotal, installation_charges, delivery_charges, tax_amount, discount_amount, total_amount,
          payment_method, payment_status, advance_amount,
          razorpay_order_id, payment_id,
          is_guest_order, status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32
        ) RETURNING order_id, order_number, order_token`,
        [
          customerName, customerPhone, customerEmail || null,
          orderType, comboId || null,
          installationAddress, pincode, city || null, state || null,
          cameraType || null, brand || null, channels || null, dvrModel || null,
          indoorCameras ? JSON.stringify(indoorCameras) : null,
          outdoorCameras ? JSON.stringify(outdoorCameras) : null,
          storageSize || null, cableOption || null,
          includesAccessories || false, includesInstallation || false,
          subtotal || 0, installationCharges || 0, deliveryCharges || 0,
          taxAmount || 0, discountAmount || 0, totalAmount,
          paymentMethod, paymentStatus, codAdvanceAmount || 0,
          razorpayOrderId || null, razorpayPaymentId || null,
          true, // is_guest_order
          'Pending' // status
        ]
      );

      const { order_id, order_number, order_token } = orderResult.rows[0];

      // Build email items list in parallel with DB inserts (from known request values)
      const emailOrderItems: Array<{ item_name: string; quantity: number; unit_price: number; total_price: number; item_type: string; product_code?: string }> = [];

      // Insert order item with combined price when installation/AMC is included
      if (productId || productName) {
        // Calculate additional charges (installation + AMC)
        const additionalCharges = (includesInstallation ? installationCharges : 0) + (includesAmc ? amcCharges : 0);
        
        // Combined unit price includes product + installation + AMC
        const baseUnitPrice = productPrice || (subtotal / quantity);
        const combinedLineTotal = subtotal + additionalCharges;
        const combinedUnitPrice = combinedLineTotal / quantity;
        
        // Build product name with indication of what's included
        let displayProductName = productName || 'Custom Product';
        const inclusions = [];
        if (includesInstallation) inclusions.push('Installation');
        if (includesAmc) inclusions.push('AMC');
        if (inclusions.length > 0) {
          displayProductName = `${displayProductName} (with ${inclusions.join(' + ')})`;
        }
        
        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, item_type, item_name, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [order_id, productId || null, 'Product', displayProductName, quantity, combinedUnitPrice, combinedLineTotal]
        );
        let productCode: string | undefined;
        if (productId) {
          const productCodeResult = await client.query(
            'SELECT product_code FROM dealer_products WHERE id = $1',
            [productId]
          );
          productCode = productCodeResult.rows[0]?.product_code || `PIC${String(productId).padStart(3, '0')}`;
        }

        emailOrderItems.push({ 
          item_name: displayProductName, 
          quantity, 
          unit_price: combinedUnitPrice, 
          total_price: combinedLineTotal, 
          item_type: 'Product',
          product_code: productCode,
        });
      }

      // Note: We no longer insert separate rows for Installation or AMC
      // They are now included in the product price above

      // Create initial status history
      await client.query(
        `INSERT INTO order_status_history (order_id, status, remarks)
         VALUES ($1, $2, $3)`,
        [order_id, 'Pending', 'Guest order created via checkout']
      );

      // Commit transaction and release the dedicated client
      await client.query('COMMIT');
      client.release();
      clientReleased = true;

      // 🚀 TRIGGER ORDER ALLOCATION TO NEAREST DEALER
      try {
        const allocationResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/order-allocation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: order_id })
        });

        const allocationData = await allocationResponse.json();
        
        if (allocationData.success) {
          if (allocationData.allocated) {
            console.log(`✅ Order #${order_number} allocated to dealer: ${allocationData.dealer_name}`);
          } else if (allocationData.escalated_to_admin) {
            console.log(`⚠️ Order #${order_number} escalated to admin - no dealer has stock`);
          }
        } else {
          console.error(`❌ Order allocation failed for #${order_number}:`, allocationData.error);
        }
      } catch (allocationError) {
        // Don't fail the order if allocation fails - log and continue
        console.error('Order allocation error:', allocationError);
      }

      // Fetch full order with dealer details + COD settings for invoice PDF
      const customerOrderNumber = /^PR-\d{6}-\d+-\d+$/.test(order_number)
        ? order_number.replace(/-\d+$/, '')
        : order_number;

      const [fullOrderResult, codSettingsResult, canonicalOrderItemsResult] = await Promise.all([
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
        `, [order_id]),
        pool.query('SELECT cod_advance_amount FROM installation_settings LIMIT 1'),
        pool.query(
          `SELECT
             oi.id as item_id,
             oi.product_id,
             oi.item_name,
             oi.quantity,
             oi.unit_price,
             oi.total_price,
             oi.item_type,
             COALESCE(
               to_jsonb(dp)->>'product_code',
               CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END,
               'PIC' || LPAD(oi.id::text, 3, '0')
             ) AS product_code
           FROM order_items oi
           LEFT JOIN dealer_products dp ON dp.id = oi.product_id
           WHERE oi.order_id = $1
           ORDER BY oi.id`,
          [order_id]
        ),
      ]);

      const orderDataForEmail = fullOrderResult.rows[0] || {
        order_id, order_number, order_token,
        customer_name: customerName, customer_phone: customerPhone, customer_email: customerEmail || null,
        installation_address: installationAddress, pincode, city: city || null, state: state || null,
        payment_method: paymentMethod, payment_status: paymentStatus,
        total_amount: totalAmount, subtotal: subtotal || 0,
        installation_charges: installationCharges || 0, delivery_charges: deliveryCharges || 0,
        tax_amount: taxAmount || 0, discount_amount: discountAmount || 0,
        advance_amount: codAdvanceAmount || 0, order_type: orderType,
        camera_type: cameraType || null, brand: brand || null,
        channels: channels || null, dvr_model: dvrModel || null,
        is_guest_order: true, status: 'Pending',
        created_at: new Date().toISOString(),
      };
      orderDataForEmail._codFlatAmount = parseFloat(codSettingsResult.rows[0]?.cod_advance_amount || '500');

      const canonicalOrderItems = (canonicalOrderItemsResult.rows || []) as Array<{
        item_id: number;
        product_id?: number;
        item_name: string;
        quantity: number;
        unit_price: number;
        total_price: number;
        item_type?: string;
        product_code?: string;
      }>;

      await notifyNewOrderPlaced({
        orderId: order_id,
        orderNumber: orderDataForEmail.order_number || order_number,
        customerName,
        city: orderDataForEmail.city || city || null,
        pincode: orderDataForEmail.pincode || pincode || null,
        totalAmount,
        district: orderDataForEmail.dealer_district || null,
      });

      const trackingUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${order_token}`;

      // Send order confirmation email
      let emailSent = false;
      if (customerEmail) {
        try {
          console.log(`📧 Sending order confirmation email to ${customerEmail} for order ${customerOrderNumber}`);

          emailSent = await sendOrderConfirmationEmail({
            orderNumber: customerOrderNumber,
            orderToken: order_token,
            customerName,
            customerEmail,
            totalAmount,
            paymentMethod,
            paymentStatus,
            orderDate: new Date().toISOString(),
            trackingUrl,
            orderItems: canonicalOrderItems.length > 0 ? canonicalOrderItems : emailOrderItems,
            fullOrderData: orderDataForEmail,
          });

          console.log(`📧 Email result for order ${customerOrderNumber}: ${emailSent ? 'SENT ✅' : 'FAILED ❌'}`);

          // Log email attempt (use pool directly — no transaction needed)
          await pool.query(
            `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              order_id,
              customerEmail,
              'order_confirmation',
              `Order Confirmation - ${customerOrderNumber}`,
              emailSent ? 'sent' : 'failed',
              emailSent ? new Date() : null
            ]
          );

          // Update tracking_link_sent flag
          if (emailSent) {
            await pool.query(
              'UPDATE orders SET tracking_link_sent = true WHERE order_id = $1',
              [order_id]
            );
          }
        } catch (emailError) {
          console.error('Email sending error (non-blocking):', emailError);
          // Don't fail the order creation if email fails
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Order placed successfully',
        order: {
          orderId: order_id,
          orderNumber: order_number,
          orderToken: order_token,
          totalAmount,
          paymentStatus,
          status: 'Pending',
          trackingUrl,
          emailSent,
        }
      });

    } catch (err) {
      // Rollback on error if the client hasn't been released yet
      if (!clientReleased) {
        try { await client.query('ROLLBACK'); } catch (_) {}
        client.release();
      }
      throw err;
    }

  } catch (err: any) {
    console.error('Guest checkout error:', err);
    return NextResponse.json({
      success: false,
      message: 'Failed to process checkout',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    }, { status: 500 });
  }
}
