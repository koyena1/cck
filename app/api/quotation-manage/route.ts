import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Update camera type
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    console.log('PUT request received:', body);
    const { id, name, display_order, is_active, table, channel_count, features, capacity, price, base_price, camera_type, location, cable_type, length } = body;
    const pool = getPool();
    
    const validTables = ['camera_types', 'brands', 'pixel_options', 'channel_options', 'camera_tech_types', 'storage_options', 'cable_options', 'accessories'];
    if (!validTables.includes(table)) {
      console.error('Invalid table:', table);
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }
    
    let query = '';
    let values: any[] = [];
    
    switch (table) {
      case 'channel_options':
        query = `UPDATE ${table} SET channel_count = $1, features = $2, display_order = $3, is_active = $4 WHERE id = $5`;
        values = [channel_count, JSON.stringify(features || []), display_order || 0, is_active !== false, id];
        break;
      case 'storage_options':
        query = `UPDATE ${table} SET capacity = $1, price = $2, display_order = $3, is_active = $4 WHERE id = $5`;
        values = [capacity, price, display_order || 0, is_active !== false, id];
        break;
      case 'accessories':
        query = `UPDATE ${table} SET name = $1, price = $2, display_order = $3, is_active = $4 WHERE id = $5`;
        values = [name, price, display_order || 0, is_active !== false, id];
        break;
      case 'camera_tech_types':
        query = `UPDATE ${table} SET name = $1, camera_type = $2, location = $3, base_price = $4, display_order = $5, is_active = $6 WHERE id = $7`;
        values = [name, camera_type, location, base_price, display_order || 0, is_active !== false, id];
        console.log('Updating camera_tech_types with query:', query, 'values:', values);
        break;
      case 'cable_options':
        query = `UPDATE ${table} SET name = $1, cable_type = $2, length = $3, price = $4, display_order = $5, is_active = $6 WHERE id = $7`;
        values = [name, cable_type, length, price, display_order || 0, is_active !== false, id];
        break;
      default:
        query = `UPDATE ${table} SET name = $1, display_order = $2, is_active = $3 WHERE id = $4`;
        values = [name, display_order || 0, is_active !== false, id];
    }
    
    await pool.query(query, values);
    console.log('Update successful for table:', table);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Update error:', err);
    return NextResponse.json({ error: 'Failed to update', details: err instanceof Error ? err.message : 'Unknown error' }, { status: 500 });
  }
}

// Delete item
export async function DELETE(request: Request) {
  try {
    const { id, table } = await request.json();
    const pool = getPool();
    
    const validTables = ['camera_types', 'brands', 'pixel_options', 'channel_options', 
                         'camera_tech_types', 'storage_options', 'cable_options', 'accessories'];
    if (!validTables.includes(table)) {
      return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }
    
    await pool.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

// Add new item
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { table, ...data } = body;
    const pool = getPool();
    
    let query = '';
    let values: any[] = [];
    
    switch (table) {
      case 'camera_types':
      case 'brands':
      case 'pixel_options':
        query = `INSERT INTO ${table} (name, display_order) VALUES ($1, $2) RETURNING id`;
        values = [data.name, data.display_order || 0];
        break;
      case 'channel_options':
        query = `INSERT INTO channel_options (channel_count, features, display_order) VALUES ($1, $2, $3) RETURNING id`;
        values = [data.channel_count, JSON.stringify(data.features || []), data.display_order || 0];
        break;
      case 'camera_tech_types':
        query = `INSERT INTO camera_tech_types (name, camera_type, location, base_price, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        values = [data.name, data.camera_type, data.location, data.base_price, data.display_order || 0];
        break;
      case 'storage_options':
        query = `INSERT INTO storage_options (capacity, price, display_order) VALUES ($1, $2, $3) RETURNING id`;
        values = [data.capacity, data.price, data.display_order || 0];
        break;
      case 'cable_options':
        query = `INSERT INTO cable_options (name, cable_type, length, price, display_order) VALUES ($1, $2, $3, $4, $5) RETURNING id`;
        values = [data.name, data.cable_type, data.length, data.price, data.display_order || 0];
        break;
      case 'accessories':
        query = `INSERT INTO accessories (name, price, display_order) VALUES ($1, $2, $3) RETURNING id`;
        values = [data.name, data.price, data.display_order || 0];
        break;
      default:
        return NextResponse.json({ error: 'Invalid table' }, { status: 400 });
    }
    
    const result = await pool.query(query, values);
    return NextResponse.json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error('Insert error:', err);
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}
