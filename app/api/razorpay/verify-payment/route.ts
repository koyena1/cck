import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPool } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

const DEV_MODE = process.env.RAZORPAY_DEV_MODE === 'true';
const REFERRER_REWARD_POINTS = 100;

// Helper function to process rewards after successful payment
async function processRewards(pool: any, orderId: number, orderEmail: string) {
  try {
    const orderResult = await pool.query(
      `SELECT 
        order_id, 
        customer_email, 
        referral_code_used,
        is_first_order,
        points_redeemed
      FROM orders 
      WHERE order_id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      console.log('Order not found for rewards processing');
      return;
    }

    const order = orderResult.rows[0];

    const customerResult = await pool.query(
      `SELECT customer_id, reward_points, first_order_completed 
       FROM customers 
       WHERE email = $1`,
      [order.customer_email || orderEmail]
    );

    if (customerResult.rows.length === 0) {
      console.log('Customer not found for rewards processing');
      return;
    }

    const customer = customerResult.rows[0];

    await pool.query('BEGIN');

    try {
      if (order.is_first_order && !customer.first_order_completed) {
        await pool.query(
          `UPDATE customers 
           SET first_order_completed = true, 
               updated_at = CURRENT_TIMESTAMP
           WHERE customer_id = $1`,
          [customer.customer_id]
        );
        console.log('✅ First order marked as completed for customer:', customer.customer_id);
      }

      if (order.referral_code_used) {
        const referrerResult = await pool.query(
          `SELECT customer_id, reward_points 
           FROM customers 
           WHERE referral_id = $1`,
          [order.referral_code_used]
        );

        if (referrerResult.rows.length > 0) {
          const referrer = referrerResult.rows[0];
          const newReferrerBalance = parseFloat(referrer.reward_points || 0) + REFERRER_REWARD_POINTS;
          
          await pool.query(
            `UPDATE customers 
             SET reward_points = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE customer_id = $2`,
            [newReferrerBalance, referrer.customer_id]
          );

          await pool.query(
            `INSERT INTO reward_transactions 
            (customer_id, transaction_type, points, description, order_id, balance_after)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              referrer.customer_id,
              'referral_reward',
              REFERRER_REWARD_POINTS,
              `Referral reward: ${order.customer_email} completed first order`,
              order.order_id,
              newReferrerBalance,
            ]
          );

          await pool.query(
            `UPDATE referral_transactions 
             SET status = 'completed',
                 completed_at = CURRENT_TIMESTAMP,
                 order_id = $1
             WHERE referrer_customer_id = $2 
               AND referred_customer_id = $3`,
            [order.order_id, referrer.customer_id, customer.customer_id]
          );

          console.log(`✅ Referral reward processed: ${REFERRER_REWARD_POINTS} points to referrer`);
        }
      }

      if (order.points_redeemed && order.points_redeemed > 0) {
        const newBalance = parseFloat(customer.reward_points || 0) - parseFloat(order.points_redeemed);
        
        if (newBalance >= 0) {
          await pool.query(
            `UPDATE customers 
             SET reward_points = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE customer_id = $2`,
            [newBalance, customer.customer_id]
          );

          await pool.query(
            `INSERT INTO reward_transactions 
            (customer_id, transaction_type, points, description, order_id, balance_after)
            VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              customer.customer_id,
              'points_redeemed',
              -order.points_redeemed,
              `Points redeemed for discount on order`,
              order.order_id,
              newBalance,
            ]
          );

          console.log(`✅ Points redeemed: ${order.points_redeemed} points deducted`);
        }
      }

      await pool.query('COMMIT');
      console.log('✅ All rewards processed successfully');
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error('Error processing rewards:', err);
    }
  } catch (error) {
    console.error('Error in processRewards:', error);
  }
}

export async function POST(request: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_number 
    } = await request.json();

    console.log(`\n🔍 PAYMENT VERIFICATION START`);
    console.log(`   Order Number: ${order_number}`);
    console.log(`   Razorpay Order ID: ${razorpay_order_id}`);
    console.log(`   Payment ID: ${razorpay_payment_id}`);
    console.log(`   DEV_MODE: ${DEV_MODE}`);

    const pool = getPool();

    let signatureValid = false;

    if (DEV_MODE) {
      console.log(`⚠️ DEV MODE ACTIVE – Skipping signature verification and auto-verifying payment`);
      signatureValid = true;
    } else {
      // ✅ FIX: Use the correct environment variable name
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) {
        console.error(`❌ RAZORPAY_KEY_SECRET environment variable is not set`);
        return NextResponse.json(
          { success: false, error: 'Server configuration error: missing Razorpay secret' },
          { status: 500 }
        );
      }

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

      signatureValid = expectedSignature === razorpay_signature;

      if (!signatureValid) {
        console.error(`❌ Signature mismatch`);
        console.error(`   Expected: ${expectedSignature}`);
        console.error(`   Received: ${razorpay_signature}`);
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 400 }
        );
      }

      console.log(`✅ Signature verified successfully`);
    }

    if (signatureValid) {
      const updateResult = await pool.query(
        `UPDATE orders 
         SET payment_status = $1, 
             payment_id = $2,
             razorpay_order_id = $3,
             updated_at = NOW()
         WHERE order_number = $4 OR order_number LIKE $4 || '-%' OR razorpay_order_id = $3
         RETURNING order_id, customer_email, customer_name, customer_phone, payment_method, total_amount, subtotal, installation_charges, advance_amount, order_token, order_number, created_at`,
        ['Paid', razorpay_payment_id, razorpay_order_id, order_number]
      );

      if (updateResult.rows.length === 0) {
        console.error(`❌ Order not found for order_number: ${order_number} or razorpay_order_id: ${razorpay_order_id}`);
        return NextResponse.json(
          { success: false, error: 'Order not found' },
          { status: 404 }
        );
      }

      const order = updateResult.rows[0];
      console.log(`✅ Order ${order.order_number} payment status updated to 'Paid'`);

      await processRewards(pool, order.order_id, order.customer_email);

      if (order.customer_email) {
  try {
    const trackingUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${order.order_token}`;
    
    // Check if an order confirmation email was already sent
    const emailAlreadySentResult = await pool.query(
      `SELECT 1
       FROM email_logs
       WHERE order_id = $1
         AND recipient_email = $2
         AND email_type = 'order_confirmation'
         AND email_status = 'sent'
       LIMIT 1`,
      [order.order_id, order.customer_email]
    );
    
    const alreadySent = emailAlreadySentResult.rows.length > 0;

    if (alreadySent) {
      // Send a simpler Payment Confirmation email
      console.log(`📧 Sending payment confirmation email for order ${order.order_number} (order confirmation already sent)`);
      
      const nodemailer = require('nodemailer');
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD,
        },
      });

      const paymentConfirmationHtml = `
        <h2>Payment Successful</h2>
        <p>Dear ${order.customer_name},</p>
        <p>Your payment for order <strong>${order.order_number}</strong> has been successfully processed.</p>
        <p>Payment Details:</p>
        <ul>
          <li>Order Total: RS ${parseFloat(order.total_amount).toFixed(2)}</li>
          <li>Amount Paid: RS ${order.payment_method === 'cod' ? parseFloat(order.advance_amount || 0).toFixed(2) : parseFloat(order.total_amount).toFixed(2)}</li>
          <li>Payment Method: ${order.payment_method === 'cod' ? 'COD Advance' : 'Online Payment'}</li>
        </ul>
        <p>You can track your order status here: <a href="${trackingUrl}">${trackingUrl}</a></p>
        <p>Thank you for shopping with us!</p>
      `;

      const mailOptions = {
        from: `"${process.env.NEXT_PUBLIC_COMPANY_NAME || 'Protechtur'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: order.customer_email,
        subject: `Payment Confirmation - Order #${order.order_number}`,
        html: paymentConfirmationHtml,
      };

      const info = await transporter.sendMail(mailOptions);
      const emailSent = !!info.messageId;

      await pool.query(
        `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, error_message, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          order.order_id,
          order.customer_email,
          'payment_confirmation',
          `Payment Confirmation - ${order.order_number}`,
          emailSent ? 'sent' : 'failed',
          emailSent ? null : 'Failed to send payment confirmation',
          emailSent ? new Date() : null,
        ]
      );
      
      console.log(`📧 Payment confirmation email ${emailSent ? 'sent' : 'failed'}`);
    } else {
      // No order confirmation sent yet – send full order confirmation
      console.log(`📧 Sending full order confirmation email for order ${order.order_number}`);

      const [fullOrderResult, orderItemsResult, codSettingsResult] = await Promise.all([
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
        `, [order.order_id]),
        pool.query(`
          SELECT oi.item_name, oi.quantity, oi.unit_price, oi.total_price, oi.item_type,
                 COALESCE(
                   to_jsonb(dp)->>'product_code',
                   CASE WHEN oi.product_id IS NOT NULL THEN 'PIC' || LPAD(oi.product_id::text, 3, '0') END,
                   'PIC' || LPAD(COALESCE(to_jsonb(oi)->>'item_id', to_jsonb(oi)->>'id', '0'), 3, '0')
                 ) AS product_code,
                 COALESCE(oi.hsn_code, to_jsonb(dp)->>'hsn_code') AS hsn_code
          FROM order_items oi
          LEFT JOIN dealer_products dp ON dp.id = oi.product_id
          WHERE oi.order_id = $1
          ORDER BY COALESCE((to_jsonb(oi)->>'item_id')::int, (to_jsonb(oi)->>'id')::int, 0)
        `, [order.order_id]),
        pool.query('SELECT cod_advance_amount, cod_percentage FROM installation_settings LIMIT 1'),
      ]);

      const fullOrderData = fullOrderResult.rows[0] || { ...order };
      const codSettings = codSettingsResult.rows[0] || {};
      fullOrderData._codFlatAmount = parseFloat(codSettings.cod_advance_amount || '500');
      fullOrderData._codPercentage = parseFloat(codSettings.cod_percentage || '0');

      const emailSent = await sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        orderToken: order.order_token,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        totalAmount: parseFloat(order.total_amount || 0),
        paymentMethod: order.payment_method,
        paymentStatus: 'Paid',
        orderDate: order.created_at || new Date().toISOString(),
        trackingUrl,
        orderItems: orderItemsResult.rows,
        fullOrderData,
      });

      await pool.query(
        `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, sent_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.order_id,
          order.customer_email,
          'order_confirmation',
          `Order Confirmation - ${order.order_number}`,
          emailSent ? 'sent' : 'failed',
          emailSent ? new Date() : null,
        ]
      );

      if (emailSent) {
        await pool.query('UPDATE orders SET tracking_link_sent = true WHERE order_id = $1', [order.order_id]);
      }
    }
  } catch (emailError) {
    console.error('Error sending email after payment:', emailError);
    // Log the error but don't break verification
    try {
      await pool.query(
        `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, error_message)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          order.order_id,
          order.customer_email,
          'payment_notification',
          `Payment Notification - ${order.order_number}`,
          'failed',
          emailError instanceof Error ? emailError.message : String(emailError),
        ]
      );
    } catch (logError) {
      console.error('Error logging email failure:', logError);
    }
  }
}

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}