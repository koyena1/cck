import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { referralCode, customerEmail } = await request.json();

    if (!referralCode) {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Find the referrer by referral code
    const referrerResult = await pool.query(
      'SELECT customer_id, full_name, email FROM customers WHERE referral_id = $1',
      [referralCode]
    );

    if (referrerResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid referral code',
      });
    }

    const referrer = referrerResult.rows[0];

    // Check if customer is trying to use their own referral code
    if (customerEmail && referrer.email === customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'You cannot use your own referral code',
      });
    }

    // If customer email provided, check if they've already used a referral code
    if (customerEmail) {
      const customerResult = await pool.query(
        'SELECT customer_id FROM customers WHERE email = $1',
        [customerEmail]
      );

      if (customerResult.rows.length > 0) {
        const customerId = customerResult.rows[0].customer_id;

        // Check if this customer has already used a referral code
        const existingReferralResult = await pool.query(
          'SELECT id FROM referral_transactions WHERE referred_customer_id = $1',
          [customerId]
        );

        if (existingReferralResult.rows.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'You have already used a referral code',
          });
        }

        // Check if customer has already placed an order
        const orderResult = await pool.query(
          'SELECT order_id FROM orders WHERE customer_email = $1 LIMIT 1',
          [customerEmail]
        );

        if (orderResult.rows.length > 0) {
          return NextResponse.json({
            success: false,
            error: 'Referral codes can only be used on your first order',
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Valid referral code',
      referrer: {
        name: referrer.full_name,
      },
      discount: 50, // Fixed discount amount
    });
  } catch (error: any) {
    console.error('Error validating referral code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate referral code' },
      { status: 500 }
    );
  }
}
