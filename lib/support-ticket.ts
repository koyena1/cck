import { Pool } from 'pg';

export const SUPPORT_CATEGORIES: Record<string, string[]> = {
  'KYC Update Request': [
    'PAN Update',
    'Bank Details Update',
    'Address Correction',
    'GST Details Update'
  ],
  'Finance Related Issue': [
    'Payment Not Received',
    'Invoice Mismatch',
    'Wallet Balance Query',
    'Refund Delay'
  ],
  'Order Related Issue': [
    'Missing Item',
    'Wrong Item Delivered',
    'Delayed Delivery',
    'Damaged Product'
  ],
  'Catalog Update Request': [
    'Product Image Change',
    'Product Description Change',
    'Price Correction',
    'Stock Visibility Issue'
  ],
  'General Issues': [
    'Login Problem',
    'Portal Error',
    'Notification Issue',
    'Other General Query'
  ],
  'Supplier Panel Related Issue': [
    'Panel Access Issue',
    'Feature Not Working',
    'Data Sync Problem',
    'Performance Issue'
  ],
  Other: [
    'Other'
  ]
};

export type TicketViewerRole = 'customer' | 'admin' | 'district' | 'dealer';
export type TicketChannel = 'customer' | 'dealer';

export function isValidCategorySelection(category: string, subCategory: string) {
  const allowedSubCategories = SUPPORT_CATEGORIES[category];
  if (!allowedSubCategories) return false;
  return allowedSubCategories.includes(subCategory);
}

export function generateTicketNumber() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const suffix = String(Math.floor(Math.random() * 9000) + 1000);
  return `SUP-${yyyy}${mm}${dd}-${suffix}`;
}

export async function ensureSupportTicketTables(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_tickets (
      ticket_id SERIAL PRIMARY KEY,
      ticket_number VARCHAR(40) UNIQUE NOT NULL,
      customer_id INTEGER NULL REFERENCES customers(customer_id),
      customer_name VARCHAR(120) NOT NULL,
      customer_email VARCHAR(140) NOT NULL,
      customer_phone VARCHAR(25),
      category VARCHAR(120) NOT NULL,
      sub_category VARCHAR(120) NOT NULL,
      reference_order_id INTEGER NULL REFERENCES orders(order_id),
      reference_order_number VARCHAR(60),
      description TEXT NOT NULL,
      attachment_url TEXT,
      district VARCHAR(100),
      dealer_id INTEGER NULL REFERENCES dealers(dealer_id),
      status VARCHAR(40) NOT NULL DEFAULT 'open',
      priority VARCHAR(20) NOT NULL DEFAULT 'normal',
      last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      message_id SERIAL PRIMARY KEY,
      ticket_id INTEGER NOT NULL REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
      channel VARCHAR(20) NOT NULL DEFAULT 'customer',
      sender_role VARCHAR(20) NOT NULL,
      sender_name VARCHAR(120),
      message_text TEXT NOT NULL,
      attachment_url TEXT,
      is_internal BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query('CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_email ON support_tickets(customer_email)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_support_tickets_district ON support_tickets(district)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_support_tickets_dealer_id ON support_tickets(dealer_id)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)');
  await pool.query('CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_ticket_messages(ticket_id)');
}

export function normalizeTicketStatus(status?: string) {
  const value = String(status || '').toLowerCase();
  if (['open', 'in_progress', 'awaiting_customer', 'resolved', 'closed'].includes(value)) {
    return value;
  }
  return 'open';
}

export function normalizeChannel(channel?: string): TicketChannel {
  return channel === 'dealer' ? 'dealer' : 'customer';
}

export function displaySenderName(role: TicketViewerRole, name?: string) {
  if (name && name.trim()) return name.trim();
  if (role === 'admin') return 'Admin';
  if (role === 'district') return 'District Manager';
  if (role === 'dealer') return 'Dealer';
  return 'Customer';
}
