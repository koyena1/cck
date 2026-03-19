import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch all order statuses for admin
export async function GET(request: Request) {
  try {
    const pool = getPool();

    // Fetch all orders with dealer assignment and status history
    const query = `
      SELECT 
        o.order_id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.installation_address,
        o.pincode,
        o.city,
        o.total_amount,
        o.status,
        o.assigned_at as accepted_at,
        d.business_name as dealer_name,
        d.phone_number as dealer_phone,
        COALESCE(
          json_agg(
            json_build_object(
              'status', osh.status,
              'remarks', osh.remarks,
              'updated_by_dealer_name', d2.business_name,
              'created_at', osh.created_at
            )
            ORDER BY osh.created_at DESC
          ) FILTER (WHERE osh.history_id IS NOT NULL),
          '[]'
        ) as status_history
      FROM orders o
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      LEFT JOIN order_status_history osh ON o.order_id = osh.order_id
      LEFT JOIN dealers d2 ON osh.updated_by_dealer = d2.dealer_id
      WHERE o.assigned_dealer_id IS NOT NULL
        AND o.status IN ('Allocated', 'In_Transit', 'Delivered', 'Installation_Pending', 'Completed')
      GROUP BY o.order_id, d.business_name, d.phone_number
      ORDER BY 
        CASE 
          WHEN o.status = 'Allocated' THEN 1
          WHEN o.status = 'In_Transit' THEN 2
          WHEN o.status = 'Delivered' THEN 3
          WHEN o.status = 'Installation_Pending' THEN 4
          WHEN o.status = 'Completed' THEN 5
          ELSE 6
        END,
        o.updated_at DESC
    `;

    const result = await pool.query(query);

    return NextResponse.json({
      success: true,
      orders: result.rows
    });

  } catch (error: any) {
    console.error('Error fetching order statuses:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch order statuses' },
      { status: 500 }
    );
  }
}
