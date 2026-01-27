import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cctv_platform',
  password: process.env.DB_PASSWORD || 'Koyen@123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

// GET - Fetch all pricing data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // camera, hd_accessories, ip_accessories, cables, installation, amc

    if (type === 'camera') {
      const result = await pool.query(`
        SELECT cp.*, ct.name as camera_type, b.name as brand, po.name as pixel, ctt.name as tech_type
        FROM camera_pricing cp
        LEFT JOIN camera_types ct ON cp.camera_type_id = ct.id
        LEFT JOIN brands b ON cp.brand_id = b.id
        LEFT JOIN pixel_options po ON cp.pixel_id = po.id
        LEFT JOIN camera_tech_types ctt ON cp.tech_type_id = ctt.id
        WHERE cp.is_active = true
        ORDER BY cp.display_order, cp.id
      `);
      return NextResponse.json({ success: true, data: result.rows });
    }

    if (type === 'hd_accessories') {
      const result = await pool.query('SELECT * FROM hd_accessories_pricing WHERE is_active = true ORDER BY ch_count');
      return NextResponse.json({ success: true, data: result.rows });
    }

    if (type === 'ip_accessories') {
      const result = await pool.query('SELECT * FROM ip_accessories_pricing WHERE is_active = true ORDER BY ch_count');
      return NextResponse.json({ success: true, data: result.rows });
    }

    if (type === 'cables') {
      const result = await pool.query(`
        SELECT cp.*, ct.name as camera_type 
        FROM cable_options_pricing cp
        LEFT JOIN camera_types ct ON cp.camera_type_id = ct.id
        WHERE cp.is_active = true 
        ORDER BY cp.display_order
      `);
      return NextResponse.json({ success: true, data: result.rows });
    }

    if (type === 'installation') {
      const result = await pool.query('SELECT * FROM installation_pricing WHERE is_active = true ORDER BY camera_qty_from');
      return NextResponse.json({ success: true, data: result.rows });
    }

    if (type === 'amc') {
      const result = await pool.query('SELECT * FROM amc_pricing WHERE is_active = true ORDER BY amc_type, duration');
      return NextResponse.json({ success: true, data: result.rows });
    }

    // Return all
    const [cameras, hdAcc, ipAcc, cables, installation, amc] = await Promise.all([
      pool.query('SELECT cp.*, ct.name as camera_type, b.name as brand, po.name as pixel, ctt.name as tech_type FROM camera_pricing cp LEFT JOIN camera_types ct ON cp.camera_type_id = ct.id LEFT JOIN brands b ON cp.brand_id = b.id LEFT JOIN pixel_options po ON cp.pixel_id = po.id LEFT JOIN camera_tech_types ctt ON cp.tech_type_id = ctt.id WHERE cp.is_active = true ORDER BY cp.display_order'),
      pool.query('SELECT * FROM hd_accessories_pricing WHERE is_active = true ORDER BY ch_count'),
      pool.query('SELECT * FROM ip_accessories_pricing WHERE is_active = true ORDER BY ch_count'),
      pool.query('SELECT cp.*, ct.name as camera_type FROM cable_options_pricing cp LEFT JOIN camera_types ct ON cp.camera_type_id = ct.id WHERE cp.is_active = true ORDER BY cp.display_order'),
      pool.query('SELECT * FROM installation_pricing WHERE is_active = true ORDER BY camera_qty_from'),
      pool.query('SELECT * FROM amc_pricing WHERE is_active = true ORDER BY amc_type, duration')
    ]);

    return NextResponse.json({
      success: true,
      data: {
        cameras: cameras.rows,
        hd_accessories: hdAcc.rows,
        ip_accessories: ipAcc.rows,
        cables: cables.rows,
        installation: installation.rows,
        amc: amc.rows
      }
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch pricing' }, { status: 500 });
  }
}

