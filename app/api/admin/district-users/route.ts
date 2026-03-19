import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// GET: Fetch all district users
export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(`
      SELECT 
        district_user_id,
        username,
        email,
        full_name,
        phone_number,
        district,
        state,
        pincodes,
        is_active,
        can_view_dealers,
        can_view_orders,
        can_contact_dealers,
        created_at,
        last_login
      FROM district_users
      ORDER BY created_at DESC
    `);

    return NextResponse.json({
      success: true,
      users: result.rows
    });
  } catch (error) {
    console.error('Failed to fetch district users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch district users' },
      { status: 500 }
    );
  }
}

// POST: Create new district user
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      username,
      email,
      password,
      full_name,
      phone_number,
      district,
      state,
      pincodes,
      can_view_dealers = true,
      can_view_orders = true,
      can_contact_dealers = true
    } = body;

    // Validate required fields
    if (!username || !email || !password || !full_name || !district || !state) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if username or email already exists
    const checkExisting = await pool.query(
      'SELECT username, email FROM district_users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (checkExisting.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Username or email already exists' },
        { status: 409 }
      );
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new district user
    const result = await pool.query(`
      INSERT INTO district_users (
        username,
        email,
        password_hash,
        full_name,
        phone_number,
        district,
        state,
        pincodes,
        can_view_dealers,
        can_view_orders,
        can_contact_dealers
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING district_user_id, username, email, full_name, district, state, pincodes
    `, [
      username,
      email,
      password_hash,
      full_name,
      phone_number || null,
      district,
      state,
      pincodes || null,
      can_view_dealers,
      can_view_orders,
      can_contact_dealers
    ]);

    return NextResponse.json({
      success: true,
      message: 'District user created successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to create district user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create district user' },
      { status: 500 }
    );
  }
}

// PATCH: Update district user (activate/deactivate or update permissions)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { district_user_id, is_active, can_view_dealers, can_view_orders, can_contact_dealers } = body;

    if (!district_user_id) {
      return NextResponse.json(
        { success: false, error: 'district_user_id is required' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (typeof is_active === 'boolean') {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }
    if (typeof can_view_dealers === 'boolean') {
      updates.push(`can_view_dealers = $${paramCount++}`);
      values.push(can_view_dealers);
    }
    if (typeof can_view_orders === 'boolean') {
      updates.push(`can_view_orders = $${paramCount++}`);
      values.push(can_view_orders);
    }
    if (typeof can_contact_dealers === 'boolean') {
      updates.push(`can_contact_dealers = $${paramCount++}`);
      values.push(can_contact_dealers);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(district_user_id);

    const result = await pool.query(`
      UPDATE district_users
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE district_user_id = $${paramCount}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'District user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'District user updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Failed to update district user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update district user' },
      { status: 500 }
    );
  }
}

// DELETE: Remove district user
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { district_user_id } = body;

    if (!district_user_id) {
      return NextResponse.json(
        { success: false, error: 'district_user_id is required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      'DELETE FROM district_users WHERE district_user_id = $1 RETURNING username',
      [district_user_id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'District user not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `District user ${result.rows[0].username} deleted successfully`
    });
  } catch (error) {
    console.error('Failed to delete district user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete district user' },
      { status: 500 }
    );
  }
}
