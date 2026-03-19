import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Get dealer reward summary
    const summaryResult = await pool.query(
      `SELECT * FROM dealer_reward_summary WHERE dealer_id = $1`,
      [dealerId]
    );

    if (summaryResult.rows.length === 0) {
      // Initialize rewards for this dealer if not exists
      await pool.query(
        `INSERT INTO dealer_rewards (dealer_id, total_points) 
         VALUES ($1, 0) 
         ON CONFLICT (dealer_id) DO NOTHING`,
        [dealerId]
      );

      // Fetch again
      const retryResult = await pool.query(
        `SELECT * FROM dealer_reward_summary WHERE dealer_id = $1`,
        [dealerId]
      );

      if (retryResult.rows.length === 0) {
        return NextResponse.json({
          success: true,
          rewards: {
            total_points: 0,
            points_to_next_gift: 5000,
            total_gifts_redeemed: 0,
            pending_gifts: 0,
            total_earned_transactions: 0
          },
          recent_transactions: []
        });
      }
    }

    const summary = summaryResult.rows[0];

    // Get recent transactions
    const transactionsResult = await pool.query(
      `SELECT 
        transaction_id,
        order_id,
        transaction_type,
        points,
        description,
        delivery_time_hours,
        created_at
      FROM reward_transactions
      WHERE dealer_id = $1
      ORDER BY created_at DESC
      LIMIT 20`,
      [dealerId]
    );

    return NextResponse.json({
      success: true,
      rewards: {
        total_points: parseInt(summary.total_points) || 0,
        points_to_next_gift: parseInt(summary.points_to_next_gift) || 5000,
        points_needed_for_gift: parseInt(summary.points_needed_for_gift) || 5000,
        total_gifts_redeemed: parseInt(summary.total_gifts_redeemed) || 0,
        pending_gifts: parseInt(summary.pending_gifts) || 0,
        total_earned_transactions: parseInt(summary.total_earned_transactions) || 0,
        last_gift_redeemed_at: summary.last_gift_redeemed_at,
        member_since: summary.rewards_member_since
      },
      recent_transactions: transactionsResult.rows
    });

  } catch (error: any) {
    console.error('Error fetching dealer rewards:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
