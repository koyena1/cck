-- ========================================
-- ADD PINCODES COLUMN TO DISTRICT USERS
-- ========================================
-- This script adds pincodes column to district_users table
-- to allow district managers to manage multiple pincodes

-- Add pincodes column to district_users table
ALTER TABLE district_users 
ADD COLUMN IF NOT EXISTS pincodes TEXT;

-- Add comment
COMMENT ON COLUMN district_users.pincodes IS 'Comma-separated list of pincodes managed by this district manager';

SELECT 'Pincodes column added successfully to district_users table!' as message;
