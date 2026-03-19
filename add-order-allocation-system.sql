-- ========================================
-- INTELLIGENT ORDER ALLOCATION SYSTEM
-- Routes orders to nearest dealer with stock
-- ========================================

-- Dealer Order Requests - Tracks order allocation to dealers
CREATE TABLE IF NOT EXISTS dealer_order_requests (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    request_sequence INTEGER NOT NULL, -- 1st dealer, 2nd dealer, etc.
    request_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'expired', 'cancelled'
    
    -- Stock verification at time of request
    stock_verified BOOLEAN DEFAULT false,
    stock_available BOOLEAN DEFAULT false,
    stock_check_details JSONB, -- Products and quantities checked
    
    -- Timeline tracking
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_deadline TIMESTAMP, -- Auto-calculated: requested_at + timeout hours
    responded_at TIMESTAMP,
    accepted_at TIMESTAMP,
    expired_at TIMESTAMP,
    
    -- Dealer response
    dealer_notes TEXT,
    decline_reason VARCHAR(255),
    
    -- Distance & Location
    dealer_distance_km DECIMAL(10, 2),
    customer_pincode VARCHAR(10),
    dealer_service_pin VARCHAR(10),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(order_id, dealer_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dealer_requests_order ON dealer_order_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_dealer_requests_dealer ON dealer_order_requests(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_requests_status ON dealer_order_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_dealer_requests_deadline ON dealer_order_requests(response_deadline);
CREATE INDEX IF NOT EXISTS idx_dealer_requests_sequence ON dealer_order_requests(order_id, request_sequence);

-- Order Allocation Log - Track the entire allocation journey
CREATE TABLE IF NOT EXISTS order_allocation_log (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
    log_type VARCHAR(50) NOT NULL, -- 'allocation_started', 'dealer_found', 'stock_verified', 'request_sent', 'accepted', 'declined', 'expired', 'escalated_to_admin', 'completed'
    dealer_id INTEGER REFERENCES dealers(dealer_id),
    message TEXT,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_allocation_log_order ON order_allocation_log(order_id);
CREATE INDEX IF NOT EXISTS idx_allocation_log_type ON order_allocation_log(log_type);

-- Order Allocation Settings - Configurable timeouts and rules
CREATE TABLE IF NOT EXISTS order_allocation_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT INTO order_allocation_settings (setting_key, setting_value, description)
VALUES 
    ('dealer_response_timeout_hours', '6', 'Hours dealer has to accept order request'),
    ('max_dealer_attempts', '3', 'Maximum number of dealers to try before sending to admin'),
    ('auto_escalate_enabled', 'true', 'Enable automatic escalation to next dealer on timeout'),
    ('require_stock_verification', 'true', 'Verify stock availability before sending request'),
    ('distance_search_radius_km', '50', 'Maximum distance to search for dealers')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dealer_request_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for dealer_order_requests
DROP TRIGGER IF EXISTS trigger_update_dealer_request_timestamp ON dealer_order_requests;
CREATE TRIGGER trigger_update_dealer_request_timestamp
BEFORE UPDATE ON dealer_order_requests
FOR EACH ROW
EXECUTE FUNCTION update_dealer_request_timestamp();

-- View for active dealer requests
CREATE OR REPLACE VIEW active_dealer_requests AS
SELECT 
    dor.id,
    dor.order_id,
    o.order_number,
    o.customer_name,
    o.customer_phone,
    dor.dealer_id,
    d.business_name as dealer_name,
    d.full_name as dealer_contact,
    d.phone_number as dealer_phone,
    dor.request_sequence,
    dor.request_status,
    dor.stock_verified,
    dor.stock_available,
    dor.stock_check_details,
    dor.dealer_distance_km,
    dor.requested_at,
    dor.response_deadline,
    -- Calculate time remaining in hours
    EXTRACT(EPOCH FROM (dor.response_deadline - NOW())) / 3600 as hours_remaining,
    -- Check if expired
    CASE 
        WHEN dor.response_deadline < NOW() AND dor.request_status = 'pending' THEN true
        ELSE false
    END as is_expired,
    dor.created_at
FROM dealer_order_requests dor
JOIN orders o ON dor.order_id = o.order_id
JOIN dealers d ON dor.dealer_id = d.dealer_id
WHERE dor.request_status IN ('pending', 'accepted')
ORDER BY dor.requested_at DESC;

-- View for dealer order queue (what each dealer needs to respond to)
CREATE OR REPLACE VIEW dealer_order_queue AS
SELECT 
    dor.id as request_id,
    dor.order_id,
    o.order_number,
    o.customer_name,
    o.customer_phone,
    o.pincode,
    o.installation_address,
    o.total_amount,
    o.status as order_status,
    dor.dealer_id,
    dor.request_sequence,
    dor.request_status,
    dor.stock_check_details,
    dor.dealer_distance_km,
    dor.requested_at,
    dor.response_deadline,
    EXTRACT(EPOCH FROM (dor.response_deadline - NOW())) / 3600 as hours_remaining,
    CASE 
        WHEN dor.response_deadline < NOW() THEN true
        ELSE false
    END as is_expired,
    -- Order items for reference
    (SELECT json_agg(json_build_object(
        'item_name', item_name,
        'quantity', quantity,
        'unit_price', unit_price,
        'total_price', total_price
    ))
    FROM order_items 
    WHERE order_id = o.order_id) as order_items
FROM dealer_order_requests dor
JOIN orders o ON dor.order_id = o.order_id
WHERE dor.request_status = 'pending'
    AND dor.response_deadline > NOW()
ORDER BY dor.response_deadline ASC;

-- Function to find dealers by location with stock verification
CREATE OR REPLACE FUNCTION find_dealers_with_stock(
    p_customer_pincode VARCHAR(10),
    p_product_ids INTEGER[],
    p_required_quantities INTEGER[]
)
RETURNS TABLE (
    dealer_id INTEGER,
    business_name VARCHAR(200),
    service_pin VARCHAR(6),
    distance_rank INTEGER,
    has_all_products BOOLEAN,
    stock_details JSONB
) AS $$
BEGIN
    RETURN QUERY
    WITH dealer_stock_check AS (
        SELECT 
            d.dealer_id,
            d.business_name,
            d.service_pin,
            -- Rank dealers (in real system, use geolocation distance)
            ROW_NUMBER() OVER (ORDER BY d.dealer_id) as distance_rank,
            -- Check if dealer has ALL required products with sufficient quantity
            (
                SELECT COUNT(*) = array_length(p_product_ids, 1)
                FROM unnest(p_product_ids, p_required_quantities) 
                    WITH ORDINALITY AS requirements(product_id, required_qty, idx)
                LEFT JOIN dealer_inventory di 
                    ON di.dealer_id = d.dealer_id 
                    AND di.product_id = requirements.product_id
                WHERE di.quantity_available >= requirements.required_qty
            ) as has_all_products,
            -- Get stock details
            (
                SELECT json_agg(json_build_object(
                    'product_id', di.product_id,
                    'available', di.quantity_available,
                    'required', req.required_qty,
                    'sufficient', di.quantity_available >= req.required_qty
                ))
                FROM unnest(p_product_ids, p_required_quantities) 
                    WITH ORDINALITY AS req(product_id, required_qty, idx)
                LEFT JOIN dealer_inventory di 
                    ON di.dealer_id = d.dealer_id 
                    AND di.product_id = req.product_id
            ) as stock_details
        FROM dealers d
        WHERE d.status = 'Active'
            AND (d.service_pin = p_customer_pincode OR d.service_pin IS NULL)
    )
    SELECT * FROM dealer_stock_check
    WHERE has_all_products = true
    ORDER BY distance_rank;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE dealer_order_requests IS 'Tracks order allocation requests sent to dealers with timeout mechanism';
COMMENT ON TABLE order_allocation_log IS 'Complete audit trail of order allocation process';
COMMENT ON TABLE order_allocation_settings IS 'Configurable settings for order allocation behavior';
COMMENT ON VIEW active_dealer_requests IS 'Active requests pending dealer response or accepted';
COMMENT ON VIEW dealer_order_queue IS 'Orders waiting for dealer acceptance - dealer portal view';

-- Sample data for testing (optional)
-- This would be inserted when an actual order is placed
-- INSERT INTO dealer_order_requests (order_id, dealer_id, request_sequence, response_deadline, dealer_distance_km, customer_pincode)
-- VALUES (1, 3, 1, NOW() + INTERVAL '6 hours', 5.2, '700001');
