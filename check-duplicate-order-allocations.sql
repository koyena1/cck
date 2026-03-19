-- Check for duplicate order allocations
-- Run this to see if an order was allocated to multiple dealers

-- 1. Find orders allocated to multiple dealers
SELECT 
    o.order_id,
    o.order_number,
    o.customer_name,
    o.created_at,
    COUNT(DISTINCT dor.dealer_id) as dealer_count,
    STRING_AGG(DISTINCT d.business_name, ', ') as dealers
FROM orders o
LEFT JOIN dealer_order_requests dor ON o.order_id = dor.order_id
LEFT JOIN dealers d ON dor.dealer_id = d.dealer_id
WHERE o.created_at >= CURRENT_DATE -- Today's orders
GROUP BY o.order_id, o.order_number, o.customer_name, o.created_at
HAVING COUNT(DISTINCT dor.dealer_id) > 1
ORDER BY o.created_at DESC;

-- 2. View all dealer requests for recent orders
SELECT 
    o.order_number,
    o.customer_name,
    o.created_at as order_time,
    d.business_name as dealer,
    dor.request_status,
    dor.created_at as request_time,
    dor.dealer_response_at
FROM orders o
LEFT JOIN dealer_order_requests dor ON o.order_id = dor.order_id
LEFT JOIN dealers d ON dor.dealer_id = d.dealer_id
WHERE o.created_at >= CURRENT_DATE -- Today's orders
ORDER BY o.created_at DESC, dor.created_at ASC;

-- 3. Check order allocation log for a specific order
-- Replace ORDER_ID with actual order ID
SELECT 
    log_id,
    log_type,
    message,
    dealer_id,
    created_at,
    details
FROM order_allocation_log
WHERE order_id = (
    SELECT order_id FROM orders WHERE order_number = 'YOUR_ORDER_NUMBER_HERE'
)
ORDER BY created_at ASC;

-- 4. Find the most recent order with multiple dealers (if any)
WITH recent_duplicates AS (
    SELECT 
        o.order_id,
        o.order_number,
        COUNT(DISTINCT dor.dealer_id) as dealer_count
    FROM orders o
    LEFT JOIN dealer_order_requests dor ON o.order_id = dor.order_id
    WHERE o.created_at >= CURRENT_DATE
    GROUP BY o.order_id, o.order_number
    HAVING COUNT(DISTINCT dor.dealer_id) > 1
    ORDER BY o.order_id DESC
    LIMIT 1
)
SELECT 
    o.order_number,
    o.customer_name,
    o.total_amount,
    o.created_at,
    d.business_name as dealer_name,
    dor.request_status,
    dor.stock_verified,
    dor.stock_available,
    dor.created_at as request_sent_at
FROM recent_duplicates rd
JOIN orders o ON rd.order_id = o.order_id
JOIN dealer_order_requests dor ON o.order_id = dor.order_id
JOIN dealers d ON dor.dealer_id = d.dealer_id
ORDER BY dor.created_at;

-- 5. Prevention check: See if order allocation is called multiple times
SELECT 
    order_id,
    log_type,
    message,
    COUNT(*) as occurrence_count,
    MIN(created_at) as first_time,
    MAX(created_at) as last_time
FROM order_allocation_log
WHERE order_id IN (
    SELECT order_id FROM orders WHERE created_at >= CURRENT_DATE
)
AND log_type = 'allocation_started'
GROUP BY order_id, log_type, message
HAVING COUNT(*) > 1;
