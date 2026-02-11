import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

const MYSTERY_BOX_POINTS = 50;

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

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Get customer info
      const customerResult = await pool.query(
        `SELECT 
          customer_id, 
          full_name,
          reward_points,
          first_order_completed,
          mystery_box_claimed
        FROM customers 
        WHERE email = $1
        FOR UPDATE`, // Lock row for update
        [customerEmail]
      );

      if (customerResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Customer not found' },
          { status: 404 }
        );
      }

      const customer = customerResult.rows[0];

      // Validate eligibility
      if (!customer.first_order_completed) {
        await pool.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          error: 'Mystery box is only available after your first order',
        });
      }

      if (customer.mystery_box_claimed) {
        await pool.query('ROLLBACK');
        return NextResponse.json({
          success: false,
          error: 'Mystery box has already been claimed',
        });
      }

      // Calculate new balance
      const currentPoints = parseFloat(customer.reward_points || 0);
      const newBalance = currentPoints + MYSTERY_BOX_POINTS;

      // Update customer record
      await pool.query(
        `UPDATE customers 
        SET reward_points = $1, 
            mystery_box_claimed = true,
            updated_at = CURRENT_TIMESTAMP
        WHERE customer_id = $2`,
        [newBalance, customer.customer_id]
      );

      // Record the transaction
      await pool.query(
        `INSERT INTO reward_transactions 
        (customer_id, transaction_type, points, description, balance_after)
        VALUES ($1, $2, $3, $4, $5)`,
        [
          customer.customer_id,
          'mystery_box',
          MYSTERY_BOX_POINTS,
          'Mystery Box reward claimed after first purchase',
          newBalance,
        ]
      );

      // Commit transaction
      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Congratulations! You received ${MYSTERY_BOX_POINTS} reward points!`,
        pointsAwarded: MYSTERY_BOX_POINTS,
        newBalance: newBalance,
      });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error: any) {
    console.error('Error claiming mystery box:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to claim mystery box' },
      { status: 500 }
    );
  }
}
