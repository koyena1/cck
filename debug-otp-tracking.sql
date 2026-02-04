-- Helper script to debug OTP tracking issues
-- Run this to see what phone numbers have orders

-- 1. Check if order_tracking_otps table exists
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'order_tracking_otps'
        ) 
        THEN '✓ Table EXISTS' 
        ELSE '✗ Table MISSING - Run update-otp-table.sql'
    END as otp_table_status;

-- 2. Show all phone numbers with orders
SELECT 
    customer_phone,
    COUNT(*) as order_count,
    MAX(created_at) as latest_order
FROM orders 
WHERE customer_phone IS NOT NULL
GROUP BY customer_phone
ORDER BY latest_order DESC
LIMIT 10;

-- 3. Check specific phone number
SELECT 
    order_id,
    order_number,
    customer_name,
    customer_phone,
    status,
    created_at
FROM orders 
WHERE customer_phone = '6294880595'
LIMIT 5;
