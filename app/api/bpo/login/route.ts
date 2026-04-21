import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { getPool } from '@/lib/db';
import { ensureBpoUsersTable } from '@/lib/bpo-auth';
import { getRequestIpAddress, recordLoginActivity } from '@/lib/login-activity';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');

    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Email and password are required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureBpoUsersTable(pool);

    const result = await pool.query(
      `SELECT bpo_user_id, bpo_unique_id, full_name, email, password_hash, is_active
       FROM bpo_users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const userRow = result.rows[0];
    if (!userRow.is_active) {
      return NextResponse.json({ success: false, error: 'BPO account is inactive' }, { status: 403 });
    }

    const passwordOk = await bcrypt.compare(password, userRow.password_hash);
    if (!passwordOk) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
    }

    const user = {
      bpo_user_id: userRow.bpo_user_id,
      bpo_unique_id: userRow.bpo_unique_id,
      full_name: userRow.full_name,
      email: userRow.email,
    };

    await recordLoginActivity({
      entityType: 'bpo',
      entityId: String(user.bpo_user_id),
      entityName: String(user.full_name || user.email || 'BPO User'),
      portal: 'bpo',
      eventType: 'login',
      ipAddress: getRequestIpAddress(request.headers),
      userAgent: request.headers.get('user-agent'),
    });

    const token = `bpo_${user.bpo_user_id}_${Date.now()}`;

    return NextResponse.json({ success: true, user, token });
  } catch (error) {
    console.error('BPO login error:', error);
    return NextResponse.json({ success: false, error: 'Failed to login BPO user' }, { status: 500 });
  }
}
