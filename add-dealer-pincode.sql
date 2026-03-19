-- ========================================
-- ADD PINCODE COLUMN TO DEALERS TABLE
-- ========================================
-- This script adds pincode column to dealers table

-- Add pincode column to dealers table
ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);

-- Add comment
COMMENT ON COLUMN dealers.pincode IS 'Pincode of the dealer business location';

SELECT 'Pincode column added successfully to dealers table!' as message;
