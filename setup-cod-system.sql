-- ============================================================
-- COD Payment System - Complete Database Setup
-- Run this SQL in pgAdmin Query Tool
-- ============================================================

-- Step 1: Create installation_settings table if it does not exist
CREATE TABLE IF NOT EXISTS installation_settings (
    id SERIAL PRIMARY KEY,
    installation_cost DECIMAL(10, 2) DEFAULT 5000.00,
    amc_options JSONB DEFAULT '{"with_1year": 400, "with_2year": 700, "without_1year": 250, "without_2year": 200}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Add cod_advance_amount column if it does not exist
ALTER TABLE installation_settings
ADD COLUMN IF NOT EXISTS cod_advance_amount DECIMAL(10, 2) DEFAULT 200.00;

-- Step 3: Add cod_percentage column if it does not exist  
ALTER TABLE installation_settings
ADD COLUMN IF NOT EXISTS cod_percentage DECIMAL(5, 2) DEFAULT 10.00;

-- Step 4: Insert default record if table is empty
INSERT INTO installation_settings (installation_cost, cod_advance_amount, cod_percentage, amc_options)
SELECT 5000.00, 200.00, 10.00, '{"with_1year": 400, "with_2year": 700, "without_1year": 250, "without_2year": 200}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM installation_settings);

-- Step 5: Update existing records with default COD values if they are NULL
UPDATE installation_settings 
SET cod_advance_amount = 200.00 
WHERE cod_advance_amount IS NULL;

UPDATE installation_settings 
SET cod_percentage = 10.00 
WHERE cod_percentage IS NULL;

-- Step 6: Add helpful comments
COMMENT ON COLUMN installation_settings.cod_advance_amount 
IS 'Extra COD charges added to order total (default: Rs.200)';

COMMENT ON COLUMN installation_settings.cod_percentage 
IS 'Percentage of (product amount + extra COD amount) that must be paid in advance for COD orders (default: 10%)';

-- Verification query - run this to confirm everything worked
SELECT 
    installation_cost as "Installation Cost",
    cod_advance_amount as "COD Extra Charges", 
    cod_percentage as "COD Advance %",
    amc_options as "AMC Options"
FROM installation_settings;

-- You should see: Installation Cost: 5000.00, COD Extra Charges: 200.00, COD Advance %: 10.00
