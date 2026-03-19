import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

// GET - List all pending admin registrations
export async function GET() {
  try {
    const pool = getPool();
    const result = await pool.query(
      `SELECT id, username, email, role, status, requested_at, reviewed_at, reviewed_by
       FROM pending_admins
       ORDER BY requested_at DESC`
    );
    return NextResponse.json({ success: true, pendingAdmins: result.rows });
  } catch (error: any) {
    console.error('Error fetching pending admins:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH - Approve or Reject a pending admin
export async function PATCH(request: Request) {
  try {
    const { id, action, reviewedBy } = await request.json();

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'ID and action are required' }, { status: 400 });
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Action must be "approve" or "reject"' }, { status: 400 });
    }

    const pool = getPool();

    // Fetch the pending admin record
    const pendingResult = await pool.query(
      `SELECT * FROM pending_admins WHERE id = $1`,
      [id]
    );

    if (pendingResult.rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Pending admin not found' }, { status: 404 });
    }

    const pending = pendingResult.rows[0];

    if (pending.status !== 'Pending') {
      return NextResponse.json({ success: false, error: 'This request has already been reviewed' }, { status: 409 });
    }

    if (action === 'approve') {
      // Check if email already exists in admins table
      const existingAdmin = await pool.query(
        `SELECT admin_id FROM admins WHERE email = $1`,
        [pending.email]
      );

      if (existingAdmin.rows.length > 0) {
        // Mark as approved in pending_admins (already in admins table somehow)
        await pool.query(
          `UPDATE pending_admins SET status = 'Approved', reviewed_at = NOW(), reviewed_by = $1 WHERE id = $2`,
          [reviewedBy || 'admin', id]
        );
        return NextResponse.json({ success: true, message: 'Admin already exists and has been marked approved.' });
      }

      // Insert into admins table
      await pool.query(
        `INSERT INTO admins (username, email, password_hash, role, is_active) VALUES ($1, $2, $3, $4, true)`,
        [pending.username, pending.email, pending.password_hash, pending.role]
      );

      // Update pending_admins status
      await pool.query(
        `UPDATE pending_admins SET status = 'Approved', reviewed_at = NOW(), reviewed_by = $1 WHERE id = $2`,
        [reviewedBy || 'admin', id]
      );

      return NextResponse.json({ success: true, message: `Admin "${pending.username}" approved and account activated.` });
    } else {
      // Reject: just update status
      await pool.query(
        `UPDATE pending_admins SET status = 'Rejected', reviewed_at = NOW(), reviewed_by = $1 WHERE id = $2`,
        [reviewedBy || 'admin', id]
      );
      return NextResponse.json({ success: true, message: `Admin registration for "${pending.username}" has been rejected.` });
    }
  } catch (error: any) {
    console.error('Error reviewing pending admin:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
