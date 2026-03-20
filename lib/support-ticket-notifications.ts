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

    if (Number.isFinite(dealerId) && dealerId > 0) {
      const pool = getPool();
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
          dealerId,
          details.title,
          details.message,
          details.type,
          details.priority,
          'support_system'
        ]
      );
    }
  } catch (error) {
    console.error('Support bell notification error:', error);
  }
}
