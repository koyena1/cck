-- ============================================
-- REFERRAL & REWARD SYSTEM - Database Migration
-- ============================================

-- Step 1: Add referral and reward fields to customers table
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS referral_id VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS reward_points DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS first_order_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS mystery_box_claimed BOOLEAN DEFAULT FALSE;

-- Create index for faster referral lookups
CREATE INDEX IF NOT EXISTS idx_customers_referral_id ON customers(referral_id);

-- Step 2: Create referral_transactions table to track referral usage
CREATE TABLE IF NOT EXISTS referral_transactions (
    id SERIAL PRIMARY KEY,
    referrer_customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    referred_customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    order_id INTEGER,
    referral_code VARCHAR(20) NOT NULL,
    referrer_reward DECIMAL(10, 2) DEFAULT 100,
    referred_discount DECIMAL(10, 2) DEFAULT 50,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    
    -- Prevent duplicate referrals
    CONSTRAINT unique_referral_per_user UNIQUE(referred_customer_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_transactions_referrer ON referral_transactions(referrer_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_referred ON referral_transactions(referred_customer_id);
CREATE INDEX IF NOT EXISTS idx_referral_transactions_status ON referral_transactions(status);

-- Step 3: Create reward_transactions table for points history
CREATE TABLE IF NOT EXISTS reward_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(customer_id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'mystery_box', 'referral_reward', 'points_redeemed', 'points_earned'
    points DECIMAL(10, 2) NOT NULL,
    description TEXT,
    order_id INTEGER,
    balance_after DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reward_transactions_customer ON reward_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_type ON reward_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_reward_transactions_created ON reward_transactions(created_at);

-- Step 4: Add referral tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(20),
ADD COLUMN IF NOT EXISTS referral_discount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS points_redeemed DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_first_order BOOLEAN DEFAULT FALSE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_orders_referral_code ON orders(referral_code_used);
CREATE INDEX IF NOT EXISTS idx_orders_is_first_order ON orders(is_first_order);

-- Step 5: Function to generate unique referral ID
CREATE OR REPLACE FUNCTION generate_referral_id() RETURNS VARCHAR(20) AS $$
DECLARE
    new_id VARCHAR(20);
    id_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate random 8-character alphanumeric code (REF-XXXXXXXX)
        new_id := 'REF-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 8));
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM customers WHERE referral_id = new_id) INTO id_exists;
        
        -- Exit loop if unique
        EXIT WHEN NOT id_exists;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update existing customers with referral IDs (if they don't have one)
UPDATE customers 
SET referral_id = generate_referral_id() 
WHERE referral_id IS NULL;

-- Step 7: Create trigger to auto-generate referral ID for new customers
CREATE OR REPLACE FUNCTION set_referral_id_trigger() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_id IS NULL THEN
        NEW.referral_id := generate_referral_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_referral_id ON customers;
CREATE TRIGGER trigger_set_referral_id
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_referral_id_trigger();

-- Step 8: Add comments for documentation
COMMENT ON COLUMN customers.referral_id IS 'Unique referral ID for sharing with others';
COMMENT ON COLUMN customers.reward_points IS 'Current reward points balance (1 point = 1 currency unit)';
COMMENT ON COLUMN customers.first_order_completed IS 'Whether user has completed their first order';
COMMENT ON COLUMN customers.mystery_box_claimed IS 'Whether mystery box reward has been claimed';

COMMENT ON TABLE referral_transactions IS 'Tracks all referral transactions and rewards';
COMMENT ON TABLE reward_transactions IS 'Complete history of all reward points transactions';

COMMENT ON COLUMN orders.referral_code_used IS 'Referral code applied to this order';
COMMENT ON COLUMN orders.referral_discount IS 'Discount amount from referral (for buyer)';
COMMENT ON COLUMN orders.points_redeemed IS 'Reward points redeemed for discount';
COMMENT ON COLUMN orders.is_first_order IS 'Flag to identify first orders for mystery box rewards';

-- Verify the changes
SELECT 'Referral system tables and columns created successfully!' AS status;
