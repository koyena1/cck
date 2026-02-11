import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const orderData = await request.json();
    const pool = getPool();

    const {
      customerName,
      email,
      phone,
      address,
      city,
      state,
      pinCode,
      landmark,
      products,
      productsTotal,
      withInstallation,
      installationCost,
      withAmc,
      amcDetails,
      amcCost,
      totalAmount,
      paymentMethod,
      status,
      // Referral and rewards
      referralCode,
      referralDiscount,
      pointsRedeemed,
    } = orderData;

    // Start transaction
    await pool.query('BEGIN');

    try {
      // Check if referral columns exist in the database (for backward compatibility)
      let referralColumnsExist = false;
      try {
        const columnCheck = await pool.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'orders' 
          AND column_name IN ('referral_code_used', 'referral_discount', 'points_redeemed', 'is_first_order')
        `);
        referralColumnsExist = columnCheck.rows.length === 4;
      } catch (err) {
        console.log('Could not check for referral columns:', err);
      }

      // Check if this is the first order for this customer
      let isFirstOrder = false;
      if (email) {
        const orderCountResult = await pool.query(
          'SELECT COUNT(*) as order_count FROM orders WHERE customer_email = $1',
          [email]
        );
        isFirstOrder = parseInt(orderCountResult.rows[0].order_count) === 0;
      }

      // If referral code is provided, create pending referral transaction
      if (referralCode && email && isFirstOrder && referralColumnsExist) {
        try {
          // Get referrer and referred customer IDs
          const referrerResult = await pool.query(
            'SELECT customer_id FROM customers WHERE referral_id = $1',
            [referralCode]
          );

          const referredResult = await pool.query(
            'SELECT customer_id FROM customers WHERE email = $1',
            [email]
          );

          if (referrerResult.rows.length > 0 && referredResult.rows.length > 0) {
            const referrerId = referrerResult.rows[0].customer_id;
            const referredId = referredResult.rows[0].customer_id;

            // Create pending referral transaction
            await pool.query(
              `INSERT INTO referral_transactions 
              (referrer_customer_id, referred_customer_id, referral_code, referrer_reward, referred_discount, status)
              VALUES ($1, $2, $3, $4, $5, 'pending')`,
              [referrerId, referredId, referralCode, 100, referralDiscount || 50]
            );
          }
        } catch (err) {
          console.log('Could not create referral transaction:', err);
          // Continue with order creation even if referral fails
        }
      }

      // Insert order - with or without referral columns based on what exists
      let query, values;
      
      if (referralColumnsExist) {
        // Include referral columns
        query = `
          INSERT INTO orders (
            customer_name,
            customer_phone,
            customer_email,
            order_type,
            installation_address,
            pincode,
            city,
            state,
            landmark,
            products,
            products_total,
            includes_installation,
            installation_charges,
            with_amc,
            amc_details,
            amc_cost,
            total_amount,
            payment_method,
            payment_status,
            status,
            referral_code_used,
            referral_discount,
            points_redeemed,
            is_first_order,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, NOW(), NOW())
          RETURNING *
        `;

        values = [
          customerName,
          phone,
          email,
          'product_cart',
          address,
          pinCode,
          city,
          state,
          landmark || null,
          JSON.stringify(products),
          productsTotal,
          withInstallation,
          installationCost || 0,
          withAmc || false,
          amcDetails ? JSON.stringify(amcDetails) : null,
          amcCost || 0,
          totalAmount,
          paymentMethod,
          paymentMethod === 'cod' ? 'Pending' : 'Pending',
          status || 'Pending',
          referralCode || null,
          referralDiscount || 0,
          pointsRedeemed || 0,
          isFirstOrder,
        ];
      } else {
        // Exclude referral columns for backward compatibility
        query = `
          INSERT INTO orders (
            customer_name,
            customer_phone,
            customer_email,
            order_type,
            installation_address,
            pincode,
            city,
            state,
            landmark,
            products,
            products_total,
            includes_installation,
            installation_charges,
            with_amc,
            amc_details,
            amc_cost,
            total_amount,
            payment_method,
            payment_status,
            status,
            created_at,
            updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, NOW(), NOW())
          RETURNING *
        `;

        values = [
          customerName,
          phone,
          email,
          'product_cart',
          address,
          pinCode,
          city,
          state,
          landmark || null,
          JSON.stringify(products),
          productsTotal,
          withInstallation,
          installationCost || 0,
          withAmc || false,
          amcDetails ? JSON.stringify(amcDetails) : null,
          amcCost || 0,
          totalAmount,
          paymentMethod,
          paymentMethod === 'cod' ? 'Pending' : 'Pending',
          status || 'Pending',
        ];
      }

      const result = await pool.query(query, values);

      // Commit transaction
      await pool.query('COMMIT');

      return NextResponse.json({
        success: true,
        order: result.rows[0],
      });
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pool = getPool();
    const query = `
      SELECT * FROM orders 
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query);
    
    return NextResponse.json({
      success: true,
      orders: result.rows
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, paymentStatus } = await request.json();
    const pool = getPool();

    let query = '';
    let values: any[] = [];

    if (status && paymentStatus) {
      query = `
        UPDATE orders 
        SET status = $1, payment_status = $2, updated_at = NOW()
        WHERE order_id = $3
        RETURNING *
      `;
      values = [status, paymentStatus, id];
    } else if (status) {
      query = `
        UPDATE orders 
        SET status = $1, updated_at = NOW()
        WHERE order_id = $2
        RETURNING *
      `;
      values = [status, id];
    } else if (paymentStatus) {
      query = `
        UPDATE orders 
        SET payment_status = $1, updated_at = NOW()
        WHERE order_id = $2
        RETURNING *
      `;
      values = [paymentStatus, id];
    } else {
      return NextResponse.json(
        { success: false, error: 'Status or paymentStatus is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      order: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
