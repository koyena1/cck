import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

async function ensurePortalNotificationsTable() {
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

export async function GET(request: Request) {
  try {
    await ensurePortalNotificationsTable();

    const { searchParams } = new URL(request.url);
    const portal = (searchParams.get('portal') || '').trim().toLowerCase();
    const recipientKey = (searchParams.get('recipientKey') || '').trim();

    if (!portal) {
      return NextResponse.json({ success: false, error: 'portal is required' }, { status: 400 });
    }

    const pool = getPool();
    let query = '';
    let params: any[] = [];

    if (portal === 'admin') {
      query = `
        SELECT * FROM portal_notifications
        WHERE portal = 'admin'
        ORDER BY created_at DESC
        LIMIT 100
      `;
    } else if (portal === 'district') {
      if (!recipientKey) {
        return NextResponse.json({ success: false, error: 'recipientKey is required for district' }, { status: 400 });
      }

      query = `
        SELECT * FROM portal_notifications
        WHERE portal = 'district'
          AND (LOWER(recipient_key) = LOWER($1) OR recipient_key = 'all')
        ORDER BY created_at DESC
        LIMIT 100
      `;
      params = [recipientKey];
    } else if (portal === 'dealer') {
      if (!recipientKey) {
        return NextResponse.json({ success: false, error: 'recipientKey is required for dealer' }, { status: 400 });
      }

      query = `
        SELECT * FROM portal_notifications
        WHERE portal = 'dealer'
          AND recipient_key = $1
        ORDER BY created_at DESC
        LIMIT 100
      `;
      params = [recipientKey];
    } else {
      return NextResponse.json({ success: false, error: 'Unsupported portal value' }, { status: 400 });
    }

    const result = await pool.query(query, params);
    const unreadCount = result.rows.filter((r: any) => !r.is_read).length;

    return NextResponse.json({
      success: true,
      notifications: result.rows,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching portal notifications:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensurePortalNotificationsTable();

    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'notificationId is required' }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `
      UPDATE portal_notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
      `,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('Error updating portal notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to update notification' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensurePortalNotificationsTable();

    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');

    if (!notificationId) {
      return NextResponse.json({ success: false, error: 'notificationId is required' }, { status: 400 });
    }

    const pool = getPool();
    const result = await pool.query(
      `DELETE FROM portal_notifications WHERE id = $1 RETURNING id`,
      [notificationId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting portal notification:', error);
    return NextResponse.json({ success: false, error: 'Failed to delete notification' }, { status: 500 });
  }
}
