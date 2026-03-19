import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Fetch district-wise statistics
export async function GET(req: NextRequest) {
  try {
    // Fetch dealer stats by district
    const dealerStats = await pool.query(`
      SELECT 
        district,
        state,
        COUNT(dealer_id) as total_dealers,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_dealers,
        COUNT(CASE WHEN status = 'Pending Approval' THEN 1 END) as pending_dealers,
        AVG(rating) as average_rating,
        SUM(completed_jobs) as total_completed_jobs
      FROM dealers
      WHERE district IS NOT NULL
      GROUP BY district, state
      ORDER BY state, district
    `);

    // Fetch order stats by district
    const orderStats = await pool.query(`
      SELECT 
        d.district,
        d.state,
        COUNT(o.order_id) as total_orders,
        COUNT(CASE WHEN o.status = 'Pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN o.status = 'Allocated' THEN 1 END) as allocated_orders,
        COUNT(CASE WHEN o.status = 'Completed' THEN 1 END) as completed_orders,
        SUM(o.total_amount) as total_order_value
      FROM orders o
      JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      WHERE d.district IS NOT NULL
      GROUP BY d.district, d.state
      ORDER BY d.state, d.district
    `);

    return NextResponse.json({
      success: true,
      stats: dealerStats.rows,
      orderStats: orderStats.rows
    });
  } catch (error) {
    console.error('Failed to fetch district stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch district statistics' },
      { status: 500 }
    );
  }
}
