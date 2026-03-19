-- ========================================
-- DEALER REWARDS SYSTEM
-- ========================================
-- This system tracks dealer performance rewards for timely delivery
-- - 100 points for delivering within 24 hours of acceptance
-- - 5000 points = Gift redemption
-- ========================================

-- Create dealer_rewards table
CREATE TABLE IF NOT EXISTS dealer_rewards (
    reward_id SERIAL PRIMARY KEY,
    dealer_id INTEGER NOT NULL,
    total_points INTEGER DEFAULT 0,
    total_gifts_redeemed INTEGER DEFAULT 0,
    last_gift_redeemed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealer_id)
);

-- Add foreign key after ensuring dealers table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealers') THEN
        ALTER TABLE dealer_rewards 
        ADD CONSTRAINT fk_dealer_rewards_dealer 
        FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create reward_transactions table to track point changes
CREATE TABLE IF NOT EXISTS reward_transactions (
    transaction_id SERIAL PRIMARY KEY,
    dealer_id INTEGER NOT NULL,
    order_id INTEGER,
    transaction_type VARCHAR(50) NOT NULL, -- 'earned', 'redeemed', 'adjusted'
    points INTEGER NOT NULL, -- positive for earning, negative for redemption
    description TEXT,
    delivery_time_hours DECIMAL(10, 2), -- time taken to deliver (for earned points)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealers') THEN
        ALTER TABLE reward_transactions 
        ADD CONSTRAINT fk_reward_transactions_dealer 
        FOREIGN KEY (dealer_id) REFERENCES dealers(dealer_id) ON DELETE CASCADE;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE reward_transactions 
        ADD CONSTRAINT fk_reward_transactions_order 
        FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE SET NULL;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_reward_transactions_dealer ON reward_transactions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_order ON reward_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_dealer_rewards_points ON dealer_rewards(total_points DESC);

-- View for dealer reward summary
CREATE OR REPLACE VIEW dealer_reward_summary AS
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
GROUP BY dr.dealer_id, dr.reward_id, d.full_name, d.business_name, d.email;

-- Function to add reward points for timely delivery
CREATE OR REPLACE FUNCTION add_delivery_reward_points(
    p_dealer_id INTEGER,
    p_order_id INTEGER,
    p_delivery_hours DECIMAL(10, 2)
) RETURNS JSON AS $$
DECLARE
    v_points INTEGER;
    v_current_points INTEGER;
    v_new_points INTEGER;
    v_gifts_earned INTEGER := 0;
    v_result JSON;
BEGIN
    -- Only reward if delivered within 24 hours
    IF p_delivery_hours > 24 THEN
        RETURN json_build_object(
            'success', false,
            'message', 'Delivery time exceeds 24 hours',
            'delivery_hours', p_delivery_hours
        );
    END IF;

    -- Award 100 points
    v_points := 100;

    -- Insert or update dealer_rewards
    INSERT INTO dealer_rewards (dealer_id, total_points)
    VALUES (p_dealer_id, v_points)
    ON CONFLICT (dealer_id) 
    DO UPDATE SET 
        total_points = dealer_rewards.total_points + v_points,
        updated_at = CURRENT_TIMESTAMP
    RETURNING total_points INTO v_new_points;

    -- Record transaction
    INSERT INTO reward_transactions (
        dealer_id, 
        order_id, 
        transaction_type, 
        points, 
        description,
        delivery_time_hours
    ) VALUES (
        p_dealer_id,
        p_order_id,
        'earned',
        v_points,
        'Fast delivery bonus - delivered within 24 hours',
        p_delivery_hours
    );

    -- Check if dealer earned any gifts (5000 points = 1 gift)
    v_gifts_earned := FLOOR(v_new_points / 5000);
    
    IF v_gifts_earned > 0 THEN
        -- Get current gift count
        SELECT total_gifts_redeemed INTO v_current_points 
        FROM dealer_rewards 
        WHERE dealer_id = p_dealer_id;
        
        -- Only update if new gifts were earned
        IF v_gifts_earned > COALESCE(v_current_points, 0) THEN
            UPDATE dealer_rewards 
            SET total_gifts_redeemed = v_gifts_earned,
                last_gift_redeemed_at = CURRENT_TIMESTAMP
            WHERE dealer_id = p_dealer_id;
        END IF;
    END IF;

    v_result := json_build_object(
        'success', true,
        'points_awarded', v_points,
        'total_points', v_new_points,
        'points_to_next_gift', 5000 - (v_new_points % 5000),
        'total_gifts_available', v_gifts_earned,
        'delivery_hours', p_delivery_hours
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Function to manually adjust dealer points (admin use)
CREATE OR REPLACE FUNCTION adjust_dealer_points(
    p_dealer_id INTEGER,
    p_points INTEGER,
    p_description TEXT
) RETURNS JSON AS $$
DECLARE
    v_new_points INTEGER;
    v_result JSON;
BEGIN
    -- Update dealer_rewards
    INSERT INTO dealer_rewards (dealer_id, total_points)
    VALUES (p_dealer_id, p_points)
    ON CONFLICT (dealer_id) 
    DO UPDATE SET 
        total_points = GREATEST(0, dealer_rewards.total_points + p_points),
        updated_at = CURRENT_TIMESTAMP
    RETURNING total_points INTO v_new_points;

    -- Record transaction
    INSERT INTO reward_transactions (
        dealer_id, 
        transaction_type, 
        points, 
        description
    ) VALUES (
        p_dealer_id,
        'adjusted',
        p_points,
        COALESCE(p_description, 'Manual points adjustment')
    );

    v_result := json_build_object(
        'success', true,
        'points_adjusted', p_points,
        'new_total_points', v_new_points
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Initialize rewards for existing dealers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dealers') THEN
        INSERT INTO dealer_rewards (dealer_id, total_points)
        SELECT dealer_id, 0
        FROM dealers
        ON CONFLICT (dealer_id) DO NOTHING;
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE dealer_rewards IS 'Tracks dealer reward points for performance incentives';
COMMENT ON TABLE reward_transactions IS 'Logs all reward point transactions for audit trail';
COMMENT ON FUNCTION add_delivery_reward_points IS 'Awards 100 points for deliveries completed within 24 hours';
COMMENT ON FUNCTION adjust_dealer_points IS 'Manually adjusts dealer points (admin function)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Dealer Rewards System created successfully!';
    RAISE NOTICE '   - dealer_rewards table created';
    RAISE NOTICE '   - reward_transactions table created';
    RAISE NOTICE '   - Views and functions created';
    RAISE NOTICE '   - Reward Rule: 100 points for 24-hour delivery';
    RAISE NOTICE '   - Gift Threshold: 5000 points';
END $$;
