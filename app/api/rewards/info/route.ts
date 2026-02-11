import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { customerEmail } = await request.json();

    if (!customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Get customer info with rewards
    const customerResult = await pool.query(
      `SELECT 
        customer_id, 
        full_name, 
        email, 
        referral_id,
        reward_points,
        first_order_completed,
        mystery_box_claimed
      FROM customers 
      WHERE email = $1`,
      [customerEmail]
    );

    if (customerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customer = customerResult.rows[0];

    // Get total referrals made by this customer
    const referralStatsResult = await pool.query(
      `SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_referrals,
        SUM(CASE WHEN status = 'completed' THEN referrer_reward ELSE 0 END) as total_earned_from_referrals
      FROM referral_transactions 
      WHERE referrer_customer_id = $1`,
      [customer.customer_id]
    );

    const referralStats = referralStatsResult.rows[0];

    // Get recent reward transactions (last 10)
    const recentTransactionsResult = await pool.query(
      `SELECT 
        transaction_type,
        points,
        description,
        created_at
      FROM reward_transactions 
      WHERE customer_id = $1
      ORDER BY created_at DESC
      LIMIT 10`,
      [customer.customer_id]
    );

    // Check if mystery box is available (first order completed but not claimed)
    const mysteryBoxAvailable = customer.first_order_completed && !customer.mystery_box_claimed;

    return NextResponse.json({
      success: true,
      customer: {
        id: customer.customer_id,
        name: customer.full_name,
        email: customer.email,
        referralId: customer.referral_id,
        rewardPoints: parseFloat(customer.reward_points || 0),
        firstOrderCompleted: customer.first_order_completed,
        mysteryBoxClaimed: customer.mystery_box_claimed,
        mysteryBoxAvailable,
      },
      referralStats: {
        totalReferrals: parseInt(referralStats.total_referrals || 0),
        successfulReferrals: parseInt(referralStats.successful_referrals || 0),
        totalEarnedFromReferrals: parseFloat(referralStats.total_earned_from_referrals || 0),
      },
      recentTransactions: recentTransactionsResult.rows,
    });
  } catch (error: any) {
    console.error('Error fetching reward info:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch reward information' },
      { status: 500 }
    );
  }
}
