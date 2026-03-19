import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureOrderTaskAcceptanceColumns } from '@/lib/order-task-acceptance';

/**
 * GET /api/admin/orders/[id]
 * Returns full order details including payment info, status history,
 * allocation timeline, and dealer request history.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const pool = getPool();
    await ensureOrderTaskAcceptanceColumns(pool);
    const productCodeColumnCheck = await pool.query(
      "SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dealer_products' AND column_name = 'product_code') AS exists"
    );
    const hasProductCode = productCodeColumnCheck.rows[0]?.exists === true;
    const productCodeSelect = hasProductCode
      ? "COALESCE(resolved_dp.product_code, CASE WHEN COALESCE(oi.product_id, resolved_dp.id) IS NOT NULL THEN 'PIC' || LPAD(COALESCE(oi.product_id, resolved_dp.id)::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')) AS product_code"
      : "COALESCE(CASE WHEN COALESCE(oi.product_id, resolved_dp.id) IS NOT NULL THEN 'PIC' || LPAD(COALESCE(oi.product_id, resolved_dp.id)::text, 3, '0') END, 'PIC' || LPAD(oi.id::text, 3, '0')) AS product_code";

    // Full order row + assigned dealer info
    const orderResult = await pool.query(`
      SELECT
        o.*,
        d.unique_dealer_id        AS assigned_dealer_uid,
        d.business_name           AS assigned_dealer_name,
        d.full_name               AS assigned_dealer_full_name,
        d.phone_number            AS assigned_dealer_phone,
        d.email                   AS assigned_dealer_email,
        d.location                AS assigned_dealer_location,
        d.latitude                AS assigned_dealer_lat,
        d.longitude               AS assigned_dealer_lng,
        COALESCE(d.unique_dealer_id, LPAD(d.dealer_id::TEXT, 3, '0')) AS assigned_dealer_display_uid
      FROM orders o
      LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
      WHERE o.order_id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const order = orderResult.rows[0];

    // Payment transactions linked to this order
    const transactionsResult = await pool.query(`
      SELECT
        at.*,
        a.username AS created_by_name
      FROM account_transactions at
      LEFT JOIN admins a ON a.admin_id = at.created_by
      WHERE at.order_id = $1
      ORDER BY at.transaction_date ASC
    `, [orderId]);

    // Status history
    const statusHistoryResult = await pool.query(`
      SELECT
        osh.*,
        a.username       AS updated_by_name,
        d.business_name  AS updated_by_dealer_name
      FROM order_status_history osh
      LEFT JOIN admins a   ON a.admin_id   = osh.updated_by
      LEFT JOIN dealers d  ON d.dealer_id  = osh.updated_by_dealer
      WHERE osh.order_id = $1
      ORDER BY osh.created_at ASC
    `, [orderId]);

    // Dealer request history (who was asked, what happened)
    const dealerRequestsResult = await pool.query(`
      SELECT
        dor.*,
        d.business_name  AS dealer_name,
        d.full_name      AS dealer_full_name,
        d.phone_number   AS dealer_phone,
        COALESCE(d.unique_dealer_id, LPAD(d.dealer_id::TEXT, 3, '0')) AS dealer_display_uid
      FROM dealer_order_requests dor
      LEFT JOIN dealers d ON d.dealer_id = dor.dealer_id
      WHERE dor.order_id = $1
      ORDER BY dor.request_sequence ASC
    `, [orderId]);

    // Allocation log
    const allocationLogResult = await pool.query(`
      SELECT
        al.*,
        d.business_name AS dealer_name,
        COALESCE(d.unique_dealer_id, LPAD(d.dealer_id::TEXT, 3, '0')) AS dealer_display_uid
      FROM order_allocation_log al
      LEFT JOIN dealers d ON d.dealer_id = al.dealer_id
      WHERE al.order_id = $1
      ORDER BY al.created_at ASC
    `, [orderId]);

    // Order line items
    const orderItemsResult = await pool.query(`
      SELECT oi.id, oi.order_id, COALESCE(oi.product_id, resolved_dp.id) AS product_id, ${productCodeSelect}, oi.item_type, oi.item_name, oi.quantity, oi.unit_price, oi.total_price
      FROM order_items oi
      LEFT JOIN LATERAL (
        SELECT
          dp.id,
          to_jsonb(dp)->>'product_code' AS product_code
        FROM dealer_products dp
        WHERE dp.id = oi.product_id
           OR (
             oi.product_id IS NULL
             AND LOWER(TRIM(dp.model_number)) = LOWER(TRIM(oi.item_name))
           )
        ORDER BY CASE WHEN dp.id = oi.product_id THEN 0 ELSE 1 END, dp.id
        LIMIT 1
      ) resolved_dp ON TRUE
      WHERE order_id = $1
      ORDER BY oi.id ASC
    `, [orderId]);

    // Dealer progress updates (daily timeline)
    const progressUpdatesResult = await pool.query(
      `SELECT opu.*,
              d.business_name AS dealer_name,
              COALESCE(d.unique_dealer_id, LPAD(d.dealer_id::TEXT, 3, '0')) AS dealer_uid
       FROM order_progress_updates opu
       LEFT JOIN dealers d ON d.dealer_id = opu.dealer_id
       WHERE opu.order_id = $1
       ORDER BY opu.created_at ASC`,
      [orderId]
    );

    // COD advance settings (percentage only — flat charge is derived from stored totals)
    const codSettingsResult = await pool.query(`
      SELECT cod_advance_amount, cod_percentage FROM installation_settings LIMIT 1
    `);

    // Compute remaining balance
    const totalPaid = transactionsResult.rows
      .filter((t: any) => ['payment', 'advance', 'cod_advance', 'partial_payment'].includes(t.transaction_type))
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

    let advancePaid = parseFloat(order.advance_amount || 0);

    // Detect if COD advance was paid via Razorpay (payment_id starts with pay_COD_ADVANCE_)
    const isCodAdvancePaid =
      order.payment_method === 'cod' &&
      order.payment_id &&
      (order.payment_id as string).startsWith('pay_COD_ADVANCE_');

    const codSettings = codSettingsResult.rows[0];
    const codExtraCharge = parseFloat(codSettings?.cod_advance_amount || 0); // setting value (for info only)
    const codPercentage = parseFloat(codSettings?.cod_percentage || 0);

    // --- Derive actual COD extra from stored order data (avoids settings mismatch) ---
    const productsVal = parseFloat(order.products_total || order.subtotal || 0);
    const installationVal = parseFloat(order.installation_charges || 0);
    const amcVal = parseFloat(order.amc_cost || 0);
    const deliveryVal = parseFloat(order.delivery_charges || 0);
    const taxVal = parseFloat(order.tax_amount || 0);
    const discountVal = parseFloat(order.discount_amount || 0);
    const referralVal = parseFloat(order.referral_discount || 0);
    const pointsVal = parseFloat(order.points_redeemed || 0);
    const storedTotal = parseFloat(order.total_amount || 0);

    const baseComponents = productsVal + installationVal + amcVal + deliveryVal + taxVal - discountVal - referralVal - pointsVal;
    // derived_cod_extra = what was actually charged above the base (0 if checkout forgot to add it)
    const derivedCodExtra = (order.payment_method === 'cod' && storedTotal > baseComponents + 0.01)
      ? Math.round((storedTotal - baseComponents) * 100) / 100
      : 0;

    // COD advance required based on stored total (30% of total_amount)
    const codAdvanceRequired = (order.payment_method === 'cod' && codPercentage > 0)
      ? Math.round(storedTotal * codPercentage / 100)
      : 0;

    // If advance_amount = 0 but payment was made, recalculate from stored total
    let calculatedCodAdvance = 0;
    if (isCodAdvancePaid && advancePaid === 0 && codPercentage > 0) {
      calculatedCodAdvance = codAdvanceRequired;
      advancePaid = calculatedCodAdvance;
    }

    // Use the larger of DB advance_amount vs recalculated vs sum of payment transactions
    const effectivePaid = Math.max(advancePaid, totalPaid);
    const remainingBalance = Math.max(0, storedTotal - effectivePaid);

    return NextResponse.json({
      success: true,
      order,
      orderItems: orderItemsResult.rows,
      transactions: transactionsResult.rows,
      statusHistory: statusHistoryResult.rows,
      dealerRequests: dealerRequestsResult.rows,
      allocationLog: allocationLogResult.rows,
      progressUpdates: progressUpdatesResult.rows,
      paymentSummary: {
        total_amount: parseFloat(order.total_amount || 0),
        subtotal: parseFloat(order.subtotal || 0),
        products_total: parseFloat(order.products_total || 0),
        installation_charges: parseFloat(order.installation_charges || 0),
        delivery_charges: parseFloat(order.delivery_charges || 0),
        tax_amount: parseFloat(order.tax_amount || 0),
        discount_amount: parseFloat(order.discount_amount || 0),
        referral_discount: parseFloat(order.referral_discount || 0),
        points_redeemed: parseFloat(order.points_redeemed || 0),
        amc_cost: parseFloat(order.amc_cost || 0),
        advance_paid: advancePaid,
        transactions_paid: totalPaid,
        effective_paid: effectivePaid,
        remaining_balance: remainingBalance,
        // COD-specific
        is_cod_advance_paid: isCodAdvancePaid,
        cod_extra_charge: codExtraCharge,           // from settings (info only)
        derived_cod_extra: derivedCodExtra,          // actually charged (derived from stored total)
        cod_percentage: codPercentage,
        cod_advance_required: codAdvanceRequired,    // what should be/was collected
        cod_advance_calculated: calculatedCodAdvance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
