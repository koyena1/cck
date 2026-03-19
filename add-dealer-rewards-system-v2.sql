-- ========================================
-- DEALER REWARDS SYSTEM - SIMPLIFIED
-- ========================================

-- Drop existing tables if any (for clean install)
DROP TABLE IF EXISTS reward_transactions CASCADE;
DROP TABLE IF EXISTS dealer_rewards CASCADE;
DROP VIEW IF EXISTS dealer_reward_summary CASCADE;
DROP FUNCTION IF EXISTS add_delivery_reward_points(INTEGER, INTEGER, DECIMAL);
DROP FUNCTION IF EXISTS adjust_dealer_points(INTEGER, INTEGER, TEXT);

-- Create dealer_rewards table
CREATE TABLE dealer_rewards (
    reward_id SERIAL PRIMARY KEY,
    dealer_id INTEGER NOT NULL UNIQUE,
    total_points INTEGER DEFAULT 0,
    total_gifts_redeemed INTEGER DEFAULT 0,
    last_gift_redeemed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dealer_rewards_dealer FOREIGN KEY (dealer_id) 
        REFERENCES dealers(dealer_id) ON DELETE CASCADE
);

-- Create reward_transactions table
CREATE TABLE reward_transactions (
    transaction_id SERIAL PRIMARY KEY,
    dealer_id INTEGER NOT NULL,
    order_id INTEGER,
    transaction_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    description TEXT,
    delivery_time_hours DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reward_transactions_dealer FOREIGN KEY (dealer_id) 
        REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    CONSTRAINT fk_reward_transactions_order FOREIGN KEY (order_id) 
        REFERENCES orders(order_id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX idx_reward_transactions_dealer ON reward_transactions(dealer_id);
CREATE INDEX idx_reward_transactions_order ON reward_transactions(order_id);
CREATE INDEX idx_dealer_rewards_points ON dealer_rewards(total_points DESC);

-- Create view for dealer reward summary
CREATE VIEW dealer_reward_summary AS
SELECT 
    dr.dealer_id,
    d.full_name,
    d.business_name,
    d.email,
    dr.total_points,
    dr.total_gifts_redeemed,
    dr.last_gift_redeemed_at,
    FLOOR(dr.total_points / 5000) as pending_gifts,
    dr.total_points % 5000 as points_to_next_gift,
    5000 - (dr.total_points % 5000) as points_needed_for_gift,
    COUNT(DISTINCT rt.transaction_id) FILTER (WHERE rt.transaction_type = 'earned') as total_earned_transactions,
    COUNT(DISTINCT rt.transaction_id) FILTER (WHERE rt.transaction_type = 'redeemed') as total_redemptions,
    dr.created_at as rewards_member_since
FROM dealer_rewards dr
JOIN dealers d ON dr.dealer_id = d.dealer_id
LEFT JOIN reward_transactions rt ON dr.dealer_id = rt.dealer_id
GROUP BY dr.dealer_id, dr.reward_id, d.full_name, d.business_name, d.email, dr.total_points, 
         dr.total_gifts_redeemed, dr.last_gift_redeemed_at, dr.created_at;

-- Function to add reward points
CREATE FUNCTION add_delivery_reward_points(
    p_dealer_id INTEGER,
    p_order_id INTEGER,
    p_delivery_hours DECIMAL(10, 2)
) RETURNS JSON AS $$
DECLARE
    v_points INTEGER;
    v_new_points INTEGER;
    v_gifts_earned INTEGER := 0;
    v_current_gifts INTEGER;
BEGIN
    IF p_delivery_hours > 24 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Delivery time exceeds 24 hours',
            'delivery_hours', p_delivery_hours
        );
    END IF;

    v_points := 100;

    INSERT INTO dealer_rewards (dealer_id, total_points)
    VALUES (p_dealer_id, v_points)
    ON CONFLICT (dealer_id) 
    DO UPDATE SET 
        total_points = dealer_rewards.total_points + v_points,
        updated_at = CURRENT_TIMESTAMP
    RETURNING total_points INTO v_new_points;

    INSERT INTO reward_transactions (
        dealer_id, order_id, transaction_type, points, description, delivery_time_hours
    ) VALUES (
        p_dealer_id, p_order_id, 'earned', v_points,
        'Fast delivery bonus - delivered within 24 hours', p_delivery_hours
    );

    v_gifts_earned := FLOOR(v_new_points / 5000);
    
    SELECT total_gifts_redeemed INTO v_current_gifts 
    FROM dealer_rewards 
    WHERE dealer_id = p_dealer_id;
    
    IF v_gifts_earned > COALESCE(v_current_gifts, 0) THEN
        UPDATE dealer_rewards 
        SET total_gifts_redeemed = v_gifts_earned,
            last_gift_redeemed_at = CURRENT_TIMESTAMP
        WHERE dealer_id = p_dealer_id;
    END IF;

    RETURN json_build_object(
        'success', true,
        'points_awarded', v_points,
        'total_points', v_new_points,
        'points_to_next_gift', 5000 - (v_new_points % 5000),
        'total_gifts_available', v_gifts_earned,
        'delivery_hours', p_delivery_hours
    );
END;
$$ LANGUAGE plpgsql;

-- Function to adjust points
CREATE FUNCTION adjust_dealer_points(
    p_dealer_id INTEGER,
    p_points INTEGER,
    p_description TEXT
) RETURNS JSON AS $$
DECLARE
    v_new_points INTEGER;
BEGIN
    INSERT INTO dealer_rewards (dealer_id, total_points)
    VALUES (p_dealer_id, p_points)
    ON CONFLICT (dealer_id) 
    DO UPDATE SET 
        total_points = GREATEST(0, dealer_rewards.total_points + p_points),
        updated_at = CURRENT_TIMESTAMP
    RETURNING total_points INTO v_new_points;

    INSERT INTO reward_transactions (dealer_id, transaction_type, points, description)
    VALUES (p_dealer_id, 'adjusted', p_points, COALESCE(p_description, 'Manual points adjustment'));

    RETURN json_build_object(
        'success', true,
        'points_adjusted', p_points,
        'new_total_points', v_new_points
    );
END;
$$ LANGUAGE plpgsql;

-- Initialize rewards for all existing dealers
INSERT INTO dealer_rewards (dealer_id, total_points)
SELECT dealer_id, 0 FROM dealers
ON CONFLICT (dealer_id) DO NOTHING;
