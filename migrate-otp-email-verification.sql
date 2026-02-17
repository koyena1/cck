-- Migration: Change OTP verification from phone to email
-- This script updates the customer_otp_verification table to use email instead of phone

-- Step 1: Drop existing table if you want a clean migration
-- WARNING: This will delete all existing OTP records
DROP TABLE IF EXISTS customer_otp_verification CASCADE;

-- Step 2: Create new table with email-based OTP
CREATE TABLE customer_otp_verification (
    otp_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    CONSTRAINT check_otp_format CHECK (otp_code ~ '^[0-9]{6}$'),
    CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Step 3: Create indexes for faster lookups
CREATE INDEX idx_customer_otp_email ON customer_otp_verification(email);
CREATE INDEX idx_customer_otp_expires ON customer_otp_verification(expires_at);
CREATE INDEX idx_customer_otp_verified ON customer_otp_verification(is_verified);

-- Step 4: Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM customer_otp_verification 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add table comment
COMMENT ON TABLE customer_otp_verification IS 'Email-based OTP codes for customer email verification during registration';

-- Step 6: Test the table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'customer_otp_verification'
ORDER BY ordinal_position;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration completed successfully!';
    RAISE NOTICE '📧 OTP verification now uses EMAIL instead of PHONE';
    RAISE NOTICE '🔄 Next steps:';
    RAISE NOTICE '   1. Update API routes to use email';
    RAISE NOTICE '   2. Update frontend components';
    RAISE NOTICE '   3. Test the registration flow';
END $$;
