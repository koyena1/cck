import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { acceptOrderTask, formatAcceptanceSummary } from '@/lib/order-task-acceptance';

export async function POST(request: Request) {
  try {
    const { orderId, portal, actorName, actorDetails } = await request.json();

    if (!orderId || !portal || !actorName) {
      return NextResponse.json({ success: false, error: 'orderId, portal and actorName are required' }, { status: 400 });
    }

    if (!['admin', 'district'].includes(portal)) {
      return NextResponse.json({ success: false, error: 'Invalid portal' }, { status: 400 });
    }

    const pool = getPool();
    await pool.query('BEGIN');
    try {
      const result = await acceptOrderTask(pool, {
        orderId: Number(orderId),
        actorPortal: portal,
        actorName,
        actorDetails: actorDetails || null,
      });

      if (!result.accepted) {
        await pool.query('ROLLBACK');
        return NextResponse.json(
          {
            success: false,
            error: `Task already accepted by ${formatAcceptanceSummary(result.existing)}`,
            alreadyAcceptedBy: result.existing,
          },
          { status: 409 }
        );
      }

      await pool.query(
        `INSERT INTO order_status_history (order_id, status, remarks, created_at)
         VALUES ($1, (SELECT status FROM orders WHERE order_id = $1), $2, NOW())`,
        [
          Number(orderId),
          portal === 'admin'
            ? 'Task accepted by Protechtur Admin'
            : `Task accepted by District Manager: ${actorName}${actorDetails?.district ? ` (${actorDetails.district})` : ''}`,
        ]
      );

      await pool.query('COMMIT');
      return NextResponse.json({ success: true, acceptance: result.info });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error accepting order task:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Failed to accept task' }, { status: 500 });
  }
}