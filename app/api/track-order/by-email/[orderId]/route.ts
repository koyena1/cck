import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { buildPaymentBreakdown } from '@/lib/payment-breakdown';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const numericOrderId = parseInt(orderId, 10);
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    if (Number.isNaN(numericOrderId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid order ID' },
        { status: 400 }
      );
    }

    const pool = getPool();

    const orderResult = await pool.query(
      `SELECT
        o.order_id,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.customer_email,
        o.order_type,
        o.installation_address,
        o.city,
        o.state,
        o.pincode,
        o.subtotal,
        COALESCE(NULLIF(to_jsonb(o)->>'products_total', '')::numeric, o.subtotal) AS products_total,
        o.installation_charges,
        o.delivery_charges,
        o.tax_amount,
        o.discount_amount,
        COALESCE(NULLIF(to_jsonb(o)->>'referral_discount', '')::numeric, 0) AS referral_discount,
        COALESCE(NULLIF(to_jsonb(o)->>'points_redeemed', '')::numeric, 0) AS points_redeemed,
        COALESCE(NULLIF(to_jsonb(o)->>'amc_cost', '')::numeric, 0) AS amc_cost,
        o.total_amount,
        COALESCE(NULLIF(to_jsonb(o)->>'advance_amount', '')::numeric, 0) AS advance_amount,
        to_jsonb(o)->>'payment_id' AS payment_id,
        o.status,
        o.payment_method,
        o.payment_status,
        o.created_at,
        o.updated_at,
        o.expected_delivery_date,
        o.installation_date
      FROM orders o
      WHERE o.order_id = $1
        AND o.customer_email = $2
      LIMIT 1`,
      [numericOrderId, email]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const statusHistoryResult = await pool.query(
      `SELECT
        status,
        COALESCE(NULLIF(TRIM(remarks), ''), 'Status updated.') AS remarks,
        created_at
      FROM order_status_history
      WHERE order_id = $1
      ORDER BY created_at DESC`,
      [numericOrderId]
    );

    const progressUpdatesResult = await pool.query(
      `SELECT
        opu.id,
        opu.status_label,
        opu.notes,
        opu.estimated_days,
        opu.is_delivery_done,
        opu.created_at,
        d.business_name AS dealer_name,
        COALESCE(d.unique_dealer_id, LPAD(d.dealer_id::TEXT, 3, '0')) AS dealer_uid
      FROM order_progress_updates opu
      LEFT JOIN dealers d ON d.dealer_id = opu.dealer_id
      WHERE opu.order_id = $1
      ORDER BY opu.created_at ASC`,
      [numericOrderId]
    );

    const codSettingsResult = await pool.query(
      `SELECT cod_advance_amount, cod_percentage
       FROM installation_settings
       LIMIT 1`
    );

    let transactionsRows: Array<{ amount: string | number; transaction_type: string }> = [];
    try {
      const transactionsResult = await pool.query(
        `SELECT amount, transaction_type
         FROM order_payment_transactions
         WHERE order_id = $1`,
        [numericOrderId]
      );
      transactionsRows = transactionsResult.rows;
    } catch {
      // Keep track-order resilient when transaction table is absent in older DB snapshots.
      transactionsRows = [];
    }

    const order = orderResult.rows[0];
    const codSettings = codSettingsResult.rows[0];

    const storedTotal = parseFloat(order.total_amount || 0);
    const productsVal = parseFloat(order.products_total || order.subtotal || 0);
    const discountVal = parseFloat(order.discount_amount || 0);
    const referralVal = parseFloat(order.referral_discount || 0);
    const pointsVal = parseFloat(order.points_redeemed || 0);
    const codPercentage = parseFloat(codSettings?.cod_percentage || 0);

    const paymentBreakdown = buildPaymentBreakdown({
      productsTotal: order.products_total,
      subtotal: order.subtotal,
      installationCharges: order.installation_charges,
      amcCharges: order.amc_cost,
      deliveryCharges: order.delivery_charges,
      taxAmount: order.tax_amount,
      totalAmount: order.total_amount,
      paymentMethod: order.payment_method,
      codFlatAmount: codSettings?.cod_advance_amount,
      discountAmount: order.discount_amount,
      referralDiscount: order.referral_discount,
      pointsRedeemed: order.points_redeemed,
    });

    const transactionsPaid = transactionsRows
      .filter((t: any) => ['payment', 'advance', 'cod_advance', 'partial_payment'].includes(t.transaction_type))
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

    const isCodAdvancePaid =
      order.payment_method === 'cod' &&
      order.payment_id &&
      String(order.payment_id).startsWith('pay_COD_ADVANCE_');

    const dbAdvancePaid = parseFloat(order.advance_amount || 0);
    const codAdvanceRequired =
      order.payment_method === 'cod' && codPercentage > 0
        ? Math.round(storedTotal * codPercentage / 100)
        : 0;

    const advancePaid =
      isCodAdvancePaid && dbAdvancePaid === 0 && codAdvanceRequired > 0
        ? codAdvanceRequired
        : dbAdvancePaid;

    const effectivePaid = Math.max(advancePaid, transactionsPaid);
    const fallbackPaid = order.payment_status === 'paid' ? storedTotal : 0;
    const totalPaidByCustomer = Math.max(effectivePaid, fallbackPaid);
    const amountPendingOnDelivery = order.payment_method === 'cod'
      ? Math.max(0, storedTotal - advancePaid)
      : 0;

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        statusHistory: statusHistoryResult.rows,
        progressUpdates: progressUpdatesResult.rows,
        paymentSummary: {
          actual_price: paymentBreakdown.actualProductPrice,
          installation_charges: paymentBreakdown.installationCharges,
          amc_charges: paymentBreakdown.amcCharges,
          delivery_charges: paymentBreakdown.deliveryCharges,
          gst_amount: paymentBreakdown.gstAmount,
          cod_extra_charges: paymentBreakdown.codExtraCharges,
          amount_already_paid: advancePaid,
          amount_pending_on_delivery: amountPendingOnDelivery,
          total_paid_by_customer: totalPaidByCustomer,
          total_amount: paymentBreakdown.totalAmount,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching order details by email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order details' },
      { status: 500 }
    );
  }
}
