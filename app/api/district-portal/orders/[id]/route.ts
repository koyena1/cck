import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureOrderTaskAcceptanceColumns } from '@/lib/order-task-acceptance';

/**
 * GET /api/district-portal/orders/[id]?district=<district>
 * Returns full order details for a district manager.
 * Access is restricted: the order's installation pincode must map to the given district
 * (via pincode_master lookup). This ensures filtering by customer location, not dealer location.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id);
    if (isNaN(orderId)) {
      return NextResponse.json({ success: false, error: 'Invalid order ID' }, { status: 400 });
    }

    const district = new URL(request.url).searchParams.get('district');
    if (!district || !district.trim()) {
      return NextResponse.json({ success: false, error: 'District parameter is required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureOrderTaskAcceptanceColumns(pool);

    // ── District access check ───────────────────────────────────────────────
    // Allow access if either:
    // 1) order installation pincode maps to district, or
    // 2) assigned dealer belongs to district (fallback when pincode mapping is missing).
    const accessCheck = await pool.query(
      `SELECT 1
       FROM orders o
       LEFT JOIN pincode_master pm ON pm.pincode = o.pincode
       LEFT JOIN dealers d ON d.dealer_id = o.assigned_dealer_id
       WHERE o.order_id = $1
         AND (
           LOWER(TRIM(COALESCE(pm.district, ''))) = LOWER(TRIM($2))
           OR LOWER(TRIM(COALESCE(d.district, ''))) = LOWER(TRIM($2))
         )
       LIMIT 1`,
      [orderId, district]
    );

    if (accessCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not in your district' },
        { status: 403 }
      );
    }

    // ── Full order row + assigned dealer info ───────────────────────────────
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

    // ── Payment transactions ────────────────────────────────────────────────
    const transactionsResult = await pool.query(`
      SELECT
        at.*,
        a.username AS created_by_name
      FROM account_transactions at
      LEFT JOIN admins a ON a.admin_id = at.created_by
      WHERE at.order_id = $1
      ORDER BY at.transaction_date ASC
    `, [orderId]);

    // ── Status history ──────────────────────────────────────────────────────
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

    // ── Dealer request history ──────────────────────────────────────────────
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

    // ── Allocation log ──────────────────────────────────────────────────────
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

    // ── Order line items ────────────────────────────────────────────────────
    const orderItemsResult = await pool.query(`
      SELECT oi.id, oi.order_id, COALESCE(oi.product_id, resolved_dp.id) AS product_id,
             COALESCE(
               resolved_dp.product_code,
               CASE
                 WHEN COALESCE(oi.product_id, resolved_dp.id) IS NOT NULL
                 THEN 'PIC' || LPAD(COALESCE(oi.product_id, resolved_dp.id)::text, 3, '0')
               END,
               'PIC' || LPAD(oi.id::text, 3, '0')
             ) AS product_code,
             oi.item_type, oi.item_name, oi.quantity, oi.unit_price, oi.total_price
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

    // ── Dealer progress updates ─────────────────────────────────────────────
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

    // ── COD advance settings ────────────────────────────────────────────────
    const codSettingsResult = await pool.query(`
      SELECT cod_advance_amount, cod_percentage FROM installation_settings LIMIT 1
    `);

    // ── Payment calculations ────────────────────────────────────────────────
    const totalPaid = transactionsResult.rows
      .filter((t: any) => ['payment', 'advance', 'cod_advance', 'partial_payment'].includes(t.transaction_type))
      .reduce((sum: number, t: any) => sum + parseFloat(t.amount || 0), 0);

    let advancePaid = parseFloat(order.advance_amount || 0);

    const isCodAdvancePaid =
      order.payment_method === 'cod' &&
      order.payment_id &&
      (order.payment_id as string).startsWith('pay_COD_ADVANCE_');

    const codSettings = codSettingsResult.rows[0];
    const codExtraCharge = parseFloat(codSettings?.cod_advance_amount || 0);
    const codPercentage = parseFloat(codSettings?.cod_percentage || 0);

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
    const derivedCodExtra = (order.payment_method === 'cod' && storedTotal > baseComponents + 0.01)
      ? Math.round((storedTotal - baseComponents) * 100) / 100
      : 0;

    const codAdvanceRequired = (order.payment_method === 'cod' && codPercentage > 0)
      ? Math.round(storedTotal * codPercentage / 100)
      : 0;

    let calculatedCodAdvance = 0;
    if (isCodAdvancePaid && advancePaid === 0 && codPercentage > 0) {
      calculatedCodAdvance = codAdvanceRequired;
      advancePaid = calculatedCodAdvance;
    }

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
        total_amount: storedTotal,
        subtotal: parseFloat(order.subtotal || 0),
        products_total: parseFloat(order.products_total || 0),
        installation_charges: installationVal,
        delivery_charges: deliveryVal,
        tax_amount: taxVal,
        discount_amount: discountVal,
        referral_discount: referralVal,
        points_redeemed: pointsVal,
        amc_cost: amcVal,
        advance_paid: advancePaid,
        transactions_paid: totalPaid,
        effective_paid: effectivePaid,
        remaining_balance: remainingBalance,
        is_cod_advance_paid: isCodAdvancePaid,
        cod_extra_charge: codExtraCharge,
        derived_cod_extra: derivedCodExtra,
        cod_percentage: codPercentage,
        cod_advance_required: codAdvanceRequired,
        cod_advance_calculated: calculatedCodAdvance,
      },
    });
  } catch (error: any) {
    console.error('Error fetching district order details:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
