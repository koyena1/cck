-- Update order_tracking_otps table structure for phone-only OTP verification
-- This migration makes order_number optional since users will authenticate with phone number only

-- Make order_number column nullable
ALTER TABLE order_tracking_otps 
ALTER COLUMN order_number DROP NOT NULL;

-- Drop old index that includes order_number
DROP INDEX IF EXISTS idx_otp_order_phone;

-- Create new index on phone_number only
CREATE INDEX IF NOT EXISTS idx_otp_phone ON order_tracking_otps(phone_number);

-- Create index on phone + otp code for faster verification
CREATE INDEX IF NOT EXISTS idx_otp_phone_code ON order_tracking_otps(phone_number, otp_code);

-- Ensure expires_at index exists
CREATE INDEX IF NOT EXISTS idx_otp_expires ON order_tracking_otps(expires_at);

-- Add comment
COMMENT ON TABLE order_tracking_otps IS 'Stores OTP codes for order tracking authentication via registered mobile number';
COMMENT ON COLUMN order_tracking_otps.phone_number IS 'Primary authentication - users verify via phone number only';
COMMENT ON COLUMN order_tracking_otps.order_number IS 'Optional - kept for backwards compatibility';
