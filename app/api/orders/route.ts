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
      status
    } = orderData;

    // Insert order into unified orders table with order_type = 'product_cart'
    const query = `
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

    const values = [
      customerName,
      phone,
      email,
      'product_cart', // order_type to distinguish from quotation orders
      address, // maps to installation_address
      pinCode, // maps to pincode
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
      paymentMethod === 'cod' ? 'Pending' : 'Pending', // payment_status
      status || 'Pending' // order status
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      order: result.rows[0]
    });
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
