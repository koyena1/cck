import { getPool } from '@/lib/db';

export interface PortalNotificationInput {
  portal: 'admin' | 'district' | 'dealer';
  recipientKey?: string | null;
  title: string;
  message: string;
  type?: string;
  priority?: string;
  actionUrl?: string;
  createdBy?: string;
  metadata?: any;
}

export async function ensurePortalNotificationsTable() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS portal_notifications (
      id SERIAL PRIMARY KEY,
      portal VARCHAR(20) NOT NULL,
      recipient_key VARCHAR(120),
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      type VARCHAR(50) DEFAULT 'info',
      priority VARCHAR(20) DEFAULT 'normal',
      action_url TEXT,
      metadata JSONB,
      is_read BOOLEAN DEFAULT false,
      created_by VARCHAR(50) DEFAULT 'system',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      read_at TIMESTAMP
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_portal_notifications_scope ON portal_notifications(portal, recipient_key, created_at DESC)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_portal_notifications_unread ON portal_notifications(portal, recipient_key, is_read) WHERE is_read = false`);
}

export async function createPortalNotification(input: PortalNotificationInput) {
  try {
    await ensurePortalNotificationsTable();
    const pool = getPool();
    await pool.query(
      `INSERT INTO portal_notifications (
        portal, recipient_key, title, message, type, priority, action_url, metadata, created_by
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        input.portal,
        input.recipientKey || null,
        input.title,
        input.message,
        input.type || 'info',
        input.priority || 'normal',
        input.actionUrl || null,
        input.metadata ? JSON.stringify(input.metadata) : null,
        input.createdBy || 'system',
      ]
    );
  } catch (error) {
    console.error('Failed to create portal notification:', error);
  }
}

export async function notifyNewOrderPlaced(payload: {
  orderId: number;
  orderNumber: string;
  customerName: string;
  city?: string | null;
  pincode?: string | null;
  totalAmount?: number;
  district?: string | null;
}) {
  const districtKey = (payload.district || '').trim() || 'all';
  const amount = Number(payload.totalAmount || 0);
  const amountText = Number.isFinite(amount) ? amount.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : '0';

  await createPortalNotification({
    portal: 'admin',
    title: `New Order ${payload.orderNumber}`,
    message: `${payload.customerName} placed a new order${payload.city ? ` from ${payload.city}` : ''}${payload.pincode ? ` (${payload.pincode})` : ''}. Amount: ${amountText}`,
    type: 'new_order',
    priority: 'high',
    actionUrl: '/admin/orders',
    createdBy: 'system',
    metadata: {
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      district: districtKey,
    },
  });

  await createPortalNotification({
    portal: 'district',
    recipientKey: districtKey,
    title: `New Order ${payload.orderNumber}`,
    message: `${payload.customerName} placed a new order${payload.city ? ` in ${payload.city}` : ''}${payload.pincode ? ` (${payload.pincode})` : ''}.`,
    type: 'new_order',
    priority: 'high',
    actionUrl: '/district-portal/dashboard',
    createdBy: 'system',
    metadata: {
      orderId: payload.orderId,
      orderNumber: payload.orderNumber,
      district: districtKey,
    },
  });
}
