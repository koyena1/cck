import { getPool } from '@/lib/db';

export type LoginEntityType = 'dealer' | 'district_manager' | 'bpo';
export type LoginEventType = 'login' | 'logout';

export type LoginActivityInput = {
  entityType: LoginEntityType;
  entityId: string;
  entityName: string;
  portal: 'dealer' | 'district' | 'bpo';
  eventType: LoginEventType;
  ipAddress?: string | null;
  userAgent?: string | null;
};

let ensurePromise: Promise<void> | null = null;

export async function ensureLoginActivityTable() {
  if (ensurePromise) {
    return ensurePromise;
  }

  ensurePromise = (async () => {
    const pool = getPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS portal_login_activity (
        id SERIAL PRIMARY KEY,
        entity_type VARCHAR(30) NOT NULL,
        entity_id VARCHAR(80) NOT NULL,
        entity_name VARCHAR(180) NOT NULL,
        portal VARCHAR(30) NOT NULL,
        event_type VARCHAR(20) NOT NULL,
        ip_address VARCHAR(80),
        user_agent TEXT,
        occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query('CREATE INDEX IF NOT EXISTS idx_portal_login_activity_time ON portal_login_activity(occurred_at DESC)');
    await pool.query('CREATE INDEX IF NOT EXISTS idx_portal_login_activity_type ON portal_login_activity(entity_type, event_type)');
  })().catch((error) => {
    ensurePromise = null;
    throw error;
  });

  return ensurePromise;
}

export async function recordLoginActivity(input: LoginActivityInput) {
  try {
    await ensureLoginActivityTable();
    const pool = getPool();

    await pool.query(
      `INSERT INTO portal_login_activity (
        entity_type,
        entity_id,
        entity_name,
        portal,
        event_type,
        ip_address,
        user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        input.entityType,
        input.entityId,
        input.entityName,
        input.portal,
        input.eventType,
        input.ipAddress || null,
        input.userAgent || null,
      ]
    );
  } catch (error) {
    console.error('Failed to record login activity:', error);
  }
}

export function getRequestIpAddress(headers: Headers) {
  const forwarded = headers.get('x-forwarded-for') || headers.get('x-real-ip') || '';
  if (!forwarded) return null;
  return forwarded.split(',')[0].trim() || null;
}
