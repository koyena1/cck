import { NextRequest } from 'next/server';
import { getPool } from '@/lib/db';
import { ensureLoginActivityTable, LoginEntityType, LoginEventType } from '@/lib/login-activity';

function parseEntityType(value: string | null): LoginEntityType | null {
  if (value === 'dealer' || value === 'district_manager' || value === 'bpo') return value;
  return null;
}

function parseEventType(value: string | null): LoginEventType | null {
  if (value === 'login' || value === 'logout') return value;
  return null;
}

async function fetchLogs(request: NextRequest) {
  await ensureLoginActivityTable();
  const { searchParams } = new URL(request.url);

  const entityType = parseEntityType(searchParams.get('entityType'));
  const eventType = parseEventType(searchParams.get('eventType'));
  const portal = String(searchParams.get('portal') || '').trim().toLowerCase();

  const rawLimit = Number(searchParams.get('limit') || 300);
  const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 300;

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

  return result.rows;
}

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  let interval: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let lastPayload = '';

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const sendEvent = (event: string, data: string) => {
        if (closed) return;
        controller.enqueue(encoder.encode(`event: ${event}\n`));
        controller.enqueue(encoder.encode(`data: ${data}\n\n`));
      };

      const pushLogs = async () => {
        try {
          const logs = await fetchLogs(request);
          const payload = JSON.stringify(logs);
          if (payload !== lastPayload) {
            lastPayload = payload;
            sendEvent('logs', payload);
          }
        } catch (error) {
          sendEvent('error', JSON.stringify({ error: 'Failed to fetch live logs' }));
          console.error('Login activity SSE error:', error);
        }
      };

      sendEvent('ready', JSON.stringify({ success: true }));
      await pushLogs();
      interval = setInterval(pushLogs, 2000);
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
    },
  });

  request.signal.addEventListener('abort', () => {
    closed = true;
    if (interval) clearInterval(interval);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
