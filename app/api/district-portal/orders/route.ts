import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import { ensureOrderTaskAcceptanceColumns } from '@/lib/order-task-acceptance';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const district = searchParams.get('district');

    if (!district) {
      return NextResponse.json(
        { success: false, error: 'District parameter is required' },
        { status: 400 }
      );
    }

    await ensureOrderTaskAcceptanceColumns(pool);

    // Fetch all orders visible to this district.
    // Primary scope: customer installation pincode mapped to district.
    // Fallback scope: assigned dealer belongs to district (handles missing pincode_master rows).
    const result = await pool.query(
      `SELECT 
        o.order_id,
        o.order_token,
        o.is_guest_order,
        o.assigned_dealer_id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.installation_address,
        o.pincode,
        o.city,
        o.state,
        pm.district as order_district,
        o.status,
        o.total_amount,
        o.payment_status,
        o.created_at,
        o.updated_at,
        o.order_type,
        o.expected_delivery_date,
        o.actual_delivery_date,
        d.unique_dealer_id as assigned_dealer_uid,
        d.full_name as dealer_name,
        d.business_name as dealer_business_name,
        d.phone_number as dealer_phone,
        dor.request_status as dealer_request_status,
        dor.responded_at as dealer_response_at,
        dor.dealer_notes,
        latest_msg.remarks as latest_dealer_remark,
        o.task_accepted_by_portal,
        o.task_accepted_by_name,
        o.task_accepted_by_details,
        o.task_accepted_at
      FROM orders o
      LEFT JOIN pincode_master pm ON pm.pincode = o.pincode
      LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
      LEFT JOIN dealer_order_requests dor ON o.order_id = dor.order_id AND dor.dealer_id = d.dealer_id
      LEFT JOIN LATERAL (
        SELECT remarks
        FROM order_status_history
        WHERE order_id = o.order_id
          AND remarks IS NOT NULL
          AND remarks <> ''
        ORDER BY created_at DESC
        LIMIT 1
      ) latest_msg ON true
      WHERE (
        LOWER(TRIM(COALESCE(pm.district, ''))) = LOWER(TRIM($1))
        OR LOWER(TRIM(COALESCE(d.district, ''))) = LOWER(TRIM($1))
      )
      ORDER BY o.created_at DESC`,
      [district]
    );

    return NextResponse.json({
      success: true,
      orders: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
