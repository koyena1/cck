-- SUPPORT TICKET SYSTEM
-- Run this script once in PostgreSQL if you want explicit migration tracking.

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
);

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
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_customer_email ON support_tickets(customer_email);
CREATE INDEX IF NOT EXISTS idx_support_tickets_district ON support_tickets(district);
CREATE INDEX IF NOT EXISTS idx_support_tickets_dealer_id ON support_tickets(dealer_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_messages_ticket_id ON support_ticket_messages(ticket_id);
