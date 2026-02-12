-- ========================================
-- GUEST CHECKOUT SYSTEM
-- ========================================
-- Enhances the orders table to support guest checkout with order tracking tokens

-- Add guest checkout columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_token VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS is_guest_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tracking_link_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customer_id INTEGER REFERENCES customers(customer_id) ON DELETE SET NULL;

-- Create unique index on order_token for fast lookup
CREATE INDEX IF NOT EXISTS idx_orders_order_token ON orders(order_token);
CREATE INDEX IF NOT EXISTS idx_orders_is_guest_order ON orders(is_guest_order);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Function to generate unique order token
CREATE OR REPLACE FUNCTION generate_order_token() RETURNS VARCHAR AS $$
DECLARE
    new_token VARCHAR(100);
    token_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate token format: TRK-YYYYMMDD-RANDOM8
        new_token := 'TRK-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
        
        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_token = new_token) INTO token_exists;
        
        -- Exit loop if token is unique
        EXIT WHEN NOT token_exists;
    END LOOP;
    
    RETURN new_token;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate order token for new orders
CREATE OR REPLACE FUNCTION set_order_token() RETURNS TRIGGER AS $$
BEGIN
    -- Generate token only if not already set
    IF NEW.order_token IS NULL THEN
        NEW.order_token := generate_order_token();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for order token generation
DROP TRIGGER IF EXISTS trigger_set_order_token ON orders;
CREATE TRIGGER trigger_set_order_token
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_token();

-- Update existing orders to have tokens (for backward compatibility)
UPDATE orders 
SET order_token = generate_order_token()
WHERE order_token IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.order_token IS 'Unique tracking token for guest order tracking (format: TRK-YYYYMMDD-RANDOM8)';
COMMENT ON COLUMN orders.is_guest_order IS 'Flag to identify guest orders (without customer account)';
COMMENT ON COLUMN orders.tracking_link_sent IS 'Flag to track if tracking email has been sent';
COMMENT ON COLUMN orders.customer_id IS 'Links to customers table if user creates account later (nullable for guest orders)';

-- Create email logs table for tracking sent emails
CREATE TABLE IF NOT EXISTS email_logs (
    email_log_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    recipient_email VARCHAR(100) NOT NULL,
    email_type VARCHAR(50) NOT NULL, -- order_confirmation, tracking_link, status_update
    subject VARCHAR(255),
    email_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
    error_message TEXT,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_logs_order_id ON email_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_email_status ON email_logs(email_status);

-- ========================================
-- GUEST ORDER TRACKING VIEWS
-- ========================================

-- View for guest order tracking (safe for public access)
CREATE OR REPLACE VIEW guest_order_tracking AS
SELECT 
    o.order_id,
    o.order_number,
    o.order_token,
    o.customer_name,
    o.customer_phone,
    o.customer_email,
    o.order_type,
    o.installation_address,
    o.pincode,
    o.city,
    o.state,
    o.total_amount,
    o.status,
    o.payment_status,
    o.payment_method,
    o.expected_delivery_date,
    o.actual_delivery_date,
    o.installation_date,
    o.created_at,
    o.updated_at,
    -- Count of status updates
    (SELECT COUNT(*) FROM order_status_history WHERE order_id = o.order_id) as status_update_count,
    -- Latest status update
    (SELECT remarks FROM order_status_history WHERE order_id = o.order_id ORDER BY created_at DESC LIMIT 1) as latest_remarks
FROM orders o
WHERE o.is_guest_order = true;

COMMENT ON VIEW guest_order_tracking IS 'Safe view for guest order tracking - excludes sensitive admin data';

GRANT SELECT ON guest_order_tracking TO PUBLIC;

-- ========================================
-- ADMIN PANEL QUERIES
-- ========================================

-- View for admin to manage all orders (including guest orders)
CREATE OR REPLACE VIEW admin_orders_view AS
SELECT 
    o.*,
    c.email as customer_account_email,
    c.full_name as customer_account_name,
    d.full_name as assigned_dealer_name,
    d.phone_number as dealer_phone,
    CASE 
        WHEN o.is_guest_order = true AND o.customer_id IS NULL THEN 'Guest (No Account)'
        WHEN o.is_guest_order = true AND o.customer_id IS NOT NULL THEN 'Guest (Account Created)'
        ELSE 'Registered User'
    END as order_source_type
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
LEFT JOIN dealers d ON o.assigned_dealer_id = d.dealer_id
ORDER BY o.created_at DESC;

COMMENT ON VIEW admin_orders_view IS 'Complete order view for admin panel with customer and dealer information';

-- ========================================
-- SAMPLE QUERIES FOR TESTING
-- ========================================

-- Query to get guest order by token (for tracking page)
-- SELECT * FROM guest_order_tracking WHERE order_token = 'TRK-20260212-ABC12345';

-- Query to get all guest orders (for admin panel)
-- SELECT * FROM admin_orders_view WHERE is_guest_order = true;

-- Query to check email logs for an order
-- SELECT * FROM email_logs WHERE order_id = 1 ORDER BY created_at DESC;
