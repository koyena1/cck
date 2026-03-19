-- ========================================
-- DEALER MONITORING & ALERT SYSTEM
-- Tracks stock updates and enables admin alerts
-- ========================================

-- Track every time a dealer updates their stock
CREATE TABLE IF NOT EXISTS dealer_stock_updates (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES dealer_products(id) ON DELETE CASCADE,
    previous_quantity INTEGER DEFAULT 0,
    new_quantity INTEGER DEFAULT 0,
    quantity_change INTEGER DEFAULT 0, -- new - previous
    update_type VARCHAR(20) NOT NULL, -- 'purchase', 'sale', 'adjustment'
    notes TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stock_updates_dealer ON dealer_stock_updates(dealer_id);
CREATE INDEX IF NOT EXISTS idx_stock_updates_date ON dealer_stock_updates(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_updates_dealer_date ON dealer_stock_updates(dealer_id, updated_at DESC);

-- Notifications/Alerts for dealers
CREATE TABLE IF NOT EXISTS dealer_notifications (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'alert', 'success'
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    is_read BOOLEAN DEFAULT false,
    sent_via_email BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMP,
    created_by VARCHAR(50) DEFAULT 'admin', -- 'admin', 'system'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_dealer ON dealer_notifications(dealer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON dealer_notifications(dealer_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_date ON dealer_notifications(created_at DESC);

-- View for dealer stock update history with product details
CREATE OR REPLACE VIEW dealer_stock_update_history AS
SELECT 
    dsu.id,
    dsu.dealer_id,
    d.full_name as dealer_name,
    d.business_name,
    dsu.product_id,
    dp.company,
    dp.segment,
    dp.model_number,
    dp.product_type,
    dp.description,
    dsu.previous_quantity,
    dsu.new_quantity,
    dsu.quantity_change,
    dsu.update_type,
    dsu.notes,
    dsu.updated_at
FROM dealer_stock_updates dsu
JOIN dealers d ON dsu.dealer_id = d.dealer_id
JOIN dealer_products dp ON dsu.product_id = dp.id
ORDER BY dsu.updated_at DESC;

-- Function to automatically log stock updates
CREATE OR REPLACE FUNCTION log_dealer_stock_update()
RETURNS TRIGGER AS $$
DECLARE
    qty_change INTEGER;
    update_type_val VARCHAR(20);
BEGIN
    -- Calculate quantity change
    qty_change := NEW.quantity_available - OLD.quantity_available;
    
    -- Only log if there's an actual change
    IF qty_change != 0 THEN
        -- Determine update type
        IF NEW.quantity_purchased > OLD.quantity_purchased THEN
            update_type_val := 'purchase';
        ELSIF NEW.quantity_sold > OLD.quantity_sold THEN
            update_type_val := 'sale';
        ELSE
            update_type_val := 'adjustment';
        END IF;
        
        -- Insert log entry
        INSERT INTO dealer_stock_updates (
            dealer_id,
            product_id,
            previous_quantity,
            new_quantity,
            quantity_change,
            update_type
        ) VALUES (
            NEW.dealer_id,
            NEW.product_id,
            OLD.quantity_available,
            NEW.quantity_available,
            qty_change,
            update_type_val
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically log stock updates
DROP TRIGGER IF EXISTS trigger_log_dealer_stock_update ON dealer_inventory;
CREATE TRIGGER trigger_log_dealer_stock_update
AFTER UPDATE ON dealer_inventory
FOR EACH ROW
EXECUTE FUNCTION log_dealer_stock_update();

-- Function to get last stock update date for a dealer
CREATE OR REPLACE FUNCTION get_dealer_last_stock_update(p_dealer_id INTEGER)
RETURNS TIMESTAMP AS $$
DECLARE
    last_update TIMESTAMP;
BEGIN
    SELECT MAX(updated_at) INTO last_update
    FROM dealer_stock_updates
    WHERE dealer_id = p_dealer_id;
    
    RETURN last_update;
END;
$$ LANGUAGE plpgsql;

-- Function to get days since last stock update
CREATE OR REPLACE FUNCTION get_days_since_stock_update(p_dealer_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    last_update TIMESTAMP;
    days_elapsed INTEGER;
BEGIN
    last_update := get_dealer_last_stock_update(p_dealer_id);
    
    IF last_update IS NULL THEN
        -- If no updates found, check dealer registration date
        SELECT EXTRACT(DAY FROM (CURRENT_TIMESTAMP - created_at))
        INTO days_elapsed
        FROM dealers
        WHERE dealer_id = p_dealer_id;
    ELSE
        days_elapsed := EXTRACT(DAY FROM (CURRENT_TIMESTAMP - last_update));
    END IF;
    
    RETURN days_elapsed;
END;
$$ LANGUAGE plpgsql;

-- View for dealers needing stock update alerts (10+ days inactive)
CREATE OR REPLACE VIEW dealers_needing_alert AS
SELECT 
    d.dealer_id,
    d.full_name,
    d.email,
    d.phone_number,
    d.business_name,
    d.status,
    get_dealer_last_stock_update(d.dealer_id) as last_stock_update,
    get_days_since_stock_update(d.dealer_id) as days_since_update,
    COUNT(di.id) as total_products,
    SUM(di.quantity_available) as total_stock_available
FROM dealers d
LEFT JOIN dealer_inventory di ON d.dealer_id = di.dealer_id
WHERE d.status = 'Active'
GROUP BY d.dealer_id, d.full_name, d.email, d.phone_number, d.business_name, d.status
HAVING get_days_since_stock_update(d.dealer_id) >= 10
ORDER BY get_days_since_stock_update(d.dealer_id) DESC;

COMMENT ON TABLE dealer_stock_updates IS 'Logs every stock update made by dealers for tracking and monitoring';
COMMENT ON TABLE dealer_notifications IS 'Stores notifications and alerts sent to dealers';
COMMENT ON VIEW dealer_stock_update_history IS 'Complete history of dealer stock updates with product details';
COMMENT ON VIEW dealers_needing_alert IS 'Dealers who have not updated stock in 10+ days';
