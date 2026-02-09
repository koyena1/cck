-- Add COD advance amount column to installation_settings table
ALTER TABLE installation_settings
ADD COLUMN IF NOT EXISTS cod_advance_amount DECIMAL(10, 2) DEFAULT 200.00;

-- Update the default value for existing records
UPDATE installation_settings 
SET cod_advance_amount = 200.00 
WHERE cod_advance_amount IS NULL;

-- Add comment
COMMENT ON COLUMN installation_settings.cod_advance_amount IS 'Advance amount to be paid for COD orders via Razorpay';
