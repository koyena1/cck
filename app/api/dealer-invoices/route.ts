import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { syncDealerStockThresholdAlerts } from '@/lib/dealer-stock-alerts';

// GET - Fetch dealer invoices
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');
    const invoiceId = searchParams.get('id');
    const invoiceNumber = searchParams.get('invoiceNumber');
    const includeFinalized = searchParams.get('includeFinalized') === 'true';

    const pool = getPool();

    // Fetch specific invoice by ID
    if (invoiceId) {
      const transactionQuery = `
        SELECT * FROM dealer_transactions
        WHERE id = $1
      `;
      const transactionResult = await pool.query(transactionQuery, [invoiceId]);

      if (transactionResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      // Get invoice items
      const itemsQuery = `
        SELECT dti.*, COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN dti.product_id IS NOT NULL THEN 'PIC' || LPAD(dti.product_id::text, 3, '0') END, 'PIC' || LPAD(dti.id::text, 3, '0')) AS product_code
        FROM dealer_transaction_items dti
        LEFT JOIN dealer_products dp ON dp.id = dti.product_id
        WHERE dti.transaction_id = $1
        ORDER BY dti.id
      `;
      const itemsResult = await pool.query(itemsQuery, [invoiceId]);

      return NextResponse.json({
        success: true,
        invoice: transactionResult.rows[0],
        items: itemsResult.rows
      });
    }

    // Fetch specific invoice by invoice number
    if (invoiceNumber) {
      const transactionQuery = `
        SELECT * FROM dealer_transactions
        WHERE invoice_number = $1
      `;
      const transactionResult = await pool.query(transactionQuery, [invoiceNumber]);

      if (transactionResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      // Get invoice items
      const itemsQuery = `
        SELECT dti.*, COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN dti.product_id IS NOT NULL THEN 'PIC' || LPAD(dti.product_id::text, 3, '0') END, 'PIC' || LPAD(dti.id::text, 3, '0')) AS product_code
        FROM dealer_transaction_items dti
        LEFT JOIN dealer_products dp ON dp.id = dti.product_id
        WHERE dti.transaction_id = $1
        ORDER BY dti.id
      `;
      const itemsResult = await pool.query(itemsQuery, [transactionResult.rows[0].id]);

      return NextResponse.json({
        success: true,
        invoice: transactionResult.rows[0],
        items: itemsResult.rows
      });
    }

    // Fetch list of invoices for a dealer
    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    let query = `
      SELECT * FROM dealer_transactions
      WHERE dealer_id = $1
    `;

    if (!includeFinalized) {
      query += ` AND is_draft = true`;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, [dealerId]);

    return NextResponse.json({
      success: true,
      invoices: result.rows
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST - Create a new draft invoice
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealerId, transactionType, items } = body;
    const sources = [...new Set((items || []).map((i: any) => i.source || 'protechtur'))];
    const txPurchaseSource = sources.length === 1 ? sources[0] : 'mixed';

    if (!dealerId || !transactionType || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID, transaction type, and items are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Generate invoice number with dealer unique ID
      const invoicePrefix = transactionType === 'purchase' ? 'P' : 'S';
      const dealerResult = await client.query(`SELECT unique_dealer_id FROM dealers WHERE dealer_id = $1`, [dealerId]);
      const uniqueDealerId = dealerResult.rows[0]?.unique_dealer_id || dealerId;
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = now.getFullYear();
      const hh = String(now.getHours()).padStart(2, '0');
      const min = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      const invoiceNumber = `${invoicePrefix}-${dd}${mm}${yyyy}-${hh}${min}${ss}-${uniqueDealerId}`;

      // Calculate totals (Include all items - both Protechtur and External)
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += parseFloat(item.totalPrice);
      }

      const gstRate = 0.18; // 18% GST
      const gstAmount = totalAmount * gstRate;
      const finalAmount = totalAmount + gstAmount;

      // Create draft invoice
      const transactionQuery = `
        INSERT INTO dealer_transactions (
          dealer_id, transaction_type, invoice_number, total_amount, gst_amount, 
          final_amount, is_draft, is_finalized, payment_status, purchase_source
        ) VALUES ($1, $2, $3, $4, $5, $6, true, false, 'draft', $7)
        RETURNING *
      `;
      const transactionResult = await client.query(transactionQuery, [
        dealerId,
        transactionType,
        invoiceNumber,
        totalAmount,
        gstAmount,
        finalAmount,
        txPurchaseSource
      ]);

      const transaction = transactionResult.rows[0];

      // Insert transaction items
      for (const item of items) {
        await client.query(`
          INSERT INTO dealer_transaction_items (
            transaction_id, product_id, product_name, model_number, quantity, unit_price, total_price, purchase_source
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `, [
          transaction.id,
          item.productId,
          item.productName,
          item.modelNumber,
          item.quantity,
          item.unitPrice,
          item.totalPrice,
          item.source || 'protechtur'
        ]);
      }

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        invoice: transaction,
        invoiceNumber: invoiceNumber
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}

// PATCH - Update invoice (edit items, finalize, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, items, finalize } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    // Use a dedicated client so BEGIN/UPDATE/COMMIT all run on the same connection
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if invoice exists and get type info
      const checkQuery = `SELECT is_finalized, transaction_type FROM dealer_transactions WHERE id = $1`;
      const checkResult = await client.query(checkQuery, [invoiceId]);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      // Allow editing even finalized invoices (for record correction)
      // Make finalize idempotent to avoid double inventory updates when already finalized.
      if (finalize && checkResult.rows[0].is_finalized && (!items || items.length === 0)) {
        await client.query('COMMIT');
        client.release();

        const invoiceQuery = `SELECT * FROM dealer_transactions WHERE id = $1`;
        const invoiceResult = await pool.query(invoiceQuery, [invoiceId]);

        const itemsQuery = `
          SELECT dti.*, COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN dti.product_id IS NOT NULL THEN 'PIC' || LPAD(dti.product_id::text, 3, '0') END, 'PIC' || LPAD(dti.id::text, 3, '0')) AS product_code
          FROM dealer_transaction_items dti
          LEFT JOIN dealer_products dp ON dp.id = dti.product_id
          WHERE dti.transaction_id = $1
        `;
        const itemsResult = await pool.query(itemsQuery, [invoiceId]);

        return NextResponse.json({
          success: true,
          invoice: invoiceResult.rows[0],
          items: itemsResult.rows,
          alreadyFinalized: true,
          message: 'Invoice is already finalized'
        });
      }

      // If updating items
      if (items && items.length > 0) {
        // Delete existing items
        await client.query(`DELETE FROM dealer_transaction_items WHERE transaction_id = $1`, [invoiceId]);

        // Calculate new totals (Include all items - both Protechtur and External)
        const txType = checkResult.rows[0].transaction_type;
        let totalAmount = 0;
        for (const item of items) {
          totalAmount += parseFloat(item.totalPrice);
        }

        const gstRate = 0.18;
        const gstAmount = totalAmount * gstRate;
        const finalAmount = totalAmount + gstAmount;

        // Update invoice totals
        await client.query(`
          UPDATE dealer_transactions
          SET total_amount = $1, gst_amount = $2, final_amount = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [totalAmount, gstAmount, finalAmount, invoiceId]);

        // Insert updated items
        for (const item of items) {
          await client.query(`
            INSERT INTO dealer_transaction_items (
              transaction_id, product_id, product_name, model_number, quantity, unit_price, total_price, purchase_source
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `, [
            invoiceId,
            item.productId,
            item.productName,
            item.modelNumber,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            item.source || 'protechtur'
          ]);
        }
      }

      // If finalizing invoice
      if (finalize) {
        const finalizeQuery = `
          UPDATE dealer_transactions
          SET is_draft = false, is_finalized = true, finalized_at = CURRENT_TIMESTAMP, payment_status = 'completed'
          WHERE id = $1
          RETURNING *
        `;
        const finalizeResult = await client.query(finalizeQuery, [invoiceId]);

        // Get invoice details for inventory update
        const invoice = finalizeResult.rows[0];
        const itemsQuery = `
          SELECT dti.*, COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN dti.product_id IS NOT NULL THEN 'PIC' || LPAD(dti.product_id::text, 3, '0') END, 'PIC' || LPAD(dti.id::text, 3, '0')) AS product_code
          FROM dealer_transaction_items dti
          LEFT JOIN dealer_products dp ON dp.id = dti.product_id
          WHERE dti.transaction_id = $1
        `;
        const itemsResult = await client.query(itemsQuery, [invoiceId]);

        // Group items by product_id to handle multiple items of same product correctly
        const productGroups = new Map();
        
        for (const item of itemsResult.rows) {
          const productId = item.product_id;
          if (!productGroups.has(productId)) {
            productGroups.set(productId, {
              product_name: item.product_name,
              total_quantity: 0,
              sources: new Set(),
              items: []
            });
          }
          
          const group = productGroups.get(productId);
          group.total_quantity += item.quantity;
          group.sources.add(item.purchase_source || 'protechtur');
          group.items.push(item);
        }
        
        // Update dealer inventory based on transaction type (one update per product)
        // NOTE: A DB trigger calculates quantity_available = quantity_purchased - quantity_sold
        // So we must update quantity_purchased/quantity_sold, NOT quantity_available directly
        for (const [productId, group] of productGroups.entries()) {
          console.log(`Processing product: ${group.product_name}, ID: ${productId}, Total Qty: ${group.total_quantity}`);
          
          if (invoice.transaction_type === 'purchase') {
            // Add to inventory
            const inventoryCheck = await client.query(
              `SELECT id, quantity_available, quantity_purchased, purchase_source FROM dealer_inventory WHERE dealer_id = $1 AND product_id = $2`,
              [invoice.dealer_id, productId]
            );

            if (inventoryCheck.rows.length > 0) {
              const currentPurchased = inventoryCheck.rows[0].quantity_purchased || 0;
              const currentAvailable = inventoryCheck.rows[0].quantity_available;
              const newPurchased = currentPurchased + group.total_quantity;
              console.log(`Updating inventory: purchased ${currentPurchased} + ${group.total_quantity} = ${newPurchased} (available will be recalculated by trigger)`);
              
              // Determine the purchase_source for the inventory record
              const currentSource = inventoryCheck.rows[0].purchase_source;
              let newSource;
              
              // If multiple sources in this purchase OR current source differs, mark as "mixed"
              if (group.sources.size > 1 || (currentSource && !group.sources.has(currentSource) && currentSource !== 'mixed')) {
                newSource = 'mixed';
              } else if (group.sources.size === 1) {
                newSource = Array.from(group.sources)[0];
              } else {
                newSource = currentSource || 'protechtur';
              }
              
              const updateResult = await client.query(`
                UPDATE dealer_inventory 
                SET quantity_purchased = quantity_purchased + $1,
                    purchase_source = $4,
                    last_purchase_date = CURRENT_TIMESTAMP
                WHERE dealer_id = $2 AND product_id = $3
                RETURNING quantity_available, quantity_purchased
              `, [group.total_quantity, invoice.dealer_id, productId, newSource]);
              
              console.log(`Updated inventory for product ${productId}: purchased=${updateResult.rows[0].quantity_purchased}, available=${updateResult.rows[0].quantity_available}`);
            } else {
              const source = group.sources.size > 1 ? 'mixed' : Array.from(group.sources)[0];
              console.log(`Creating new inventory record with quantity ${group.total_quantity}`);
              await client.query(`
                INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, quantity_sold, quantity_available, purchase_source, last_purchase_date)
                VALUES ($1, $2, $3, 0, $3, $4, CURRENT_TIMESTAMP)
              `, [invoice.dealer_id, productId, group.total_quantity, source]);
            }
          } else if (invoice.transaction_type === 'sale') {
            // Deduct from inventory - check if sufficient quantity available
            const inventoryCheck = await client.query(
              `SELECT quantity_available, quantity_sold FROM dealer_inventory WHERE dealer_id = $1 AND product_id = $2`,
              [invoice.dealer_id, productId]
            );
            
            if (inventoryCheck.rows.length === 0) {
              throw new Error(`Product ${group.product_name} not found in inventory`);
            }
            
            const currentQty = inventoryCheck.rows[0].quantity_available;
            if (currentQty < group.total_quantity) {
              throw new Error(`Insufficient quantity for ${group.product_name}. Available: ${currentQty}, Requested: ${group.total_quantity}`);
            }
            
            const saleResult = await client.query(`
              UPDATE dealer_inventory 
              SET quantity_sold = quantity_sold + $1,
                  last_sale_date = CURRENT_TIMESTAMP
              WHERE dealer_id = $2 AND product_id = $3
              RETURNING quantity_available, quantity_sold
            `, [group.total_quantity, invoice.dealer_id, productId]);
            
            console.log(`Sale: product ${productId} sold=${saleResult.rows[0].quantity_sold}, available=${saleResult.rows[0].quantity_available}`);
          }
        }
      }

      await client.query('COMMIT');
      client.release();

      // Fetch updated invoice with items
      const invoiceQuery = `SELECT * FROM dealer_transactions WHERE id = $1`;
      const invoiceResult = await pool.query(invoiceQuery, [invoiceId]);
      
      const itemsQuery = `
        SELECT dti.*, COALESCE(to_jsonb(dp)->>'product_code', CASE WHEN dti.product_id IS NOT NULL THEN 'PIC' || LPAD(dti.product_id::text, 3, '0') END, 'PIC' || LPAD(dti.id::text, 3, '0')) AS product_code
        FROM dealer_transaction_items dti
        LEFT JOIN dealer_products dp ON dp.id = dti.product_id
        WHERE dti.transaction_id = $1
      `;
      const itemsResult = await pool.query(itemsQuery, [invoiceId]);

      if (invoiceResult.rows[0]?.dealer_id) {
        await syncDealerStockThresholdAlerts(parseInt(invoiceResult.rows[0].dealer_id));
      }

      return NextResponse.json({
        success: true,
        invoice: invoiceResult.rows[0],
        items: itemsResult.rows
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update invoice'
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete a draft invoice
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('id');

    if (!invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Invoice ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if invoice is finalized
      const checkQuery = `SELECT is_finalized FROM dealer_transactions WHERE id = $1`;
      const checkResult = await client.query(checkQuery, [invoiceId]);

      if (checkResult.rows.length === 0) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      if (checkResult.rows[0].is_finalized) {
        await client.query('ROLLBACK');
        client.release();
        return NextResponse.json(
          { success: false, error: 'Cannot delete finalized invoice' },
          { status: 400 }
        );
      }

      // Delete invoice items
      await client.query(`DELETE FROM dealer_transaction_items WHERE transaction_id = $1`, [invoiceId]);

      // Delete invoice
      await client.query(`DELETE FROM dealer_transactions WHERE id = $1`, [invoiceId]);

      await client.query('COMMIT');
      client.release();

      return NextResponse.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      client.release();
      throw error;
    }
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }
}
