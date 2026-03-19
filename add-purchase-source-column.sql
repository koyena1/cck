-- Add purchase_source column to dealer_transactions
ALTER TABLE dealer_transactions 
  ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(20) DEFAULT 'protechtur';

-- Add purchase_source column to dealer_inventory
ALTER TABLE dealer_inventory 
  ADD COLUMN IF NOT EXISTS purchase_source VARCHAR(20) DEFAULT 'protechtur';

-- Update existing records to have a default value
UPDATE dealer_transactions SET purchase_source = 'protechtur' WHERE purchase_source IS NULL;
UPDATE dealer_inventory SET purchase_source = 'protechtur' WHERE purchase_source IS NULL;
