-- Query 1: Check if Orders Exist in Database
SELECT 
  order_id,
  order_number,
  customer_email,
  customer_name,
  payment_status,
  status,
  created_at,
  is_guest_order
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- Query 2: Check Email Logs
SELECT 
  email_id,
  order_id,
  recipient_email,
  email_type,
  email_status,
  error_message,
  sent_at
FROM email_logs
ORDER BY sent_at DESC
LIMIT 20;

-- Query 3: Check Order Status History
SELECT 
  order_id,
  order_number,
  status,
  created_at
FROM order_status_history
WHERE status IN ('Paid', 'Advance Paid')
ORDER BY created_at DESC
LIMIT 20;

-- Query 4: Check Order Items (replace 180 with your order ID)
SELECT 
  oi.id,
  oi.order_id,
  oi.product_id,
  oi.item_name,
  oi.quantity,
  oi.hsn_code,
  oi.item_type
FROM order_items oi
WHERE oi.order_id = 180
ORDER BY oi.id;
