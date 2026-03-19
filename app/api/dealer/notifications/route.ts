import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - Fetch dealer notifications
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const dealerId = searchParams.get('dealerId');
    
    if (!dealerId) {
      return NextResponse.json(
        { success: false, error: 'Dealer ID is required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    // Fetch all notifications for the dealer
    const query = `
      SELECT 
        id,
        dealer_id,
        title,
        message,
        type,
        priority,
        is_read,
        sent_via_email,
        email_sent_at,
        created_by,
        created_at,
        read_at
      FROM dealer_notifications
      WHERE dealer_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [parseInt(dealerId)]);

    // Get unread count
    const unreadCountQuery = `
      SELECT COUNT(*) as unread_count
      FROM dealer_notifications
      WHERE dealer_id = $1 AND is_read = false
    `;
    
    const unreadResult = await pool.query(unreadCountQuery, [parseInt(dealerId)]);
    const unreadCount = parseInt(unreadResult.rows[0].unread_count);

    return NextResponse.json({
      success: true,
      notifications: result.rows,
      unreadCount: unreadCount
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH - Mark notification as read
export async function PATCH(request: Request) {
  try {
    const { notificationId, dealerId } = await request.json();
    
    if (!notificationId || !dealerId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID and Dealer ID are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    const query = `
      UPDATE dealer_notifications
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND dealer_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [notificationId, dealerId]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      notification: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE - Delete notification
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('notificationId');
    const dealerId = searchParams.get('dealerId');
    
    if (!notificationId || !dealerId) {
      return NextResponse.json(
        { success: false, error: 'Notification ID and Dealer ID are required' },
        { status: 400 }
      );
    }

    const pool = getPool();
    
    const query = `
      DELETE FROM dealer_notifications
      WHERE id = $1 AND dealer_id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [parseInt(notificationId), parseInt(dealerId)]);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Notification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