// POST - Add new pricing entry
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    let result;

    if (type === 'camera') {
      result = await pool.query(
        `INSERT INTO camera_pricing (camera_type_id, brand_id, pixel_id, tech_type_id, model_number, shape, ir_distance, specifications, warranty, price, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
        [data.camera_type_id, data.brand_id, data.pixel_id, data.tech_type_id, data.model_number, data.shape, data.ir_distance, data.specifications, data.warranty || '2 years Warranty', data.price, data.display_order || 0]
      );
    } else if (type === 'hd_accessories') {
      result = await pool.query(
        `INSERT INTO hd_accessories_pricing (ch_count, smps_qty, bnc_qty, dc_jack_qty, total_cost, description)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [data.ch_count, data.smps_qty, data.bnc_qty, data.dc_jack_qty, data.total_cost, data.description]
      );
    } else if (type === 'ip_accessories') {
      result = await pool.query(
        `INSERT INTO ip_accessories_pricing (ch_count, poe_qty, rj45_qty, total_cost, description)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [data.ch_count, data.poe_qty, data.rj45_qty, data.total_cost, data.description]
      );
    } else if (type === 'cables') {
      result = await pool.query(
        `INSERT INTO cable_options_pricing (cable_type, cable_name, length, price, camera_type_id, display_order)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [data.cable_type, data.cable_name, data.length, data.price, data.camera_type_id, data.display_order || 0]
      );
    } else if (type === 'installation') {
      result = await pool.query(
        `INSERT INTO installation_pricing (camera_qty_from, camera_qty_to, price_per_camera, description)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.camera_qty_from, data.camera_qty_to, data.price_per_camera, data.description]
      );
    } else if (type === 'amc') {
      result = await pool.query(
        `INSERT INTO amc_pricing (amc_type, duration, price_per_camera, description)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [data.amc_type, data.duration, data.price_per_camera, data.description]
      );
    }

    return NextResponse.json({ success: true, data: result?.rows[0] });
  } catch (error) {
    console.error('Error adding pricing:', error);
    return NextResponse.json({ success: false, error: 'Failed to add pricing' }, { status: 500 });
  }
}

// PUT - Update pricing entry
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { type, id, ...data } = body;

    let result;

    if (type === 'camera') {
      result = await pool.query(
        `UPDATE camera_pricing SET 
         camera_type_id = $1, brand_id = $2, pixel_id = $3, tech_type_id = $4,
         model_number = $5, shape = $6, ir_distance = $7, specifications = $8,
         warranty = $9, price = $10, display_order = $11, updated_at = CURRENT_TIMESTAMP
         WHERE id = $12 RETURNING *`,
        [data.camera_type_id, data.brand_id, data.pixel_id, data.tech_type_id, data.model_number, data.shape, data.ir_distance, data.specifications, data.warranty, data.price, data.display_order, id]
      );
    } else if (type === 'hd_accessories') {
      result = await pool.query(
        `UPDATE hd_accessories_pricing SET ch_count = $1, smps_qty = $2, bnc_qty = $3, dc_jack_qty = $4, total_cost = $5, description = $6 WHERE id = $7 RETURNING *`,
        [data.ch_count, data.smps_qty, data.bnc_qty, data.dc_jack_qty, data.total_cost, data.description, id]
      );
    } else if (type === 'ip_accessories') {
      result = await pool.query(
        `UPDATE ip_accessories_pricing SET ch_count = $1, poe_qty = $2, rj45_qty = $3, total_cost = $4, description = $5 WHERE id = $6 RETURNING *`,
        [data.ch_count, data.poe_qty, data.rj45_qty, data.total_cost, data.description, id]
      );
    } else if (type === 'cables') {
      result = await pool.query(
        `UPDATE cable_options_pricing SET cable_type = $1, cable_name = $2, length = $3, price = $4, camera_type_id = $5, display_order = $6 WHERE id = $7 RETURNING *`,
        [data.cable_type, data.cable_name, data.length, data.price, data.camera_type_id, data.display_order, id]
      );
    } else if (type === 'installation') {
      result = await pool.query(
        `UPDATE installation_pricing SET camera_qty_from = $1, camera_qty_to = $2, price_per_camera = $3, description = $4 WHERE id = $5 RETURNING *`,
        [data.camera_qty_from, data.camera_qty_to, data.price_per_camera, data.description, id]
      );
    } else if (type === 'amc') {
      result = await pool.query(
        `UPDATE amc_pricing SET amc_type = $1, duration = $2, price_per_camera = $3, description = $4 WHERE id = $5 RETURNING *`,
        [data.amc_type, data.duration, data.price_per_camera, data.description, id]
      );
    }

    return NextResponse.json({ success: true, data: result?.rows[0] });
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json({ success: false, error: 'Failed to update pricing' }, { status: 500 });
  }
}

// DELETE - Remove pricing entry
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    let table = '';
    if (type === 'camera') table = 'camera_pricing';
    else if (type === 'hd_accessories') table = 'hd_accessories_pricing';
    else if (type === 'ip_accessories') table = 'ip_accessories_pricing';
    else if (type === 'cables') table = 'cable_options_pricing';
    else if (type === 'installation') table = 'installation_pricing';
    else if (type === 'amc') table = 'amc_pricing';

    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete pricing' }, { status: 500 });
  }
}
