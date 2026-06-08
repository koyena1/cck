import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { buildPaymentBreakdown } from '@/lib/payment-breakdown';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Fetch all orders for the given email
    const result = await pool.query(
      `SELECT 
        order_id,
        order_number,
        customer_name,
        customer_phone,
        customer_email,
        order_type,
        installation_address,
        city,
        state,
        pincode,
        subtotal,
        COALESCE(NULLIF(to_jsonb(orders)->>'products_total', '')::numeric, subtotal) AS products_total,
        installation_charges,
        delivery_charges,
        tax_amount,
        discount_amount,
        COALESCE(NULLIF(to_jsonb(orders)->>'referral_discount', '')::numeric, 0) AS referral_discount,
        COALESCE(NULLIF(to_jsonb(orders)->>'points_redeemed', '')::numeric, 0) AS points_redeemed,
        COALESCE(NULLIF(to_jsonb(orders)->>'amc_cost', '')::numeric, 0) AS amc_cost,
        total_amount,
        status,
        payment_method,
        payment_status,
        created_at,
        updated_at,
        expected_delivery_date,
        installation_date
      FROM orders 
      WHERE customer_email = $1
      ORDER BY created_at DESC`,
      [email]
    );

    const orders = result.rows;

    if (orders.length === 0) {
      return NextResponse.json({
        success: true,
        orders: []
      });
    }

    const orderIds = orders.map((order) => order.order_id);
    const codSettingsResult = await pool.query(
      `SELECT cod_advance_amount FROM installation_settings LIMIT 1`
    );
    const codFlatAmount = codSettingsResult.rows[0]?.cod_advance_amount || 500;

    const historyResult = await pool.query(
      `SELECT
        order_id,
        status,
        created_at
      FROM order_status_history
      WHERE order_id = ANY($1::int[])
        AND status IN ('Accepted', 'Awaiting Dealer Confirmation')
      ORDER BY created_at DESC`,
      [orderIds]
    );

    const historyByOrderId = new Map<number, Array<{ status: string; remarks: string; created_at: string }>>();

    for (const row of historyResult.rows) {
      const orderId = Number(row.order_id);
      const history = historyByOrderId.get(orderId) || [];

      let remarks = '';
      if (row.status === 'Accepted') {
        remarks = 'Your order has been accepted and is being processed.';
      } else if (row.status === 'Awaiting Dealer Confirmation') {
        remarks = 'Your order has been assigned and is awaiting confirmation.';
      }

      history.push({
        status: row.status,
        remarks,
        created_at: row.created_at,
      });
      historyByOrderId.set(orderId, history);
    }

    const progressResult = await pool.query(
      `SELECT DISTINCT ON (order_id)
        order_id,
        status_label,
        created_at
      FROM order_progress_updates
      WHERE order_id = ANY($1::int[])
      ORDER BY order_id, created_at DESC`,
      [orderIds]
    );

    const latestProgressByOrderId = new Map<number, { status_label: string; created_at: string }>();
    for (const row of progressResult.rows) {
      latestProgressByOrderId.set(Number(row.order_id), {
        status_label: row.status_label,
        created_at: row.created_at,
      });
    }

    const ordersWithHistory = orders.map((order) => {
      const paymentBreakdown = buildPaymentBreakdown({
        productsTotal: order.products_total,
        subtotal: order.subtotal,
        installationCharges: order.installation_charges,
        amcCharges: order.amc_cost,
        deliveryCharges: order.delivery_charges,
        taxAmount: order.tax_amount,
        totalAmount: order.total_amount,
        paymentMethod: order.payment_method,
        codFlatAmount,
        discountAmount: order.discount_amount,
        referralDiscount: order.referral_discount,
        pointsRedeemed: order.points_redeemed,
      });

      return {
        ...order,
        total_amount: paymentBreakdown.totalAmount,
        statusHistory: historyByOrderId.get(Number(order.order_id)) || [],
        latestProgressStatus: latestProgressByOrderId.get(Number(order.order_id))?.status_label || null,
      };
    });

    return NextResponse.json({
      success: true,
      orders: ordersWithHistory
    });

  } catch (error) {
    console.error('Error fetching orders by email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders', message: 'Database error occurred' },
      { status: 500 }
    );
  }
}
