import type { Pool } from 'pg';

type OrderLike = {
  order_id?: number | string | null;
  order_number?: string | null;
  assigned_dealer_id?: number | string | null;
  dealer_id?: number | string | null;
  dealer_unique_id?: string | null;
  created_at?: string | Date | null;
};

function pad(value: number | string, length: number) {
  return String(value).padStart(length, '0');
}

export function formatOrderDateDDMMYYYY(dateValue: string | Date | null | undefined) {
  const date = dateValue ? new Date(dateValue) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  return `${pad(safeDate.getDate(), 2)}${pad(safeDate.getMonth() + 1, 2)}${safeDate.getFullYear()}`;
}

export function formatFinancialYear(dateValue: string | Date | null | undefined) {
  const date = dateValue ? new Date(dateValue) : new Date();
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date;
  const year = safeDate.getFullYear();
  const startYear = safeDate.getMonth() >= 3 ? year : year - 1;
  return `${String(startYear).slice(-2)}${String(startYear + 1).slice(-2)}`;
}

export function formatCustomerOrderNumber(
  dealerId: number | string | null | undefined,
  dateValue: string | Date | null | undefined,
  serial: number | string
) {
  const dealerPart = dealerId ? String(dealerId).trim() : 'NA';
  return `${dealerPart}-${formatOrderDateDDMMYYYY(dateValue)}-${pad(serial, 3)}`;
}

export function getLegacyOrderSerial(orderNumber: string | null | undefined, orderId: number | string | null | undefined) {
  const text = String(orderNumber || '');
  const newFormatMatch = text.match(/^[^-]+-\d{8}-(\d{3,})$/);
  if (newFormatMatch) return Number(newFormatMatch[1]);

  const legacyMatch = text.match(/^PR-\d{6,8}-(\d+)(?:-[^-]+)?$/);
  if (legacyMatch) return Number(legacyMatch[1]);

  const numericOrderId = Number(orderId);
  return Number.isFinite(numericOrderId) && numericOrderId > 0 ? numericOrderId : 1;
}

export function buildOrderNumberFromOrder(order: OrderLike) {
  const dealerId = order.dealer_unique_id || order.assigned_dealer_id || order.dealer_id || null;
  const serial = getLegacyOrderSerial(order.order_number, order.order_id);
  return formatCustomerOrderNumber(dealerId, order.created_at, serial);
}

export async function updateOrderNumberForDealer(pool: Pool, orderId: number | string, dealerId: number | string | null) {
  if (!dealerId) return null;

  const result = await pool.query(
    `
      WITH target_order AS (
        SELECT order_id, order_number, created_at
        FROM orders
        WHERE order_id = $1
      ),
      target_dealer AS (
        SELECT dealer_id, unique_dealer_id
        FROM dealers
        WHERE dealer_id = $2
      )
      UPDATE orders o
      SET order_number = COALESCE(NULLIF(target_dealer.unique_dealer_id, ''), target_dealer.dealer_id::TEXT) || '-' ||
        TO_CHAR(target_order.created_at, 'DDMMYYYY') || '-' ||
        LPAD(
          COALESCE(
            SUBSTRING(target_order.order_number FROM '^[^-]+-[0-9]{8}-([0-9]+)$'),
            SUBSTRING(target_order.order_number FROM '^PR-[0-9]{6,8}-([0-9]+)(?:-[^-]+)?$'),
            target_order.order_id::TEXT
          ),
          3,
          '0'
        ),
        updated_at = NOW()
      FROM target_order, target_dealer
      WHERE o.order_id = target_order.order_id
      RETURNING o.order_number
    `,
    [orderId, dealerId]
  );

  return result.rows[0]?.order_number || null;
}

async function ensureCustomerInvoiceNumberTable(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS customer_invoice_numbers (
      id SERIAL PRIMARY KEY,
      order_id INTEGER NOT NULL UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE,
      fiscal_year VARCHAR(4) NOT NULL,
      serial INTEGER NOT NULL,
      invoice_number VARCHAR(30) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_customer_invoice_numbers_year_serial
    ON customer_invoice_numbers(fiscal_year, serial)
  `);
}

export async function getOrCreateCustomerInvoiceNumber(pool: Pool, order: OrderLike) {
  const orderId = Number(order.order_id);
  if (!Number.isFinite(orderId) || orderId <= 0) {
    return `PR-${formatFinancialYear(order.created_at)}-NA`;
  }

  await ensureCustomerInvoiceNumberTable(pool);
  const fiscalYear = formatFinancialYear(order.created_at);

  const existing = await pool.query(
    'SELECT invoice_number FROM customer_invoice_numbers WHERE order_id = $1',
    [orderId]
  );
  if (existing.rows[0]?.invoice_number) return existing.rows[0].invoice_number;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const inserted = await pool.query(
        `
          WITH next_invoice AS (
            SELECT COALESCE(MAX(serial), 0) + 1 AS serial
            FROM customer_invoice_numbers
            WHERE fiscal_year = $2
          )
          INSERT INTO customer_invoice_numbers (order_id, fiscal_year, serial, invoice_number)
          SELECT $1, $2, serial, 'PR-' || $2 || '-' || LPAD(serial::TEXT, 4, '0')
          FROM next_invoice
          ON CONFLICT (order_id) DO UPDATE SET order_id = EXCLUDED.order_id
          RETURNING invoice_number
        `,
        [orderId, fiscalYear]
      );
      return inserted.rows[0].invoice_number;
    } catch (error: any) {
      if (error?.code !== '23505' || attempt === 2) throw error;
    }
  }

  const fallback = await pool.query(
    'SELECT invoice_number FROM customer_invoice_numbers WHERE order_id = $1',
    [orderId]
  );
  return fallback.rows[0]?.invoice_number || `PR-${fiscalYear}-NA`;
}
