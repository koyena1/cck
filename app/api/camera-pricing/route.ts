import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cctv_platform',
  password: process.env.DB_PASSWORD || 'Koyen@123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// GET - Fetch all camera pricing with details
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cameraTypeId = searchParams.get('camera_type_id');
    const brandId = searchParams.get('brand_id');
    const pixelId = searchParams.get('pixel_id');
    const techTypeId = searchParams.get('tech_type_id');

    let query = `
      SELECT 
        cp.*,
        ct.name as camera_type,
        b.name as brand,
        po.name as pixel,
        ctt.name as tech_type
      FROM camera_pricing cp
      JOIN camera_types ct ON cp.camera_type_id = ct.id
      JOIN brands b ON cp.brand_id = b.id
      JOIN pixel_options po ON cp.pixel_id = po.id
      JOIN camera_tech_types ctt ON cp.tech_type_id = ctt.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (cameraTypeId) {
      query += ` AND cp.camera_type_id = $${paramIndex}`;
      params.push(cameraTypeId);
      paramIndex++;
    }
    if (brandId) {
      query += ` AND cp.brand_id = $${paramIndex}`;
      params.push(brandId);
      paramIndex++;
    }
    if (pixelId) {
      query += ` AND cp.pixel_id = $${paramIndex}`;
      params.push(pixelId);
      paramIndex++;
    }
    if (techTypeId) {
      query += ` AND cp.tech_type_id = $${paramIndex}`;
      params.push(techTypeId);
      paramIndex++;
    }

    query += ` ORDER BY ct.display_order, b.display_order, po.display_order, ctt.display_order`;

    const result = await pool.query(query, params);
    
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching camera pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch camera pricing' },
      { status: 500 }
    );
  }
}

// POST - Add new camera pricing
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { camera_type_id, brand_id, pixel_id, tech_type_id, base_price, notes } = body;

    // Check if combination already exists
    const checkQuery = `
      SELECT id FROM camera_pricing 
      WHERE camera_type_id = $1 AND brand_id = $2 AND pixel_id = $3 AND tech_type_id = $4
    `;
    const existing = await pool.query(checkQuery, [camera_type_id, brand_id, pixel_id, tech_type_id]);

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'This combination already exists' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO camera_pricing (camera_type_id, brand_id, pixel_id, tech_type_id, base_price, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [camera_type_id, brand_id, pixel_id, tech_type_id, base_price, notes || null]
    );

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error adding camera pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add camera pricing' },
      { status: 500 }
    );
  }
}

// PUT - Update camera pricing
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, base_price, notes } = body;

    const result = await pool.query(
      `UPDATE camera_pricing 
       SET base_price = $1, notes = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [base_price, notes || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pricing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Error updating camera pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update camera pricing' },
      { status: 500 }
    );
  }
}

// DELETE - Remove camera pricing
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    const result = await pool.query('DELETE FROM camera_pricing WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Pricing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting camera pricing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete camera pricing' },
      { status: 500 }
    );
  }
}
