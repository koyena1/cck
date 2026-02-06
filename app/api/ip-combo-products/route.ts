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
    
    let query = 'SELECT * FROM ip_combo_products';
    if (!isAdmin) {
      query += ' WHERE is_active = true';
    }
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query);
    
    console.log(`IP Combo Products fetched: ${result.rows.length} products (admin=${isAdmin})`);
    console.log('Products:', result.rows.map(p => ({ id: p.id, name: p.name, is_active: p.is_active })));
    
    return NextResponse.json({ success: true, products: result.rows });
  } catch (error: any) {
    console.error('Error fetching IP combo products:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    return NextResponse.json({ 
      error: 'Failed to fetch products',
      message: error.message,
      hint: 'Check if ip_combo_products table exists and database connection is configured'
    }, { status: 500 });
  }
}

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
      is_active
    } = body;

    const pool = getPool();
    
    const result = await pool.query(
      `INSERT INTO ip_combo_products 
       (name, brand, channels, camera_type, resolution, hdd, cable, price, original_price, image, specs, rating, reviews, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, brand, channels, camera_type, resolution, hdd, cable, price, original_price, image, specs, rating || 4.5, reviews || 0, is_active !== undefined ? is_active : true]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error: any) {
    console.error('Error creating IP combo product:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      table: 'ip_combo_products'
    });
    return NextResponse.json({ 
      error: 'Failed to create product',
      message: error.message,
      hint: 'Check if ip_combo_products table exists and all columns match'
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
      is_active
    } = body;

    const pool = getPool();
    
    const result = await pool.query(
      `UPDATE ip_combo_products 
       SET name = $1, brand = $2, channels = $3, camera_type = $4, resolution = $5, 
           hdd = $6, cable = $7, price = $8, original_price = $9, image = $10, 
           specs = $11, rating = $12, reviews = $13, is_active = $14, updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [name, brand, channels, camera_type, resolution, hdd, cable, price, original_price, image, specs, rating, reviews, is_active, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating IP combo product:', error);
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
      'DELETE FROM ip_combo_products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting IP combo product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
