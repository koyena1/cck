-- ============================================
-- Quick Reference SQL Queries
-- For use in pgAdmin Query Tool
-- ============================================

-- ============================================
-- 1. VIEW ALL ORDERS (Both Types)
-- ============================================
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  customer_phone,
  customer_email,
  city,
  pincode,
  total_amount,
  status,
  payment_method,
  payment_status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 2. VIEW PRODUCT CART ORDERS ONLY
-- ============================================
SELECT 
  order_id,
  order_number,
  customer_name,
  customer_phone,
  installation_address,
  city,
  state,
  pincode,
  products,              -- JSONB array of cart products
  products_total,
  includes_installation,
  installation_charges,
  with_amc,
  amc_cost,
  total_amount,
  payment_method,
  status,
  created_at
FROM orders
WHERE order_type = 'product_cart'
ORDER BY created_at DESC;

-- ============================================
-- 3. VIEW QUOTATION ORDERS ONLY
-- ============================================
SELECT 
  order_id,
  order_number,
  customer_name,
  customer_phone,
  order_type,
  combo_id,
  camera_type,
  brand,
  channels,
  indoor_cameras,
  outdoor_cameras,
  storage_size,
  total_amount,
  status,
  assigned_dealer_id,
  created_at
FROM orders
WHERE order_type IN ('hd_combo', 'quotation', 'ip_combo')
ORDER BY created_at DESC;

-- ============================================
-- 4. ORDER STATISTICS BY TYPE
-- ============================================
SELECT 
  order_type,
  COUNT(*) as total_orders,
  COUNT(*) FILTER (WHERE status ILIKE 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status ILIKE 'in-progress') as in_progress_count,
  COUNT(*) FILTER (WHERE status ILIKE 'completed') as completed_count,
  SUM(total_amount) as total_revenue
FROM orders
GROUP BY order_type
ORDER BY total_orders DESC;

-- ============================================
-- 5. TODAY'S ORDERS
-- ============================================
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  total_amount,
  status,
  created_at
FROM orders
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- ============================================
-- 6. PENDING ORDERS (All Types)
-- ============================================
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  customer_phone,
  city,
  total_amount,
  created_at
FROM orders
WHERE status ILIKE 'pending'
ORDER BY created_at DESC;

-- ============================================
-- 7. CHECK PRODUCT DETAILS IN CART ORDER
-- ============================================
SELECT 
  order_id,
  order_number,
  customer_name,
  products,
  products_total
FROM orders
WHERE order_type = 'product_cart'
  AND order_id = 123  -- Replace with actual order_id
LIMIT 1;

-- To expand JSONB products array:
SELECT 
  order_id,
  order_number,
  jsonb_array_elements(products) as product_details
FROM orders
WHERE order_type = 'product_cart'
  AND order_id = 123;  -- Replace with actual order_id

-- ============================================
-- 8. UPDATE ORDER STATUS
-- ============================================
UPDATE orders
SET 
  status = 'in-progress',
  updated_at = NOW()
WHERE order_id = 123;  -- Replace with actual order_id

-- ============================================
-- 9. SEARCH ORDERS BY CUSTOMER PHONE
-- ============================================
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  customer_phone,
  total_amount,
  status,
  created_at
FROM orders
WHERE customer_phone LIKE '%9876543210%'  -- Replace with phone number
ORDER BY created_at DESC;

-- ============================================
-- 10. REVENUE BY ORDER TYPE (This Month)
-- ============================================
SELECT 
  order_type,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as average_order_value
FROM orders
WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY order_type;

-- ============================================
-- 11. CHECK IF MIGRATION WAS SUCCESSFUL
-- ============================================
-- Check if new columns exist
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'orders'
  AND column_name IN ('products', 'products_total', 'with_amc', 'amc_details', 'amc_cost', 'landmark')
ORDER BY column_name;

-- ============================================
-- 12. VIEW PRODUCT_CART_ORDERS VIEW
-- ============================================
SELECT * FROM product_cart_orders
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 13. VIEW QUOTATION_ORDERS VIEW
-- ============================================
SELECT * FROM quotation_orders
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 14. COUNT ORDERS BY STATUS (Case-Insensitive)
-- ============================================
SELECT 
  LOWER(status) as normalized_status,
  COUNT(*) as count
FROM orders
GROUP BY LOWER(status)
ORDER BY count DESC;

-- ============================================
-- 15. RECENT ORDERS WITH ALL DETAILS
-- ============================================
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  customer_phone,
  customer_email,
  installation_address,
  city,
  state,
  pincode,
  landmark,
  CASE 
    WHEN order_type = 'product_cart' THEN products
    ELSE NULL
  END as cart_products,
  CASE
    WHEN order_type IN ('hd_combo', 'quotation') THEN 
      jsonb_build_object(
        'camera_type', camera_type,
        'brand', brand,
        'channels', channels,
        'indoor_cameras', indoor_cameras,
        'outdoor_cameras', outdoor_cameras
      )
    ELSE NULL
  END as combo_details,
  total_amount,
  payment_method,
  payment_status,
  status,
  created_at
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 16. BACKUP ORDERS TABLE (Before Making Changes)
-- ============================================
-- CREATE TABLE orders_backup AS SELECT * FROM orders;
-- Uncomment above to create a backup

-- ============================================
-- 17. ORDERS WITH AMC SERVICE
-- ============================================
SELECT 
  order_id,
  order_number,
  customer_name,
  customer_phone,
  amc_details,
  amc_cost,
  total_amount,
  created_at
FROM orders
WHERE with_amc = true
ORDER BY created_at DESC;

-- ============================================
-- 18. ORDERS WITH INSTALLATION
-- ============================================
SELECT 
  order_id,
  order_number,
  order_type,
  customer_name,
  city,
  installation_charges,
  total_amount,
  status,
  created_at
FROM orders
WHERE includes_installation = true
ORDER BY created_at DESC;

-- ============================================
-- 19. TOP CUSTOMERS BY ORDER VALUE
-- ============================================
SELECT 
  customer_name,
  customer_phone,
  COUNT(*) as order_count,
  SUM(total_amount) as total_spent,
  AVG(total_amount) as avg_order_value
FROM orders
GROUP BY customer_name, customer_phone
HAVING COUNT(*) > 1
ORDER BY total_spent DESC
LIMIT 10;

-- ============================================
-- 20. ORDERS BY CITY
-- ============================================
SELECT 
  city,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue
FROM orders
WHERE city IS NOT NULL
GROUP BY city
ORDER BY order_count DESC
LIMIT 10;
