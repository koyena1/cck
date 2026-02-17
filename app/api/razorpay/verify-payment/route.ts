import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPool } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';

const DEV_MODE = process.env.RAZORPAY_DEV_MODE === 'true';
const REFERRER_REWARD_POINTS = 100;

// Helper function to process rewards after successful payment
async function processRewards(pool: any, orderId: number, orderEmail: string) {
  try {
    // Get order details
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

    // Get customer info
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

    // Start transaction for rewards
    await pool.query('BEGIN');

    try {
      // 1. Mark first order as completed if applicable
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

      // 2. Process referral rewards if referral code was used
      if (order.referral_code_used) {
        // Get referrer info
        const referrerResult = await pool.query(
          `SELECT customer_id, reward_points 
           FROM customers 
           WHERE referral_id = $1`,
          [order.referral_code_used]
        );

        if (referrerResult.rows.length > 0) {
          const referrer = referrerResult.rows[0];

          // Add points to referrer
          const newReferrerBalance = parseFloat(referrer.reward_points || 0) + REFERRER_REWARD_POINTS;
          
          await pool.query(
            `UPDATE customers 
             SET reward_points = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE customer_id = $2`,
            [newReferrerBalance, referrer.customer_id]
          );

          // Record reward transaction for referrer
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

          // Update referral transaction status to completed
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

      // 3. Deduct redeemed points from customer balance if applicable
      if (order.points_redeemed && order.points_redeemed > 0) {
        const newBalance = parseFloat(customer.reward_points || 0) - parseFloat(order.points_redeemed);
        
        if (newBalance >= 0) { // Prevent negative balance
          await pool.query(
            `UPDATE customers 
             SET reward_points = $1,
                 updated_at = CURRENT_TIMESTAMP
             WHERE customer_id = $2`,
            [newBalance, customer.customer_id]
          );

          // Record points redemption transaction
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

    const pool = getPool();

    // Development mode: Auto-approve payment
    if (DEV_MODE) {
      console.log(`✅ DEV MODE - Auto-verifying payment for order: ${order_number}`);
      
      if (order_number) {
        const updateResult = await pool.query(
          `UPDATE orders 
           SET payment_status = $1, 
               payment_id = $2,
               razorpay_order_id = $3,
               updated_at = NOW()
           WHERE order_number = $4
           RETURNING order_id, customer_email, customer_name, customer_phone, payment_method, total_amount, subtotal, installation_charges, advance_amount, order_token, created_at`,
          ['Paid', razorpay_payment_id || 'DEV_PAYMENT', razorpay_order_id, order_number]
        );

        if (updateResult.rows.length > 0) {
          const order = updateResult.rows[0];
          
          // Process rewards after successful payment
          await processRewards(pool, order.order_id, order.customer_email);
          
          // If this is a COD advance payment, send order confirmation email now
          if (order.payment_method === 'cod' && order.customer_email) {
            try {
              const trackingUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${order.order_token}`;
              
              // Calculate COD payment breakdown
              const totalAmount = parseFloat(order.total_amount);
              const subtotalAmount = parseFloat(order.subtotal || 0); // Products only
              const installationCharges = parseFloat(order.installation_charges || 0);
              const advanceAmount = parseFloat(order.advance_amount || 0);
              
              // Fetch AMC charges from order_items if exists
              const amcResult = await pool.query(
                `SELECT COALESCE(SUM(total_price), 0) as amc_total 
                 FROM order_items 
                 WHERE order_id = $1 AND item_type = 'Service' AND item_name LIKE '%AMC%'`,
                [order.order_id]
              );
              const amcCharges = parseFloat(amcResult.rows[0]?.amc_total || 0);
              
              // Calculate breakdown correctly
              const productTotal = subtotalAmount; // subtotal is ALREADY just products
              const baseAmount = subtotalAmount + installationCharges + amcCharges; // Product + Installation + AMC
              const codExtraCharges = totalAmount - baseAmount; // COD extra charges
              const codAdvancePaid = advanceAmount;
              const codPendingAmount = totalAmount - codAdvancePaid;
              
              const emailSent = await sendOrderConfirmationEmail({
                orderNumber: order_number,
                orderToken: order.order_token,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                totalAmount: totalAmount,
                paymentMethod: 'cod',
                paymentStatus: 'Advance Paid',
                orderDate: order.created_at || new Date().toISOString(),
                trackingUrl,
                // COD Payment Breakdown (matching checkout page format)
                productTotal: productTotal,
                installationCharges: installationCharges,
                codExtraCharges: codExtraCharges,
                baseAmount: baseAmount,
                codAdvancePaid: codAdvancePaid,
                codPendingAmount: codPendingAmount,
              });
              
              // Log email attempt
              if (emailSent) {
                await pool.query(
                  `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, sent_at)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    order.order_id,
                    order.customer_email,
                    'order_confirmation',
                    `Order Confirmation - ${order_number}`,
                    'sent',
                    new Date()
                  ]
                );
                
                // Update tracking_link_sent flag
                await pool.query(
                  'UPDATE orders SET tracking_link_sent = true WHERE order_id = $1',
                  [order.order_id]
                );
              }
            } catch (emailError) {
              console.error('Error sending COD confirmation email (DEV MODE):', emailError);
              // Don't fail the payment verification if email fails
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully (DEV MODE)',
        devMode: true,
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Razorpay secret not configured' },
        { status: 500 }
      );
    }

    // Verify signature
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    if (razorpay_signature === expectedSign) {
      // Update order payment status in database
      if (order_number) {
        const updateResult = await pool.query(
          `UPDATE orders 
           SET payment_status = $1, 
               payment_id = $2,
               razorpay_order_id = $3,
               updated_at = NOW()
           WHERE order_number = $4
           RETURNING order_id, customer_email, customer_name, customer_phone, payment_method, total_amount, subtotal, installation_charges, advance_amount, order_token, created_at`,
          ['Paid', razorpay_payment_id, razorpay_order_id, order_number]
        );

        if (updateResult.rows.length > 0) {
          const order = updateResult.rows[0];
          
          // Process rewards after successful payment
          await processRewards(pool, order.order_id, order.customer_email);
          
          // If this is a COD advance payment, send order confirmation email now
          if (order.payment_method === 'cod' && order.customer_email) {
            try {
              const trackingUrl = `${process.env.NEXT_PUBLIC_WEBSITE_URL || 'http://localhost:3000'}/guest-track-order?token=${order.order_token}`;
              
              // Calculate COD payment breakdown
              const totalAmount = parseFloat(order.total_amount);
              const subtotalAmount = parseFloat(order.subtotal || 0); // Products only
              const installationCharges = parseFloat(order.installation_charges || 0);
              const advanceAmount = parseFloat(order.advance_amount || 0);
              
              // Fetch AMC charges from order_items if exists
              const amcResult = await pool.query(
                `SELECT COALESCE(SUM(total_price), 0) as amc_total 
                 FROM order_items 
                 WHERE order_id = $1 AND item_type = 'Service' AND item_name LIKE '%AMC%'`,
                [order.order_id]
              );
              const amcCharges = parseFloat(amcResult.rows[0]?.amc_total || 0);
              
              // Calculate breakdown correctly
              const productTotal = subtotalAmount; // subtotal is ALREADY just products
              const baseAmount = subtotalAmount + installationCharges + amcCharges; // Product + Installation + AMC
              const codExtraCharges = totalAmount - baseAmount; // COD extra charges
              const codAdvancePaid = advanceAmount;
              const codPendingAmount = totalAmount - codAdvancePaid;
              
              const emailSent = await sendOrderConfirmationEmail({
                orderNumber: order_number,
                orderToken: order.order_token,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                totalAmount: totalAmount,
                paymentMethod: 'cod',
                paymentStatus: 'Advance Paid',
                orderDate: order.created_at || new Date().toISOString(),
                trackingUrl,
                // COD Payment Breakdown (matching checkout page format)
                productTotal: productTotal,
                installationCharges: installationCharges,
                codExtraCharges: codExtraCharges,
                baseAmount: baseAmount,
                codAdvancePaid: codAdvancePaid,
                codPendingAmount: codPendingAmount,
              });
              
              // Log email attempt
              if (emailSent) {
                await pool.query(
                  `INSERT INTO email_logs (order_id, recipient_email, email_type, subject, email_status, sent_at)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [
                    order.order_id,
                    order.customer_email,
                    'order_confirmation',
                    `Order Confirmation - ${order_number}`,
                    'sent',
                    new Date()
                  ]
                );
                
                // Update tracking_link_sent flag
                await pool.query(
                  'UPDATE orders SET tracking_link_sent = true WHERE order_id = $1',
                  [order.order_id]
                );
              }
            } catch (emailError) {
              console.error('Error sending COD confirmation email:', emailError);
              // Don't fail the payment verification if email fails
            }
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
