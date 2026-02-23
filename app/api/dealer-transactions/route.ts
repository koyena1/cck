import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch dealer transactions
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');
    const transactionType = searchParams.get('type'); // 'purchase' or 'sale'
    const transactionId = searchParams.get('id');
    const invoiceNumber = searchParams.get('invoiceNumber');
    const finalized = searchParams.get('finalized'); // 'true' to get only finalized invoices

    const pool = getPool();

    // If fetching by invoice number
    if (invoiceNumber) {
      const transactionQuery = `
        SELECT 
          dt.*,
          d.full_name as dealer_name,
          d.business_name,
          d.email,
          d.phone_number,
          d.business_address,
          d.gstin
        FROM dealer_transactions dt
        JOIN dealers d ON dt.dealer_id = d.dealer_id
        WHERE dt.invoice_number = $1
      `;
      const transactionResult = await pool.query(transactionQuery, [invoiceNumber]);

      if (transactionResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }

      // Get transaction items
      const itemsQuery = `
        SELECT * FROM dealer_transaction_items
        WHERE transaction_id = $1
        ORDER BY id
      `;
      const itemsResult = await pool.query(itemsQuery, [transactionResult.rows[0].id]);

      return NextResponse.json({
        success: true,
        transaction: transactionResult.rows[0],
        items: itemsResult.rows
      });
    }

    // If fetching a specific transaction with items
    if (transactionId) {
      const transactionQuery = `
        SELECT 
          dt.*,
          d.full_name as dealer_name,
          d.business_name,
          d.email,
          d.phone_number,
          d.business_address,
          d.gstin
        FROM dealer_transactions dt
        JOIN dealers d ON dt.dealer_id = d.dealer_id
        WHERE dt.id = $1
      `;
      const transactionResult = await pool.query(transactionQuery, [transactionId]);

      if (transactionResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }

      // Get transaction items
      const itemsQuery = `
        SELECT * FROM dealer_transaction_items
        WHERE transaction_id = $1
        ORDER BY id
      `;
      const itemsResult = await pool.query(itemsQuery, [transactionId]);

      return NextResponse.json({
        success: true,
        transaction: transactionResult.rows[0],
        items: itemsResult.rows
      });
    }

    // Fetch list of transactions
    let query = `
      SELECT 
        dt.*,
        d.full_name as dealer_name,
        d.business_name
      FROM dealer_transactions dt
      JOIN dealers d ON dt.dealer_id = d.dealer_id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (dealerId) {
      query += ` AND dt.dealer_id = $${paramIndex}`;
      params.push(dealerId);
      paramIndex++;
    }

    if (transactionType) {
      query += ` AND dt.transaction_type = $${paramIndex}`;
      params.push(transactionType);
      paramIndex++;
    }

    if (finalized === 'true') {
      query += ` AND dt.is_finalized = true`;
    }

    query += ' ORDER BY dt.created_at DESC';

    const result = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      transactions: result.rows
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST - Create a new transaction (buy or sale)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dealerId, transactionType, items, notes } = body;

    if (!dealerId || !transactionType || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID, transaction type, and items are required' },
        { status: 400 }
      );
    }

    if (transactionType !== 'purchase' && transactionType !== 'sale') {
      return NextResponse.json(
        { success: false, error: 'Transaction type must be "purchase" or "sale"' },
        { status: 400 }
      );
    }

    const pool = getPool();

    // For sales, validate dealer has sufficient inventory
    if (transactionType === 'sale') {
      for (const item of items) {
        const inventoryCheck = await pool.query(
          `SELECT quantity_available FROM dealer_inventory 
           WHERE dealer_id = $1 AND product_id = $2`,
          [dealerId, item.productId]
        );

        const availableQty = inventoryCheck.rows[0]?.quantity_available || 0;
        if (availableQty < item.quantity) {
          return NextResponse.json({
            success: false,
            error: `Insufficient stock for ${item.productName}. Available: ${availableQty}, Requested: ${item.quantity}`
          }, { status: 400 });
        }
      }
    }

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

      // Create transaction with pending payment status
      const transactionQuery = `
        INSERT INTO dealer_transactions (
          dealer_id, transaction_type, invoice_number, total_amount, gst_amount, final_amount, notes, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      `;
      const transactionResult = await pool.query(transactionQuery, [
        dealerId,
        transactionType,
        invoiceNumber,
        totalAmount,
        gstAmount,
        finalAmount,
        notes || ''
      ]);

      const transaction = transactionResult.rows[0];

      // Insert transaction items and update dealer inventory
      for (const item of items) {
        // Insert transaction item
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

        // Note: Inventory updates are deferred until payment is verified
        // This prevents inventory changes for unpaid transactions
      }

      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        transaction: transaction,
        invoiceNumber: invoiceNumber
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create transaction' },
      { status: 500 }
    );
  }
}

// PATCH - Update transaction status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, paymentStatus, paymentMethod } = body;

    if (!transactionId || !paymentStatus) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID and payment status are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const query = `
      UPDATE dealer_transactions
      SET payment_status = $1, payment_method = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(query, [paymentStatus, paymentMethod || null, transactionId]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      transaction: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}
