-- Create OTP verification table for customer registration
-- This table stores OTP codes sent to phone numbers during registration

CREATE TABLE IF NOT EXISTS customer_otp_verification (
    otp_id SERIAL PRIMARY KEY,
    phone_number VARCHAR(15) NOT NULL,
    otp_code VARCHAR(6) NOT NULL,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    attempts INTEGER DEFAULT 0,
    CONSTRAINT check_otp_format CHECK (otp_code ~ '^[0-9]{6}$')
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_customer_otp_phone ON customer_otp_verification(phone_number);
CREATE INDEX IF NOT EXISTS idx_customer_otp_expires ON customer_otp_verification(expires_at);

-- Function to clean up expired OTPs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otps()
RETURNS void AS $$
BEGIN
    DELETE FROM customer_otp_verification 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- Add comment
COMMENT ON TABLE customer_otp_verification IS 'OTP codes for customer phone verification during registration';
