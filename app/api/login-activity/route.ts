import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import {
  ensureLoginActivityTable,
  getRequestIpAddress,
  LoginEntityType,
  LoginEventType,
  recordLoginActivity,
} from '@/lib/login-activity';

function parseEntityType(value: string | null): LoginEntityType | null {
  if (value === 'dealer' || value === 'district_manager' || value === 'bpo') return value;
  return null;
}

function parseEventType(value: string | null): LoginEventType | null {
  if (value === 'login' || value === 'logout') return value;
  return null;
}

export async function GET(request: NextRequest) {
  try {
    await ensureLoginActivityTable();
    const { searchParams } = new URL(request.url);

    const entityType = parseEntityType(searchParams.get('entityType'));
    const eventType = parseEventType(searchParams.get('eventType'));
    const portal = String(searchParams.get('portal') || '').trim().toLowerCase();

    const rawLimit = Number(searchParams.get('limit') || 200);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 200;

    const whereParts: string[] = [];
    const values: Array<string | number> = [];

    if (entityType) {
      values.push(entityType);
      whereParts.push(`entity_type = $${values.length}`);
    }

    if (eventType) {
      values.push(eventType);
      whereParts.push(`event_type = $${values.length}`);
    }

    if (portal === 'dealer' || portal === 'district' || portal === 'bpo') {
      values.push(portal);
      whereParts.push(`portal = $${values.length}`);
    }

    values.push(limit);
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const pool = getPool();
    const result = await pool.query(
      `SELECT
         pla.id,
         pla.entity_type,
         pla.entity_id,
         pla.entity_name,
         pla.portal,
         pla.event_type,
         pla.ip_address,
         pla.user_agent,
         pla.occurred_at,
         CASE
           WHEN pla.entity_type = 'dealer' THEN (
             SELECT d.unique_dealer_id
             FROM dealers d
             WHERE d.dealer_id::text = pla.entity_id
             LIMIT 1
           )
           WHEN pla.entity_type = 'district_manager' THEN (
             SELECT du.district_unique_id
             FROM district_users du
             WHERE du.district_user_id::text = pla.entity_id
             LIMIT 1
           )
           WHEN pla.entity_type = 'bpo' THEN (
             SELECT bu.bpo_unique_id
             FROM bpo_users bu
             WHERE bu.bpo_user_id::text = pla.entity_id
             LIMIT 1
           )
           ELSE NULL
         END AS entity_unique_id
       FROM portal_login_activity pla
       ${whereClause}
       ORDER BY pla.occurred_at DESC
       LIMIT $${values.length}`,
      values
    );

    return NextResponse.json({ success: true, logs: result.rows });
  } catch (error) {
    console.error('Login activity list error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch login activity' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const entityType = parseEntityType(String(body?.entityType || '').trim().toLowerCase());
    const eventType = parseEventType(String(body?.eventType || '').trim().toLowerCase());
    const portal = String(body?.portal || '').trim().toLowerCase();
    const entityId = String(body?.entityId || '').trim();
    const entityName = String(body?.entityName || '').trim();

    if (!entityType || !eventType || !entityId || !entityName) {
      return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    if (!(portal === 'dealer' || portal === 'district' || portal === 'bpo')) {
      return NextResponse.json({ success: false, error: 'Invalid portal value' }, { status: 400 });
    }

    await recordLoginActivity({
      entityType,
      entityId,
      entityName,
      portal,
      eventType,
      ipAddress: getRequestIpAddress(request.headers),
      userAgent: request.headers.get('user-agent'),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login activity create error:', error);
    return NextResponse.json({ success: false, error: 'Failed to record login activity' }, { status: 500 });
  }
}
