import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureBpoCallsTable, ensureBpoUsersTable } from '@/lib/bpo-auth';

export async function GET(request: NextRequest) {
  try {
    const userId = Number(new URL(request.url).searchParams.get('bpoUserId'));
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: 'Valid bpoUserId is required' }, { status: 400 });
    }

    const pool = getPool();
    await ensureBpoUsersTable(pool);
    await ensureBpoCallsTable(pool);

    const result = await pool.query(
      `SELECT
         call_id,
         bpo_user_id,
         customer_name,
         customer_phone,
         call_status,
         call_notes,
         follow_up_at,
         created_at,
         updated_at
       FROM bpo_call_logs
       WHERE bpo_user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    return NextResponse.json({ success: true, calls: result.rows });
  } catch (error) {
    console.error('BPO calls GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch call logs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userId = Number(body?.bpoUserId);
    const customerName = String(body?.customerName || '').trim();
    const customerPhone = String(body?.customerPhone || '').trim();
    const callStatus = String(body?.callStatus || 'connected').trim().toLowerCase();
    const callNotes = String(body?.callNotes || '').trim() || null;
    const followUpAt = body?.followUpAt ? String(body.followUpAt) : null;

    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: 'Valid bpoUserId is required' }, { status: 400 });
    }
    if (!customerName || !customerPhone) {
      return NextResponse.json({ success: false, error: 'Customer name and phone are required' }, { status: 400 });
    }

    const normalizedStatus = ['connected', 'not_connected', 'follow_up', 'resolved'].includes(callStatus)
      ? callStatus
      : 'connected';

    const pool = getPool();
    await ensureBpoUsersTable(pool);
    await ensureBpoCallsTable(pool);

    const result = await pool.query(
      `INSERT INTO bpo_call_logs (
         bpo_user_id,
         customer_name,
         customer_phone,
         call_status,
         call_notes,
         follow_up_at,
         created_at,
         updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [userId, customerName, customerPhone, normalizedStatus, callNotes, followUpAt]
    );

    return NextResponse.json({ success: true, call: result.rows[0] });
  } catch (error) {
    console.error('BPO calls POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to save call log' }, { status: 500 });
  }
}
