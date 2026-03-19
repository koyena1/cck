export type TaskActorPortal = 'admin' | 'district';

export type TaskAcceptanceInfo = {
  portal: TaskActorPortal;
  name: string;
  details: Record<string, any> | null;
  acceptedAt: string;
};

export async function ensureOrderTaskAcceptanceColumns(client: { query: (sql: string, params?: any[]) => Promise<any> }) {
  await client.query(`
    ALTER TABLE orders
    ADD COLUMN IF NOT EXISTS task_accepted_by_portal VARCHAR(20),
    ADD COLUMN IF NOT EXISTS task_accepted_by_name TEXT,
    ADD COLUMN IF NOT EXISTS task_accepted_by_details JSONB,
    ADD COLUMN IF NOT EXISTS task_accepted_at TIMESTAMP NULL
  `);
}

export function formatAcceptanceSummary(info: TaskAcceptanceInfo) {
  if (info.portal === 'admin') {
    return 'Protechtur Admin';
  }

  const district = info.details?.district ? ` (${info.details.district})` : '';
  return `${info.name}${district}`;
}

export async function getExistingTaskAcceptance(
  client: { query: (sql: string, params?: any[]) => Promise<any> },
  orderId: number
): Promise<TaskAcceptanceInfo | null> {
  await ensureOrderTaskAcceptanceColumns(client);
  const result = await client.query(
    `SELECT task_accepted_by_portal, task_accepted_by_name, task_accepted_by_details, task_accepted_at
     FROM orders
     WHERE order_id = $1`,
    [orderId]
  );

  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  if (!row.task_accepted_at || !row.task_accepted_by_portal || !row.task_accepted_by_name) return null;

  return {
    portal: row.task_accepted_by_portal,
    name: row.task_accepted_by_name,
    details: row.task_accepted_by_details || null,
    acceptedAt: row.task_accepted_at,
  };
}

export async function acceptOrderTask(
  client: { query: (sql: string, params?: any[]) => Promise<any> },
  params: {
    orderId: number;
    actorPortal: TaskActorPortal;
    actorName: string;
    actorDetails?: Record<string, any> | null;
  }
): Promise<{ accepted: true; info: TaskAcceptanceInfo } | { accepted: false; existing: TaskAcceptanceInfo }> {
  await ensureOrderTaskAcceptanceColumns(client);

  const lockResult = await client.query(
    `SELECT order_id, status, task_accepted_by_portal, task_accepted_by_name, task_accepted_by_details, task_accepted_at
     FROM orders
     WHERE order_id = $1
     FOR UPDATE`,
    [params.orderId]
  );

  if (lockResult.rows.length === 0) {
    throw new Error('Order not found');
  }

  const row = lockResult.rows[0];
  if (row.task_accepted_at && row.task_accepted_by_portal && row.task_accepted_by_name) {
    if (
      row.task_accepted_by_portal === params.actorPortal &&
      row.task_accepted_by_name === params.actorName
    ) {
      return {
        accepted: true,
        info: {
          portal: row.task_accepted_by_portal,
          name: row.task_accepted_by_name,
          details: row.task_accepted_by_details || null,
          acceptedAt: row.task_accepted_at,
        },
      };
    }

    return {
      accepted: false,
      existing: {
        portal: row.task_accepted_by_portal,
        name: row.task_accepted_by_name,
        details: row.task_accepted_by_details || null,
        acceptedAt: row.task_accepted_at,
      },
    };
  }

  const updateResult = await client.query(
    `UPDATE orders
     SET task_accepted_by_portal = $2,
         task_accepted_by_name = $3,
         task_accepted_by_details = $4,
         task_accepted_at = NOW(),
         updated_at = NOW()
     WHERE order_id = $1
     RETURNING task_accepted_by_portal, task_accepted_by_name, task_accepted_by_details, task_accepted_at`,
    [params.orderId, params.actorPortal, params.actorName, params.actorDetails || null]
  );

  const acceptedRow = updateResult.rows[0];
  return {
    accepted: true,
    info: {
      portal: acceptedRow.task_accepted_by_portal,
      name: acceptedRow.task_accepted_by_name,
      details: acceptedRow.task_accepted_by_details || null,
      acceptedAt: acceptedRow.task_accepted_at,
    },
  };
}