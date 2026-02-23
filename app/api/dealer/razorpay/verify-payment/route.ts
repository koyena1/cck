import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      invoice_number 
    } = await request.json();

    const pool = getPool();

    // Verify signature
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return NextResponse.json(
        { success: false, error: 'Razorpay secret not configured' },
        { status: 500 }
      );
    }

    // Verify payment signature
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Update transaction in database
    await pool.query('BEGIN');
    
    try {
      const updateResult = await pool.query(
        `UPDATE dealer_transactions 
         SET payment_status = $1, 
             razorpay_payment_id = $2,
             razorpay_order_id = $3,
             razorpay_signature = $4,
             payment_method = 'razorpay',
             updated_at = NOW()
         WHERE invoice_number = $5
         RETURNING id, dealer_id, transaction_type, invoice_number, final_amount, transaction_date`,
        ['completed', razorpay_payment_id, razorpay_order_id, razorpay_signature, invoice_number]
      );

      if (updateResult.rows.length === 0) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        );
      }

      const transaction = updateResult.rows[0];
      
      // Get transaction items
      const itemsResult = await pool.query(
        `SELECT * FROM dealer_transaction_items WHERE transaction_id = $1`,
        [transaction.id]
      );
      
      // Update dealer inventory based on transaction type
      for (const item of itemsResult.rows) {
        if (transaction.transaction_type === 'purchase') {
          // Check if dealer already has this product in inventory
          const existingInventory = await pool.query(
            `SELECT id FROM dealer_inventory WHERE dealer_id = $1 AND product_id = $2`,
            [transaction.dealer_id, item.product_id]
          );

          if (existingInventory.rows.length > 0) {
            // Update existing inventory
            await pool.query(`
              UPDATE dealer_inventory 
              SET quantity_purchased = quantity_purchased + $1,
                  last_purchase_date = CURRENT_TIMESTAMP
              WHERE dealer_id = $2 AND product_id = $3
            `, [item.quantity, transaction.dealer_id, item.product_id]);
          } else {
            // Create new inventory record
            await pool.query(`
              INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, last_purchase_date)
              VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
            `, [transaction.dealer_id, item.product_id, item.quantity]);
          }
        } else {
          // Sale - reduce inventory
          await pool.query(`
            UPDATE dealer_inventory 
            SET quantity_sold = quantity_sold + $1,
                last_sale_date = CURRENT_TIMESTAMP
            WHERE dealer_id = $2 AND product_id = $3
          `, [item.quantity, transaction.dealer_id, item.product_id]);
        }
      }
      
      await pool.query('COMMIT');

      console.log('✅ Dealer payment verified successfully');
      console.log('✅ Inventory updated');
      console.log('Transaction ID:', transaction.id);
      console.log('Invoice:', transaction.invoice_number);

      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        transaction: transaction,
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (error: any) {
    console.error('Dealer payment verification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
