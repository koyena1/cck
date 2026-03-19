-- ========================================
-- DISTRICT-WISE DEALER LOCATION MANAGEMENT SYSTEM
-- ========================================
-- This script adds tables for district-based user management
-- Only admins can create district users who manage dealers in their district

-- 1. Add district columns to dealers table
ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS district VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Update location field comment
COMMENT ON COLUMN dealers.district IS 'District/region where dealer operates';
COMMENT ON COLUMN dealers.state IS 'State where dealer operates';

-- 2. Create district_users table for district-level portal access
CREATE TABLE IF NOT EXISTS district_users (
    district_user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15),
    
    -- District assignment (one user can manage one district)
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    
    -- Status and permissions
    is_active BOOLEAN DEFAULT true,
    can_view_dealers BOOLEAN DEFAULT true,
    can_view_orders BOOLEAN DEFAULT true,
    can_contact_dealers BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by INTEGER REFERENCES admins(admin_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create activity log for district users
CREATE TABLE IF NOT EXISTS district_user_activity_log (
    log_id SERIAL PRIMARY KEY,
    district_user_id INTEGER REFERENCES district_users(district_user_id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- login, view_dealer, view_order, contact_dealer, etc.
    description TEXT,
    metadata JSONB, -- Additional data like dealer_id, order_id, etc.
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dealers_district ON dealers(district);
CREATE INDEX IF NOT EXISTS idx_dealers_state ON dealers(state);
CREATE INDEX IF NOT EXISTS idx_district_users_district ON district_users(district);
CREATE INDEX IF NOT EXISTS idx_district_users_active ON district_users(is_active);
CREATE INDEX IF NOT EXISTS idx_district_activity_user ON district_user_activity_log(district_user_id);

-- 5. Create view for district-wise dealer statistics
CREATE OR REPLACE VIEW district_dealer_stats AS
SELECT 
    d.district,
    d.state,
    COUNT(d.dealer_id) as total_dealers,
    COUNT(CASE WHEN d.status = 'Active' THEN 1 END) as active_dealers,
    COUNT(CASE WHEN d.status = 'Pending Approval' THEN 1 END) as pending_dealers,
    AVG(d.rating) as average_rating,
    SUM(d.completed_jobs) as total_completed_jobs
FROM dealers d
WHERE d.district IS NOT NULL
GROUP BY d.district, d.state;

-- 6. Create view for district-wise order statistics
CREATE OR REPLACE VIEW district_order_stats AS
SELECT 
    d.district,
    d.state,
    COUNT(o.order_id) as total_orders,
    COUNT(CASE WHEN o.status = 'Pending' THEN 1 END) as pending_orders,
    COUNT(CASE WHEN o.status = 'Allocated' THEN 1 END) as allocated_orders,
    COUNT(CASE WHEN o.status = 'Completed' THEN 1 END) as completed_orders,
    SUM(o.total_amount) as total_order_value
FROM orders o
JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
WHERE d.district IS NOT NULL
GROUP BY d.district, d.state;

-- 7. Function to log district user activity
CREATE OR REPLACE FUNCTION log_district_user_activity(
    p_district_user_id INTEGER,
    p_activity_type VARCHAR,
    p_description TEXT,
    p_metadata JSONB DEFAULT NULL,
    p_ip_address VARCHAR DEFAULT NULL
) RETURNS void AS $$
BEGIN
    INSERT INTO district_user_activity_log (
        district_user_id, 
        activity_type, 
        description, 
        metadata, 
        ip_address
    )
    VALUES (
        p_district_user_id,
        p_activity_type,
        p_description,
        p_metadata,
        p_ip_address
    );
END;
$$ LANGUAGE plpgsql;

-- 8. Update timestamp trigger for district_users table
CREATE OR REPLACE FUNCTION update_district_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_district_user_timestamp
BEFORE UPDATE ON district_users
FOR EACH ROW
EXECUTE FUNCTION update_district_user_timestamp();

-- 9. Add sample districts data (adjust based on your regions)
-- This is for reference - remove or modify based on your actual districts
/*
UPDATE dealers 
SET district = 'Mumbai City', state = 'Maharashtra' 
WHERE service_pin LIKE '400%';

UPDATE dealers 
SET district = 'Delhi', state = 'Delhi' 
WHERE service_pin LIKE '110%';

UPDATE dealers 
SET district = 'Bangalore Urban', state = 'Karnataka' 
WHERE service_pin LIKE '560%';
*/

COMMENT ON TABLE district_users IS 'District-level users who can view and manage dealers in their assigned district';
COMMENT ON TABLE district_user_activity_log IS 'Activity log for district users for audit and monitoring';
COMMENT ON VIEW district_dealer_stats IS 'Statistical view of dealers grouped by district';
COMMENT ON VIEW district_order_stats IS 'Statistical view of orders grouped by district';

-- 10. Grant necessary permissions (adjust based on your setup)
-- GRANT SELECT, INSERT, UPDATE ON district_users TO your_app_user;
-- GRANT SELECT, INSERT ON district_user_activity_log TO your_app_user;
-- GRANT SELECT ON district_dealer_stats, district_order_stats TO your_app_user;

SELECT 'District management system schema created successfully!' as message;
