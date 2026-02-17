-- Add serviceable_pincodes column to dealers table
-- This allows dealers to specify which pincode areas they can service
-- Multiple pincodes can be stored as comma-separated values

ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS serviceable_pincodes TEXT;

COMMENT ON COLUMN dealers.serviceable_pincodes IS 'Comma-separated list of pincodes the dealer can service (e.g., "110001,110002,110003")';

-- Example update (if you want to add sample data for existing dealers)
-- UPDATE dealers SET serviceable_pincodes = '110001,110002' WHERE dealer_id = 1;
