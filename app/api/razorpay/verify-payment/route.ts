import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPool } from '@/lib/db';

const DEV_MODE = process.env.RAZORPAY_DEV_MODE === 'true';

export async function POST(request: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      order_number 
    } = await request.json();

    // Development mode: Auto-approve payment
    if (DEV_MODE) {
      console.log(`✅ DEV MODE - Auto-verifying payment for order: ${order_number}`);
      
      if (order_number) {
        const pool = getPool();
        await pool.query(
          `UPDATE orders 
           SET payment_status = $1, 
               payment_id = $2,
               razorpay_order_id = $3,
               updated_at = NOW()
           WHERE order_number = $4`,
          ['Paid', razorpay_payment_id || 'DEV_PAYMENT', razorpay_order_id, order_number]
        );
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
        const pool = getPool();
        await pool.query(
          `UPDATE orders 
           SET payment_status = $1, 
               payment_id = $2,
               razorpay_order_id = $3,
               updated_at = NOW()
           WHERE order_number = $4`,
          ['Paid', razorpay_payment_id, razorpay_order_id, order_number]
        );
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
