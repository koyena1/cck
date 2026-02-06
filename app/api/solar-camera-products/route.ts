import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// Disable caching for this route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const isAdmin = searchParams.get('admin') === 'true';

  try {
    const pool = getPool();
    
    let query = 'SELECT * FROM solar_camera_products';
    if (!isAdmin) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query);
    
    return NextResponse.json({ success: true, products: result.rows });
  } catch (error: any) {
    console.error('Error fetching solar camera products:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      message: error.message,
      hint: 'Check if solar_camera_products table exists and database connection is configured'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      brand,
      resolution,
      solar_panel,
      battery,
      price,
      original_price,
      image,
      specs,
      rating,
      reviews,
      is_active
    } = body;

    const pool = getPool();
    
    const result = await pool.query(
      `INSERT INTO solar_camera_products 
       (name, brand, resolution, solar_panel, battery, price, original_price, image, specs, rating, reviews, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [name, brand, resolution, solar_panel, battery, price, original_price, image, specs, rating || 4.5, reviews || 0, is_active !== undefined ? is_active : true]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating solar camera product:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      table: 'solar_camera_products'
    });
    return NextResponse.json({ 
      error: 'Failed to create product',
      message: error.message,
      hint: 'Check if solar_camera_products table exists and all columns match'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const {
      name,
      brand,
      resolution,
      solar_panel,
      battery,
      price,
      original_price,
      image,
      specs,
      rating,
      reviews,
      is_active
    } = body;

    const pool = getPool();
    
    const result = await pool.query(
      `UPDATE solar_camera_products 
       SET name = $1, brand = $2, resolution = $3, solar_panel = $4, battery = $5,
           price = $6, original_price = $7, image = $8, specs = $9, rating = $10, 
           reviews = $11, is_active = $12, updated_at = CURRENT_TIMESTAMP
       WHERE id = $13
       RETURNING *`,
      [name, brand, resolution, solar_panel, battery, price, original_price, image, specs, rating, reviews, is_active, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating solar camera product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
  }

  try {
    const pool = getPool();
    
    const result = await pool.query(
      'DELETE FROM solar_camera_products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting solar camera product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
