import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { customerEmail, pointsToRedeem } = await request.json();

    if (!customerEmail || !pointsToRedeem) {
      return NextResponse.json(
        { success: false, error: 'Customer email and points to redeem are required' },
        { status: 400 }
      );
    }

    if (pointsToRedeem <= 0) {
      return NextResponse.json(
        { success: false, error: 'Points to redeem must be greater than 0' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Get customer info
    const customerResult = await pool.query(
      `SELECT 
        customer_id, 
        full_name,
        reward_points
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
    const currentPoints = parseFloat(customer.reward_points || 0);

    // Check if customer has enough points
    if (currentPoints < pointsToRedeem) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient reward points',
        available: currentPoints,
        requested: pointsToRedeem,
      });
    }

    // Calculate discount (1 point = 1 currency unit)
    const discountAmount = pointsToRedeem;

    return NextResponse.json({
      success: true,
      message: 'Points validated for redemption',
      discountAmount,
      availablePoints: currentPoints,
      pointsToRedeem,
    });
  } catch (error: any) {
    console.error('Error redeeming points:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to redeem points' },
      { status: 500 }
    );
  }
}
