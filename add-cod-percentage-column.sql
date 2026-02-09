-- Add COD percentage column to installation_settings table
-- This percentage will be applied to (product_amount + cod_advance_amount)

ALTER TABLE installation_settings
ADD COLUMN IF NOT EXISTS cod_percentage DECIMAL(5, 2) DEFAULT 10.00;

-- Update the default value for existing records (10% default)
UPDATE installation_settings 
SET cod_percentage = 10.00 
WHERE cod_percentage IS NULL;

-- Add comment
COMMENT ON COLUMN installation_settings.cod_percentage IS 'Percentage of (product amount + extra COD amount) that must be paid in advance for COD orders';

-- Verify the changes
SELECT 
    cod_advance_amount as "Extra COD Amount",
    cod_percentage as "COD Percentage"
FROM installation_settings;
