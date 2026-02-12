// app/api/guest-checkout/route.ts
import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

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

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Determine payment status
      let paymentStatus = 'Pending';
      if (paymentMethod === 'razorpay' && razorpayPaymentId) {
        paymentStatus = 'Paid';
      } else if (paymentMethod === 'cod' && codAdvanceAmount > 0) {
        paymentStatus = 'Advance Paid';
      }

      // Insert order with guest flag
      const orderResult = await pool.query(
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

      // Insert order item (simplified - single product)
      if (productId || productName) {
        await pool.query(
          `INSERT INTO order_items (
            order_id, product_id, item_type, item_name, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            order_id,
            productId || null,
            'Product',
            productName || 'Custom Product',
            quantity,
            productPrice || (subtotal / quantity),
            subtotal || (productPrice * quantity)
          ]
        );
      }

      // Add installation as separate item if included
      if (includesInstallation && installationCharges > 0) {
        await pool.query(
          `INSERT INTO order_items (
            order_id, item_type, item_name, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [order_id, 'Service', 'Installation Service', 1, installationCharges, installationCharges]
        );
      }

      // Add AMC if included
      if (includesAmc && amcCharges > 0) {
        await pool.query(
          `INSERT INTO order_items (
            order_id, item_type, item_name, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [order_id, 'Service', 'Annual Maintenance Contract (AMC)', 1, amcCharges, amcCharges]
        );
      }

      // Create initial status history
      await pool.query(
        `INSERT INTO order_status_history (order_id, status, remarks)
         VALUES ($1, $2, $3)`,
        [order_id, 'Pending', 'Guest order created via checkout']
      );

      // Commit transaction
      await pool.query('COMMIT');

      // Send order confirmation email (if email provided)
      let emailSent = false;
      if (customerEmail) {
        try {
          const trackingUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${order_token}`;
          
          emailSent = await sendOrderConfirmationEmail({
            orderNumber: order_number,
            orderToken: order_token,
            customerName,
            customerEmail,
            totalAmount,
            paymentMethod,
            paymentStatus,
            orderDate: new Date().toISOString(),
            trackingUrl,
          });

          // Log email attempt
          await pool.query(
            `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, sent_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              order_id,
              customerEmail,
              'order_confirmation',
              `Order Confirmation - ${order_number}`,
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
          trackingUrl: `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${order_token}`,
          emailSent,
        }
      });

    } catch (err) {
      // Rollback on error
      await pool.query('ROLLBACK');
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
