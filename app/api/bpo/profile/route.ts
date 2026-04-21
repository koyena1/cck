import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureBpoProfilesTable, ensureBpoUsersTable } from '@/lib/bpo-auth';

export async function GET(request: NextRequest) {
  try {
    const userId = Number(new URL(request.url).searchParams.get('bpoUserId'));
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: 'Valid bpoUserId is required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureBpoUsersTable(pool);
    await ensureBpoProfilesTable(pool);

    const result = await pool.query(
      `SELECT
         u.bpo_user_id,
         u.full_name,
         u.email,
         p.location,
         p.phone_number,
         p.designation,
         p.notes,
         p.updated_at
       FROM bpo_users u
       LEFT JOIN bpo_profiles p ON p.bpo_user_id = u.bpo_user_id
       WHERE u.bpo_user_id = $1
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'BPO user not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('BPO profile GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch BPO profile' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = Number(body?.bpoUserId);
    const location = String(body?.location || '').trim() || null;
    const phoneNumber = String(body?.phoneNumber || '').trim() || null;
    const designation = String(body?.designation || '').trim() || null;
    const notes = String(body?.notes || '').trim() || null;

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: 'Valid bpoUserId is required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureBpoUsersTable(pool);
    await ensureBpoProfilesTable(pool);

    const result = await pool.query(
      `INSERT INTO bpo_profiles (bpo_user_id, location, phone_number, designation, notes, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (bpo_user_id) DO UPDATE
       SET location = EXCLUDED.location,
           phone_number = EXCLUDED.phone_number,
           designation = EXCLUDED.designation,
           notes = EXCLUDED.notes,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, location, phoneNumber, designation, notes]
    );

    return NextResponse.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    console.error('BPO profile POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save BPO profile' }, { status: 500 });
  }
}
