import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealerId, points, description } = body;

    if (!dealerId || points === undefined) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID and points are required' },
        { status: 400 }
      );
    }

    if (typeof points !== 'number' || points === 0) {
      return NextResponse.json(
        { success: false, error: 'Points must be a non-zero number' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Use the database function to adjust points
    const result = await pool.query(
      `SELECT adjust_dealer_points($1, $2, $3) as result`,
      [dealerId, points, description || 'Admin reward assignment']
    );

    const adjustResult = result.rows[0].result;

    // Check if dealer reached gift milestone
    const rewardsCheck = await pool.query(
      `SELECT total_points, total_gifts_redeemed 
       FROM dealer_rewards 
       WHERE dealer_id = $1`,
      [dealerId]
    );

    if (rewardsCheck.rows.length > 0) {
      const totalPoints = parseInt(rewardsCheck.rows[0].total_points);
      const currentGifts = parseInt(rewardsCheck.rows[0].total_gifts_redeemed) || 0;
      const giftsEarned = Math.floor(totalPoints / 5000);

      // Auto-assign gift if milestone reached
      if (giftsEarned > currentGifts) {
        await pool.query(
          `UPDATE dealer_rewards 
           SET total_gifts_redeemed = $1,
               last_gift_redeemed_at = CURRENT_TIMESTAMP,
               updated_at = CURRENT_TIMESTAMP
           WHERE dealer_id = $2`,
          [giftsEarned, dealerId]
        );

        // Record gift redemption transaction
        const giftsAwarded = giftsEarned - currentGifts;
        await pool.query(
          `INSERT INTO reward_transactions (
            dealer_id, 
            transaction_type, 
            points, 
            description
          ) VALUES ($1, 'redeemed', $2, $3)`,
          [dealerId, -(giftsAwarded * 5000), `Automatic gift redemption - ${giftsAwarded} gift(s) awarded`]
        );

        return NextResponse.json({
          success: true,
          message: 'Points assigned successfully',
          ...adjustResult,
          gifts_awarded: giftsAwarded,
          total_gifts: giftsEarned,
          gift_milestone_reached: true
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Points assigned successfully',
      ...adjustResult,
      gift_milestone_reached: false
    });

  } catch (error: any) {
    console.error('Error assigning rewards:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to assign rewards' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch all dealers with their reward info
export async function GET(request: Request) {
  try {
    const pool = getPool();

    // Fetch all dealers (Active and approved) with their reward information
    const result = await pool.query(
      `SELECT 
        d.dealer_id,
        d.full_name,
        d.business_name,
        d.email,
        d.phone_number as phone,
        d.status,
        COALESCE(dr.total_points, 0) as total_points,
        COALESCE(dr.total_gifts_redeemed, 0) as total_gifts_redeemed,
        dr.last_gift_redeemed_at,
        FLOOR(COALESCE(dr.total_points, 0) / 5000) as pending_gifts,
        COALESCE(dr.total_points, 0) % 5000 as points_to_next_gift
      FROM dealers d
      LEFT JOIN dealer_rewards dr ON d.dealer_id = dr.dealer_id
      WHERE d.status IN ('Active', 'active', 'Approved', 'approved')
      ORDER BY d.full_name ASC`
    );

    console.log(`Found ${result.rows.length} active dealers for rewards management`);

    return NextResponse.json({
      success: true,
      dealers: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching dealers for rewards:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch dealers' },
      { status: 500 }
    );
  }
}
