import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { syncDealerStockThresholdAlerts } from '@/lib/dealer-stock-alerts';

// GET - Fetch dealer inventory
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');

    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const overridesTableCheck = await pool.query(
      "SELECT to_regclass('public.dealer_product_pricing_overrides') IS NOT NULL AS exists"
    );
    const hasPricingOverrides = overridesTableCheck.rows[0]?.exists === true;
    const purchasePriceExpr = hasPricingOverrides
      ? 'COALESCE(dpo.dealer_purchase_price, dp.dealer_purchase_price)'
      : 'dp.dealer_purchase_price';
    const salePriceExpr = hasPricingOverrides
      ? 'COALESCE(dpo.dealer_sale_price, dp.dealer_sale_price)'
      : 'dp.dealer_sale_price';
    const pricingJoin = hasPricingOverrides
      ? 'LEFT JOIN dealer_product_pricing_overrides dpo ON dpo.product_id = dp.id AND dpo.dealer_id = $1'
      : '';

    // Fetch all dealer products with inventory details (show all products even if dealer hasn't purchased them yet)
    const query = `
      SELECT 
        di.id,
        $1::INTEGER as dealer_id,
        dp.id as product_id,
        COALESCE(to_jsonb(dp)->>'product_code', 'PIC' || LPAD(dp.id::text, 3, '0')) AS product_code,
        dp.company,
        dp.segment,
        dp.model_number,
        dp.product_type,
        dp.description,
        ${purchasePriceExpr} as dealer_purchase_price,
        ${salePriceExpr} as dealer_sale_price,
        COALESCE(di.quantity_purchased, 0) as quantity_purchased,
        COALESCE(di.quantity_sold, 0) as quantity_sold,
        COALESCE(di.quantity_available, 0) as quantity_available,
        di.last_purchase_date,
        di.last_sale_date,
        COALESCE(di.purchase_source, 'protechtur') as purchase_source,
        COALESCE(di.created_at, CURRENT_TIMESTAMP) as created_at,
        COALESCE(di.updated_at, CURRENT_TIMESTAMP) as updated_at
      FROM dealer_products dp
      ${pricingJoin}
      LEFT JOIN dealer_inventory di ON di.product_id = dp.id AND di.dealer_id = $1
      WHERE dp.is_active = true
      ORDER BY dp.company, dp.model_number
    `;

    const result = await pool.query(query, [dealerId]);

    return NextResponse.json({
      success: true,
      inventory: result.rows
    });
  } catch (error) {
    console.error('Error fetching dealer inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dealer inventory' },
      { status: 500 }
    );
  }
}

// POST - Update dealer inventory (for manual stock adjustments)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inventoryId, productId, action, dealerId } = body;

    if ((!inventoryId && !productId) || !action || !dealerId) {
      return NextResponse.json(
        { success: false, error: 'Inventory ID or Product ID, action, and dealer ID are required' },
        { status: 400 }
      );
    }

    if (action !== 'increase' && action !== 'decrease') {
      return NextResponse.json(
        { success: false, error: 'Action must be "increase" or "decrease"' },
        { status: 400 }
      );
    }

    const pool = getPool();
    let result;

    // If no inventoryId but productId provided, this is a new product for the dealer
    if (!inventoryId && productId) {
      if (action === 'decrease') {
        return NextResponse.json(
          { success: false, error: 'Cannot decrease stock for a product not in inventory' },
          { status: 400 }
        );
      }

      // Create new inventory record
      const createQuery = `
        INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, quantity_sold, last_purchase_date)
        VALUES ($1, $2, 1, 0, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      result = await pool.query(createQuery, [dealerId, productId]);

      await syncDealerStockThresholdAlerts(parseInt(dealerId));

      return NextResponse.json({
        success: true,
        inventory: result.rows[0],
        message: 'Stock added successfully'
      });
    }

    // Existing inventory record - verify it belongs to dealer
    const verifyQuery = `SELECT * FROM dealer_inventory WHERE id = $1 AND dealer_id = $2`;
    const verifyResult = await pool.query(verifyQuery, [inventoryId, dealerId]);

    if (verifyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Inventory item not found or does not belong to dealer' },
        { status: 404 }
      );
    }

    const currentInventory = verifyResult.rows[0];

    // Update inventory based on action
    let updateQuery: string;
    let queryParams: any[];

    if (action === 'increase') {
      // Increase means dealer received new stock (purchase)
      updateQuery = `
        UPDATE dealer_inventory
        SET quantity_purchased = quantity_purchased + 1,
            last_purchase_date = CURRENT_TIMESTAMP
        WHERE id = $1 AND dealer_id = $2
        RETURNING *
      `;
      queryParams = [inventoryId, dealerId];
    } else {
      // Decrease means dealer sold stock
      // Check if there's available quantity to sell
      if (currentInventory.quantity_available <= 0) {
        return NextResponse.json(
          { success: false, error: 'No available quantity to decrease' },
          { status: 400 }
        );
      }

      updateQuery = `
        UPDATE dealer_inventory
        SET quantity_sold = quantity_sold + 1,
            last_sale_date = CURRENT_TIMESTAMP
        WHERE id = $1 AND dealer_id = $2
        RETURNING *
      `;
      queryParams = [inventoryId, dealerId];
    }

    result = await pool.query(updateQuery, queryParams);

    await syncDealerStockThresholdAlerts(parseInt(dealerId));

    // Auto-resolve admin urgency flag if stock is now adequate (>= 5 units)
    if (action === 'increase') {
      const updated = result.rows[0];
      const newQty: number = updated.quantity_available ?? (updated.quantity_purchased - updated.quantity_sold);
      if (newQty >= 5) {
        const activeFlag = await pool.query(
          `UPDATE admin_stock_urgency_flags
           SET is_active = FALSE, resolved_at = NOW()
           WHERE dealer_id = $1 AND product_id = $2 AND is_active = TRUE
           RETURNING product_id`,
          [dealerId, updated.product_id]
        );
        if (activeFlag.rowCount && activeFlag.rowCount > 0) {
          const prodRes = await pool.query(
            `SELECT model_number FROM dealer_products WHERE id = $1`,
            [updated.product_id]
          );
          if (prodRes.rows.length > 0) {
            const notifTitle = `Stock Alert: ${prodRes.rows[0].model_number}`;
            await pool.query(
              `DELETE FROM dealer_notifications WHERE dealer_id = $1 AND type = 'stock_urgent_flag' AND title = $2`,
              [dealerId, notifTitle]
            );
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      inventory: result.rows[0],
      message: action === 'increase' ? 'Stock increased successfully' : 'Stock decreased successfully'
    });
  } catch (error) {
    console.error('Error updating dealer inventory:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update dealer inventory' },
      { status: 500 }
    );
  }
}
