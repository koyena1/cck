import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Get database connection pool
const pool = getPool();

// GET - Fetch all HD Combo products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const admin = searchParams.get('admin'); // Check if this is an admin request

    let query = 'SELECT * FROM hd_combo_products';
    let params: any[] = [];

    if (id) {
      query += ' WHERE id = $1';
      params.push(id);
    } else if (admin === 'true') {
      // Admin gets all products (including inactive)
      query += ' ORDER BY created_at DESC';
    } else {
      // Frontend only gets active products
      query += ' WHERE is_active = true ORDER BY created_at DESC';
    }

    const result = await pool.query(query, params);

    return NextResponse.json({ success: true, products: result.rows });
  } catch (error: any) {
    console.error('Error fetching HD Combo products:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// GET ALL (for admin) - Fetch all products including inactive
export async function getAllProducts() {
  try {
    const result = await pool.query(
      'SELECT * FROM hd_combo_products ORDER BY created_at DESC'
    );
    return result.rows;
  } catch (error) {
    throw error;
  }
}

// POST - Create new HD Combo product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      brand,
      channels,
      camera_type,
      resolution,
      hdd,
      cable,
      price,
      original_price,
      image,
      specs,
      rating,
      reviews,
      is_active,
    } = body;

    // Validation
    if (!name || !brand || !channels || !camera_type || !resolution || !hdd || !cable || !price || !original_price) {
      return NextResponse.json(
        { success: false, error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    const query = `
      INSERT INTO hd_combo_products 
      (name, brand, channels, camera_type, resolution, hdd, cable, price, original_price, image, specs, rating, reviews, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const values = [
      name,
      brand,
      channels,
      camera_type,
      resolution,
      hdd,
      cable,
      parseFloat(price),
      parseFloat(original_price),
      image || '',
      specs || [],
      rating || 4.5,
      reviews || 0,
      is_active !== undefined ? is_active : true,
    ];

    const result = await pool.query(query, values);

    return NextResponse.json({
      success: true,
      message: 'Product created successfully',
      product: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error creating HD Combo product:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update HD Combo product
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      name,
      brand,
      channels,
      camera_type,
      resolution,
      hdd,
      cable,
      price,
      original_price,
      image,
      specs,
      rating,
      reviews,
      is_active,
    } = body;

    const query = `
      UPDATE hd_combo_products
      SET 
        name = $1,
        brand = $2,
        channels = $3,
        camera_type = $4,
        resolution = $5,
        hdd = $6,
        cable = $7,
        price = $8,
        original_price = $9,
        image = $10,
        specs = $11,
        rating = $12,
        reviews = $13,
        is_active = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15
      RETURNING *
    `;

    const values = [
      name,
      brand,
      channels,
      camera_type,
      resolution,
      hdd,
      cable,
      parseFloat(price),
      parseFloat(original_price),
      image,
      specs || [],
      rating || 4.5,
      reviews || 0,
      is_active !== undefined ? is_active : true,
      id,
    ];

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      product: result.rows[0],
    });
  } catch (error: any) {
    console.error('Error updating HD Combo product:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete HD Combo product
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM hd_combo_products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting HD Combo product:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
