-- Quick SQL Queries for District Management System

-- =====================================================
-- 1. UPDATE EXISTING DEALERS WITH DISTRICT/STATE
-- =====================================================

-- Option A: Based on PIN codes (customize for your areas)
UPDATE dealers 
SET district = 'Mumbai City', state = 'Maharashtra' 
WHERE service_pin LIKE '400%';

UPDATE dealers 
SET district = 'Delhi', state = 'Delhi' 
WHERE service_pin LIKE '110%';

UPDATE dealers 
SET district = 'Bangalore Urban', state = 'Karnataka' 
WHERE service_pin LIKE '560%';

UPDATE dealers 
SET district = 'Kolkata', state = 'West Bengal' 
WHERE service_pin LIKE '700%';

-- Option B: Update individually by dealer ID
UPDATE dealers 
SET district = 'YourDistrict', state = 'YourState' 
WHERE dealer_id = 1;

-- =====================================================
-- 2. VERIFY DISTRICT ASSIGNMENTS
-- =====================================================

-- Check all dealers by district
SELECT 
    district, 
    state, 
    COUNT(*) as dealer_count,
    COUNT(CASE WHEN status = 'Active' THEN 1 END) as active_count
FROM dealers
WHERE district IS NOT NULL
GROUP BY district, state
ORDER BY state, district;

-- View dealers without district assignment
SELECT dealer_id, business_name, location, service_pin
FROM dealers
WHERE district IS NULL OR state IS NULL;

-- =====================================================
-- 3. VIEW DISTRICT STATISTICS
-- =====================================================

-- Dealer stats by district
SELECT * FROM district_dealer_stats
ORDER BY state, district;

-- Order stats by district
SELECT * FROM district_order_stats
ORDER BY state, district;

-- =====================================================
-- 4. MANAGE DISTRICT USERS (Manual)
-- =====================================================

-- View all district users
SELECT 
    district_user_id,
    username,
    full_name,
    district,
    state,
    is_active,
    last_login,
    created_at
FROM district_users
ORDER BY created_at DESC;

-- Activate/deactivate user
UPDATE district_users 
SET is_active = true 
WHERE username = 'mumbai_manager';

-- Update user permissions
UPDATE district_users 
SET 
    can_view_dealers = true,
    can_view_orders = true,
    can_contact_dealers = true
WHERE username = 'mumbai_manager';

-- Reset user password (use bcrypt hash)
-- Generate hash: https://bcrypt-generator.com/ or via Node.js
UPDATE district_users 
SET password_hash = '$2b$10$YourHashedPasswordHere'
WHERE username = 'mumbai_manager';

-- =====================================================
-- 5. ACTIVITY LOG QUERIES
-- =====================================================

-- View recent activity
SELECT 
    du.username,
    du.full_name,
    al.activity_type,
    al.description,
    al.created_at
FROM district_user_activity_log al
JOIN district_users du ON al.district_user_id = du.district_user_id
ORDER BY al.created_at DESC
LIMIT 50;

-- Activity by specific user
SELECT 
    activity_type,
    description,
    created_at,
    ip_address
FROM district_user_activity_log
WHERE district_user_id = 1
ORDER BY created_at DESC;

-- Login history
SELECT 
    du.username,
    al.created_at as login_time,
    al.ip_address
FROM district_user_activity_log al
JOIN district_users du ON al.district_user_id = du.district_user_id
WHERE al.activity_type = 'login'
ORDER BY al.created_at DESC;

-- =====================================================
-- 6. DELETE DISTRICT USER
-- =====================================================

-- WARNING: This will also delete all activity logs
DELETE FROM district_users 
WHERE username = 'username_here';

-- =====================================================
-- 7. DISTRICT-WISE REPORTS
-- =====================================================

-- Complete district overview
SELECT 
    d.district,
    d.state,
    COUNT(DISTINCT deal.dealer_id) as total_dealers,
    COUNT(DISTINCT o.order_id) as total_orders,
    SUM(o.total_amount) as total_revenue,
    AVG(deal.rating) as avg_dealer_rating
FROM dealers deal
LEFT JOIN orders o ON o.assigned_dealer_id = deal.dealer_id
WHERE deal.district IS NOT NULL
GROUP BY d.district, d.state
ORDER BY total_revenue DESC;

-- Top performing districts
SELECT 
    district,
    state,
    COUNT(dealer_id) as dealers,
    AVG(rating) as avg_rating,
    SUM(completed_jobs) as total_jobs
FROM dealers
WHERE district IS NOT NULL
GROUP BY district, state
ORDER BY total_jobs DESC
LIMIT 10;

-- =====================================================
-- 8. MAINTENANCE QUERIES
-- =====================================================

-- Find duplicate district users
SELECT email, COUNT(*) 
FROM district_users 
GROUP BY email 
HAVING COUNT(*) > 1;

-- Clean up old activity logs (older than 90 days)
DELETE FROM district_user_activity_log
WHERE created_at < NOW() - INTERVAL '90 days';

-- Update districts in bulk (example for Maharashtra)
UPDATE dealers 
SET state = 'Maharashtra'
WHERE district IN ('Mumbai City', 'Pune', 'Nagpur', 'Nashik');

-- =====================================================
-- 9. CREATE SAMPLE TEST USER (FOR DEVELOPMENT)
-- =====================================================

-- Password: "Test@123" (bcrypt hash below)
INSERT INTO district_users (
    username,
    email,
    password_hash,
    full_name,
    district,
    state,
    can_view_dealers,
    can_view_orders,
    can_contact_dealers
) VALUES (
    'test_district',
    'test@example.com',
    '$2b$10$rZ7KqBK5YO0Y8Y8Y8Y8Y8uO0Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y8Y', -- Replace with actual hash
    'Test District Manager',
    'Test District',
    'Test State',
    true,
    true,
    true
);

-- =====================================================
-- 10. BACKUP QUERIES
-- =====================================================

-- Export district users (for backup)
COPY (
    SELECT * FROM district_users
) TO '/path/to/district_users_backup.csv' CSV HEADER;

-- Export activity logs
COPY (
    SELECT * FROM district_user_activity_log
    WHERE created_at >= NOW() - INTERVAL '30 days'
) TO '/path/to/activity_log_backup.csv' CSV HEADER;
