import { getPool } from '@/lib/db';
import { createPortalNotification } from '@/lib/portal-notifications';

type SupportTicketEvent = 'created' | 'message' | 'assigned' | 'status';

type SupportTicketBellNotificationInput = {
  ticketId: number;
  ticketNumber?: string | null;
  customerName?: string | null;
  category?: string | null;
  subCategory?: string | null;
  district?: string | null;
  dealerId?: number | null;
  event: SupportTicketEvent;
  actorRole?: string | null;
  actorName?: string | null;
  messagePreview?: string | null;
  status?: string | null;
};

function trimText(value?: string | null) {
  return String(value || '').trim();
}

function toActorLabel(actorRole?: string | null, actorName?: string | null) {
  const normalizedRole = trimText(actorRole).toLowerCase();
  const name = trimText(actorName);

  if (normalizedRole === 'admin') return 'Admin(Protechtur)';
  if (normalizedRole === 'bpo') return name || 'BPO Agent';
  if (normalizedRole === 'district') return name || 'District Manager';
  if (normalizedRole === 'dealer') return name || 'Dealer';
  if (normalizedRole === 'customer') return name || 'Customer';
  return name || 'Support Team';
}

function buildNotificationText(input: SupportTicketBellNotificationInput) {
  const ticketNumber = trimText(input.ticketNumber) || `#${input.ticketId}`;
  const customerName = trimText(input.customerName) || 'Customer';
  const category = [trimText(input.category), trimText(input.subCategory)].filter(Boolean).join(' / ');
  const actor = toActorLabel(input.actorRole, input.actorName);
  const messagePreview = trimText(input.messagePreview);
  const normalizedStatus = trimText(input.status).replaceAll('_', ' ');

  if (input.event === 'created') {
    return {
      title: `New Support Ticket ${ticketNumber}`,
      message: `${customerName} raised a support ticket${category ? ` (${category})` : ''}.`,
      type: 'support_ticket_created',
      priority: 'high',
    };
  }

  if (input.event === 'assigned') {
    return {
      title: `Ticket Assigned ${ticketNumber}`,
      message: `${actor} assigned this support ticket to a dealer.`,
      type: 'support_ticket_assigned',
      priority: 'high',
    };
  }

  if (input.event === 'status') {
    return {
      title: `Ticket Status Updated ${ticketNumber}`,
      message: `${actor} updated status to ${normalizedStatus || 'open'}.`,
      type: 'support_ticket_status',
      priority: 'normal',
    };
  }

  return {
    title: `Ticket Message ${ticketNumber}`,
    message: `${actor} posted a new support message${messagePreview ? `: "${messagePreview.slice(0, 120)}"` : '.'}`,
    type: 'support_ticket_message',
    priority: 'normal',
  };
}

export async function sendSupportTicketBellNotifications(input: SupportTicketBellNotificationInput) {
  try {
    const details = buildNotificationText(input);
    const ticketId = input.ticketId;
    const district = trimText(input.district) || 'all';
    const dealerId = Number(input.dealerId);
    const actorRole = trimText(input.actorRole).toLowerCase();

    await createPortalNotification({
      portal: 'admin',
      title: details.title,
      message: details.message,
      type: details.type,
      priority: details.priority,
      actionUrl: '/admin/service',
      createdBy: 'support_system',
      metadata: {
        ticketId,
        event: input.event,
      },
    });

    await createPortalNotification({
      portal: 'district',
      recipientKey: district,
      title: details.title,
      message: details.message,
      type: details.type,
      priority: details.priority,
      actionUrl: '/district-portal/service-support',
      createdBy: 'support_system',
      metadata: {
        ticketId,
        event: input.event,
        district,
      },
    });

    await createPortalNotification({
      portal: 'bpo',
      title: details.title,
      message: details.message,
      type: details.type,
      priority: details.priority,
      actionUrl: '/bpo-portal/service-requests',
      createdBy: 'support_system',
      metadata: {
        ticketId,
        event: input.event,
      },
    });

    const recipientDealerIds = new Set<number>();
    if (Number.isFinite(dealerId) && dealerId > 0) {
      recipientDealerIds.add(dealerId);
    }

    // For admin/BPO/district updates, notify all currently assigned dealers as well.
    if (actorRole === 'admin' || actorRole === 'bpo' || actorRole === 'district') {
      const pool = getPool();
      const assignmentResult = await pool.query(
        `SELECT dealer_id
         FROM support_ticket_dealer_assignments
         WHERE ticket_id = $1
           AND dealer_id IS NOT NULL
           AND response_status IN ('pending', 'accepted', 'accepted_by_other')`,
        [ticketId]
      );

      for (const row of assignmentResult.rows) {
        const assignedDealerId = Number(row.dealer_id);
        if (Number.isFinite(assignedDealerId) && assignedDealerId > 0) {
          recipientDealerIds.add(assignedDealerId);
        }
      }
    }

    if (recipientDealerIds.size > 0) {
      const pool = getPool();
      for (const recipientDealerId of recipientDealerIds) {
        await pool.query(
          `INSERT INTO dealer_notifications (
            dealer_id,
            title,
            message,
            type,
            priority,
            is_read,
            created_by
          ) VALUES ($1, $2, $3, $4, $5, false, $6)`,
          [
            recipientDealerId,
            details.title,
            details.message,
            details.type,
            details.priority,
            'support_system'
          ]
        );
      }
    }
  } catch (error) {
    console.error('Support bell notification error:', error);
  }
}
