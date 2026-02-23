import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

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
        SELECT * FROM dealer_transaction_items
        WHERE transaction_id = $1
        ORDER BY id
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
        SELECT * FROM dealer_transaction_items
        WHERE transaction_id = $1
        ORDER BY id
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

    if (!dealerId || !transactionType || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID, transaction type, and items are required' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Generate invoice number
      const invoicePrefix = transactionType === 'purchase' ? 'DP' : 'DS';
      const timestamp = Date.now();
      const invoiceNumber = `${invoicePrefix}-${dealerId}-${timestamp}`;

      // Calculate totals
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
          final_amount, is_draft, is_finalized, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, true, false, 'draft')
        RETURNING *
      `;
      const transactionResult = await pool.query(transactionQuery, [
        dealerId,
        transactionType,
        invoiceNumber,
        totalAmount,
        gstAmount,
        finalAmount
      ]);

      const transaction = transactionResult.rows[0];

      // Insert transaction items
      for (const item of items) {
        await pool.query(`
          INSERT INTO dealer_transaction_items (
            transaction_id, product_id, product_name, model_number, quantity, unit_price, total_price
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [
          transaction.id,
          item.productId,
          item.productName,
          item.modelNumber,
          item.quantity,
          item.unitPrice,
          item.totalPrice
        ]);
      }

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        invoice: transaction,
        invoiceNumber: invoiceNumber
      });
    } catch (error) {
      await pool.query('ROLLBACK');
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

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Check if invoice is already finalized
      const checkQuery = `SELECT is_finalized FROM dealer_transactions WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [invoiceId]);

      if (checkResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      if (checkResult.rows[0].is_finalized) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Cannot edit finalized invoice' },
          { status: 400 }
        );
      }

      // If updating items
      if (items && items.length > 0) {
        // Delete existing items
        await pool.query(`DELETE FROM dealer_transaction_items WHERE transaction_id = $1`, [invoiceId]);

        // Calculate new totals
        let totalAmount = 0;
        for (const item of items) {
          totalAmount += parseFloat(item.totalPrice);
        }

        const gstRate = 0.18;
        const gstAmount = totalAmount * gstRate;
        const finalAmount = totalAmount + gstAmount;

        // Update invoice totals
        await pool.query(`
          UPDATE dealer_transactions
          SET total_amount = $1, gst_amount = $2, final_amount = $3, updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [totalAmount, gstAmount, finalAmount, invoiceId]);

        // Insert updated items
        for (const item of items) {
          await pool.query(`
            INSERT INTO dealer_transaction_items (
              transaction_id, product_id, product_name, model_number, quantity, unit_price, total_price
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          `, [
            invoiceId,
            item.productId,
            item.productName,
            item.modelNumber,
            item.quantity,
            item.unitPrice,
            item.totalPrice
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
        const finalizeResult = await pool.query(finalizeQuery, [invoiceId]);

        // Get invoice details for inventory update
        const invoice = finalizeResult.rows[0];
        const itemsQuery = `SELECT * FROM dealer_transaction_items WHERE transaction_id = $1`;
        const itemsResult = await pool.query(itemsQuery, [invoiceId]);

        // Update dealer inventory based on transaction type
        for (const item of itemsResult.rows) {
          if (invoice.transaction_type === 'purchase') {
            // Add to inventory
            const inventoryCheck = await pool.query(
              `SELECT id FROM dealer_inventory WHERE dealer_id = $1 AND product_id = $2`,
              [invoice.dealer_id, item.product_id]
            );

            if (inventoryCheck.rows.length > 0) {
              await pool.query(`
                UPDATE dealer_inventory 
                SET quantity_available = quantity_available + $1,
                    updated_at = CURRENT_TIMESTAMP
                WHERE dealer_id = $2 AND product_id = $3
              `, [item.quantity, invoice.dealer_id, item.product_id]);
            } else {
              await pool.query(`
                INSERT INTO dealer_inventory (dealer_id, product_id, quantity_available)
                VALUES ($1, $2, $3)
              `, [invoice.dealer_id, item.product_id, item.quantity]);
            }
          } else if (invoice.transaction_type === 'sale') {
            // Deduct from inventory
            await pool.query(`
              UPDATE dealer_inventory 
              SET quantity_available = quantity_available - $1,
                  updated_at = CURRENT_TIMESTAMP
              WHERE dealer_id = $2 AND product_id = $3
            `, [item.quantity, invoice.dealer_id, item.product_id]);
          }
        }
      }

      await pool.query('COMMIT');

      // Fetch updated invoice with items
      const invoiceQuery = `SELECT * FROM dealer_transactions WHERE id = $1`;
      const invoiceResult = await pool.query(invoiceQuery, [invoiceId]);
      
      const itemsQuery = `SELECT * FROM dealer_transaction_items WHERE transaction_id = $1`;
      const itemsResult = await pool.query(itemsQuery, [invoiceId]);

      return NextResponse.json({
        success: true,
        invoice: invoiceResult.rows[0],
        items: itemsResult.rows
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update invoice' },
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

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Check if invoice is finalized
      const checkQuery = `SELECT is_finalized FROM dealer_transactions WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [invoiceId]);

      if (checkResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Invoice not found' },
          { status: 404 }
        );
      }

      if (checkResult.rows[0].is_finalized) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Cannot delete finalized invoice' },
          { status: 400 }
        );
      }

      // Delete invoice items
      await pool.query(`DELETE FROM dealer_transaction_items WHERE transaction_id = $1`, [invoiceId]);

      // Delete invoice
      await pool.query(`DELETE FROM dealer_transactions WHERE id = $1`, [invoiceId]);

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Invoice deleted successfully'
      });
    } catch (error) {
      await pool.query('ROLLBACK');
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
