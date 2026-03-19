import { getPool } from '@/lib/db';
import { createPortalNotification } from '@/lib/portal-notifications';
import { sendStockAlertEmail, type StockAlertProduct } from '@/lib/stock-alert-email';

async function ensureStockAlertStateTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealer_stock_alert_state (
      dealer_id INTEGER NOT NULL REFERENCES dealers(dealer_id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES dealer_products(id) ON DELETE CASCADE,
      current_state VARCHAR(20) NOT NULL DEFAULT 'normal',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (dealer_id, product_id)
    )
  `);
}

async function ensureAutoAlertHistoryTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS dealer_auto_alert_history (
      id SERIAL PRIMARY KEY,
      dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
      alert_type VARCHAR(50) NOT NULL,
      days_since_update INTEGER NOT NULL DEFAULT 0,
      low_stock_count INTEGER DEFAULT 0,
      out_of_stock_count INTEGER DEFAULT 0,
      alert_sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      notification_id INTEGER REFERENCES dealer_notifications(id),
      email_sent BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

type StockState = 'normal' | 'low' | 'out';

function getState(quantityAvailable: number): StockState {
  if (quantityAvailable <= 0) return 'out';
  if (quantityAvailable < 5) return 'low';
  return 'normal';
}

export async function syncDealerStockThresholdAlerts(dealerId: number) {
  try {
    await ensureStockAlertStateTable();
    await ensureAutoAlertHistoryTable();

    const pool = getPool();

    const dealerResult = await pool.query(
      `SELECT dealer_id, full_name, business_name, district, email, unique_dealer_id FROM dealers WHERE dealer_id = $1`,
      [dealerId]
    );
    if (dealerResult.rows.length === 0) return;

    const dealer = dealerResult.rows[0];
    const districtKey = dealer.district || 'all';

    // Only track products that exist in dealer inventory records.
    const stockRows = await pool.query(
      `SELECT di.product_id, COALESCE(di.quantity_available, 0) AS quantity_available, dp.model_number
       FROM dealer_inventory di
       JOIN dealer_products dp ON dp.id = di.product_id
       WHERE di.dealer_id = $1`,
      [dealerId]
    );

    const previousStateRows = await pool.query(
      `SELECT product_id, current_state FROM dealer_stock_alert_state WHERE dealer_id = $1`,
      [dealerId]
    );

    const prevMap = new Map<number, StockState>();
    for (const row of previousStateRows.rows) {
      prevMap.set(Number(row.product_id), String(row.current_state) as StockState);
    }

    const currentIds = new Set<number>();
    const triggeredProducts: Array<{ productId: number; model: string; qty: number; state: StockState }> = [];

    for (const row of stockRows.rows) {
      const productId = Number(row.product_id);
      const model = String(row.model_number || `Product-${productId}`);
      const qty = Number(row.quantity_available || 0);
      const currentState = getState(qty);
      const previousState = prevMap.get(productId) || 'normal';
      currentIds.add(productId);

      if (currentState !== previousState && (currentState === 'low' || currentState === 'out')) {
        triggeredProducts.push({
          productId,
          model,
          qty,
          state: currentState,
        });

        const isOut = currentState === 'out';
        const title = isOut ? `Out of Stock: ${model}` : `Low Stock: ${model}`;
        const message = isOut
          ? `${dealer.full_name} (${dealer.business_name || 'N/A'}) is out of stock for ${model}.`
          : `${dealer.full_name} (${dealer.business_name || 'N/A'}) has low stock (${qty}) for ${model}.`;

        await createPortalNotification({
          portal: 'admin',
          title,
          message,
          type: isOut ? 'stock_out_of_stock' : 'stock_low',
          priority: isOut ? 'high' : 'normal',
          actionUrl: '/admin/stock',
          createdBy: 'system',
          metadata: {
            dealerId,
            productId,
            model,
            quantityAvailable: qty,
            state: currentState,
          },
        });

        await createPortalNotification({
          portal: 'district',
          recipientKey: districtKey,
          title,
          message,
          type: isOut ? 'stock_out_of_stock' : 'stock_low',
          priority: isOut ? 'high' : 'normal',
          actionUrl: '/district-portal/dashboard',
          createdBy: 'system',
          metadata: {
            dealerId,
            productId,
            model,
            quantityAvailable: qty,
            state: currentState,
          },
        });
      }

      await pool.query(
        `INSERT INTO dealer_stock_alert_state (dealer_id, product_id, current_state, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (dealer_id, product_id)
         DO UPDATE SET current_state = EXCLUDED.current_state, updated_at = CURRENT_TIMESTAMP`,
        [dealerId, productId, currentState]
      );
    }

    if (triggeredProducts.length > 0 && dealer.email) {
      const productsResult = await pool.query(
        `SELECT
           dp.id AS product_id,
           dp.company,
           dp.segment,
           dp.model_number,
           dp.product_type,
           dp.dealer_purchase_price,
           COALESCE(di.quantity_available, 0) AS quantity_available,
           COALESCE(di.quantity_available, 0) * dp.dealer_purchase_price::NUMERIC AS item_stock_value
         FROM dealer_products dp
         LEFT JOIN dealer_inventory di ON di.product_id = dp.id AND di.dealer_id = $1
         WHERE dp.is_active = TRUE
           AND (COALESCE(di.quantity_available, 0) = 0 OR COALESCE(di.quantity_available, 0) < 5)
         ORDER BY COALESCE(di.quantity_available, 0) ASC, dp.company, dp.model_number`,
        [dealerId]
      );

      if (productsResult.rows.length > 0) {
        await sendStockAlertEmail({
          dealer: {
            dealerId: dealer.dealer_id,
            dealerName: dealer.full_name,
            businessName: dealer.business_name,
            email: dealer.email,
            uniqueDealerId: dealer.unique_dealer_id || null,
            district: dealer.district || null,
          },
          products: productsResult.rows as StockAlertProduct[],
          sentByRole: 'admin',
          sentByLabel: 'Automatic Stock Monitor',
          customMessage:
            'This is an automatic stock alert. You will continue receiving reminders every 5 days until you update stock.',
        });

        const outOfStockCount = productsResult.rows.filter((item) => Number(item.quantity_available) <= 0).length;
        const lowStockCount = productsResult.rows.filter(
          (item) => Number(item.quantity_available) > 0 && Number(item.quantity_available) < 5
        ).length;

        const notificationResult = await pool.query(
          `INSERT INTO dealer_notifications (dealer_id, title, message, type, priority, sent_via_email, email_sent_at, created_by)
           VALUES ($1, $2, $3, 'stock_alert_pdf', 'high', TRUE, NOW(), 'system')
           RETURNING id`,
          [
            dealerId,
            'Automatic Stock Alert Report Sent',
            'A PDF stock alert report was sent automatically for low-stock and out-of-stock products.',
          ]
        );

        const daysSinceUpdateResult = await pool.query(`SELECT get_days_since_stock_update($1) AS days_since_update`, [dealerId]);
        const daysSinceUpdate = Number(daysSinceUpdateResult.rows[0]?.days_since_update || 0);

        await pool.query(
          `INSERT INTO dealer_auto_alert_history (
             dealer_id,
             alert_type,
             days_since_update,
             low_stock_count,
             out_of_stock_count,
             notification_id,
             email_sent
           ) VALUES ($1, $2, $3, $4, $5, $6, TRUE)`,
          [
            dealerId,
            'threshold_initial',
            daysSinceUpdate,
            lowStockCount,
            outOfStockCount,
            notificationResult.rows[0].id,
          ]
        );
      }
    }

    // Clean up state rows for products no longer in inventory
    if (currentIds.size > 0) {
      await pool.query(
        `DELETE FROM dealer_stock_alert_state
         WHERE dealer_id = $1 AND product_id NOT IN (
           SELECT product_id FROM dealer_inventory WHERE dealer_id = $1
         )`,
        [dealerId]
      );
    }
  } catch (error) {
    console.error('Failed to sync dealer stock threshold alerts:', error);
  }
}
