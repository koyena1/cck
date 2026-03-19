import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

function normalizeDistrict(value?: string | null) {
  if (!value) return '';
  return String(value).split(',')[0].trim().toLowerCase();
}

// GET - Fetch products for proforma generation for a specific month.
// Buy Product flow is stored as 'purchase', while some flows may use 'sale', so include both.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');
    const uptoDateParam = searchParams.get('uptoDate');
    const district = searchParams.get('district');

    if (!dealerId) {
      return NextResponse.json({ success: false, error: 'Dealer ID is required' }, { status: 400 });
    }

    // Default to current month/year
    const now = new Date();
    const month = monthParam ? parseInt(monthParam) : now.getMonth() + 1;
    const year = yearParam ? parseInt(yearParam) : now.getFullYear();

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ success: false, error: 'Invalid month or year' }, { status: 400 });
    }

    const pool = getPool();

    if (district) {
      const dealerScope = await pool.query(
        `SELECT district FROM dealers WHERE dealer_id = $1`,
        [dealerId]
      );

      if (dealerScope.rows.length === 0) {
        return NextResponse.json({ success: false, error: 'Dealer not found' }, { status: 404 });
      }

      if (normalizeDistrict(dealerScope.rows[0].district) !== normalizeDistrict(district)) {
        return NextResponse.json({ success: false, error: 'Access denied for this district' }, { status: 403 });
      }
    }

    // Build date range for the selected month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    const monthLastDay = new Date(year, month, 0).getDate();

    let uptoDate = `${year}-${String(month).padStart(2, '0')}-${String(monthLastDay).padStart(2, '0')}`;
    if (uptoDateParam) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(uptoDateParam)) {
        return NextResponse.json({ success: false, error: 'Invalid uptoDate format. Use YYYY-MM-DD' }, { status: 400 });
      }
      const parsedCutoff = new Date(`${uptoDateParam}T00:00:00`);
      if (Number.isNaN(parsedCutoff.getTime())) {
        return NextResponse.json({ success: false, error: 'Invalid uptoDate value' }, { status: 400 });
      }
      uptoDate = uptoDateParam;
    }

    // Get finalized transactions in the selected month from both legacy and current flows
    const result = await pool.query(`
      SELECT 
        dti.product_id,
        dti.product_name,
        dti.model_number,
        dti.quantity,
        dti.unit_price,
        dti.total_price,
        COALESCE(dp.dealer_purchase_price, dti.unit_price) AS dealer_purchase_price,
        dt.transaction_date,
        dt.invoice_number,
        dt.id as transaction_id,
        DATE(dt.transaction_date) as sale_date
      FROM dealer_transaction_items dti
      JOIN dealer_transactions dt ON dt.id = dti.transaction_id
      LEFT JOIN dealer_products dp ON dp.id = dti.product_id
      WHERE dt.dealer_id = $1
        AND dt.transaction_type IN ('purchase', 'sale')
        AND dt.is_finalized = true
        AND dt.transaction_date >= $2::date
        AND dt.transaction_date < $3::date
        AND dt.transaction_date < ($4::date + INTERVAL '1 day')
      ORDER BY dt.transaction_date DESC
    `, [dealerId, startDate, endDate, uptoDate]);

    // Group items by date
    const salesByDate: Record<string, any[]> = {};
    for (const row of result.rows) {
      const dateKey = new Date(row.sale_date).toISOString().split('T')[0];
      if (!salesByDate[dateKey]) salesByDate[dateKey] = [];
      salesByDate[dateKey].push({
        ...row,
      });
    }

    return NextResponse.json({
      success: true,
      sales: result.rows,
      salesByDate,
      totalItems: result.rows.length,
      uptoDate
    });
  } catch (error) {
    console.error('Error fetching dealer sales:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dealer sales' }, { status: 500 });
  }
}
