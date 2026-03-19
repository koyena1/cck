require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
  // Run the exact query from app/api/admin/stock/[dealerId]/route.ts for dealer 8 (Raaj)
  const dealerId = 8;
  try {
    const result = await pool.query(`
      SELECT
        dp.id AS product_id,
        dp.company,
        dp.segment,
        dp.model_number,
        dp.product_type,
        dp.description,
        dp.dealer_purchase_price,
        COALESCE(di.quantity_available, 0) AS quantity_available,
        COALESCE(di.quantity_purchased, 0) AS quantity_purchased,
        COALESCE(di.quantity_sold, 0) AS quantity_sold,
        di.updated_at AS last_updated,
        COALESCE(di.quantity_available, 0) * dp.dealer_purchase_price::NUMERIC AS item_stock_value,
        asuf.flag_type,
        asuf.note AS flag_note,
        asuf.flagged_at,
        asuf.is_active AS is_flagged
      FROM dealer_products dp
      LEFT JOIN dealer_inventory di ON di.product_id = dp.id AND di.dealer_id = $1
      LEFT JOIN admin_stock_urgency_flags asuf ON asuf.product_id = dp.id AND asuf.dealer_id = $1 AND asuf.is_active = TRUE
      WHERE dp.is_active = TRUE
      ORDER BY dp.company, dp.model_number
    `, [dealerId]);

    console.log(`=== Detail API result for dealer ${dealerId} ===`);
    result.rows.forEach(r => {
      console.log(`  ${r.model_number} | qty_avail:${r.quantity_available} | value:${r.item_stock_value} | di_joined:${r.last_updated ? 'YES' : 'NO (no inv row)'}`);
    });

    // Also directly check dealer_inventory for dealer 8
    const inv = await pool.query(`SELECT di.*, dp.model_number FROM dealer_inventory di JOIN dealer_products dp ON dp.id=di.product_id WHERE di.dealer_id=$1 ORDER BY dp.model_number`, [dealerId]);
    console.log(`\n=== Raw dealer_inventory rows for dealer ${dealerId} ===`);
    inv.rows.forEach(r => console.log(`  ${r.model_number} | qty_avail:${r.quantity_available} | qty_purch:${r.quantity_purchased}`));

    // Check if quantity_available column may be null/zeroed
    const raw = await pool.query(`SELECT id, dealer_id, product_id, quantity_available, quantity_purchased, quantity_sold FROM dealer_inventory WHERE dealer_id=$1`, [dealerId]);
    console.log(`\n=== Raw column types/values ===`);
    raw.rows.forEach(r => console.log(`  product_id:${r.product_id} | qa:${r.quantity_available} (${typeof r.quantity_available}) | qp:${r.quantity_purchased}`));

  } catch(e) {
    console.error('ERROR:', e.message);
    console.error(e.stack);
  }
  await pool.end();
}
test();
