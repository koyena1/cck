import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool } from '@/lib/db';
import { ensureBpoUsersTable } from '@/lib/bpo-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!fullName || !email || !password) {
      return NextResponse.json({ success: false, error: 'Full name, email, and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const pool = getPool();
    await ensureBpoUsersTable(pool);

    const existing = await pool.query(
      'SELECT bpo_user_id FROM bpo_users WHERE LOWER(email) = LOWER($1) LIMIT 1',
      [email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ success: false, error: 'Email is already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const inserted = await pool.query(
      `INSERT INTO bpo_users (full_name, email, password_hash, is_active, created_at, updated_at)
       VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING bpo_user_id, bpo_unique_id, full_name, email`,
      [fullName, email, passwordHash]
    );

    const user = inserted.rows[0];
    const token = `bpo_${user.bpo_user_id}_${Date.now()}`;

    return NextResponse.json({ success: true, user, token });
  } catch (error) {
    console.error('BPO register error:', error);
    return NextResponse.json({ success: false, error: 'Failed to register BPO user' }, { status: 500 });
  }
}
