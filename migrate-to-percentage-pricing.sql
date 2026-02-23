-- ========================================
-- MIGRATE TO PERCENTAGE-BASED PRICING
-- ========================================

-- Add percentage columns to dealer_products
ALTER TABLE dealer_products 
ADD COLUMN IF NOT EXISTS purchase_percentage DECIMAL(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_percentage DECIMAL(5, 2) DEFAULT 0;

-- Calculate percentages from existing absolute prices
UPDATE dealer_products
SET 
    purchase_percentage = CASE 
        WHEN base_price > 0 THEN ROUND(((dealer_purchase_price - base_price) / base_price * 100), 2)
        ELSE 0
    END,
    sale_percentage = CASE 
        WHEN dealer_purchase_price > 0 THEN ROUND(((dealer_sale_price - dealer_purchase_price) / dealer_purchase_price * 100), 2)
        ELSE 0
    END;

-- Create function to auto-calculate prices with cascading discounts
CREATE OR REPLACE FUNCTION calculate_dealer_prices()
RETURNS TRIGGER AS $$
BEGIN
    -- Step 1: Calculate purchase price = base_price - (base_price * purchase_percentage / 100)
    -- purchase_percentage is stored as negative for discount (e.g., -20 for 20% off)
    NEW.dealer_purchase_price = NEW.base_price + (NEW.base_price * NEW.purchase_percentage / 100);
    
    -- Step 2: Calculate sale price = purchase_price - (purchase_price * sale_percentage / 100)
    -- sale_percentage is calculated FROM purchase price, not base price
    NEW.dealer_sale_price = NEW.dealer_purchase_price + (NEW.dealer_purchase_price * NEW.sale_percentage / 100);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate prices on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_dealer_prices ON dealer_products;
CREATE TRIGGER trigger_calculate_dealer_prices
BEFORE INSERT OR UPDATE OF base_price, purchase_percentage, sale_percentage ON dealer_products
FOR EACH ROW
EXECUTE FUNCTION calculate_dealer_prices();

-- Add comments
COMMENT ON COLUMN dealer_products.purchase_percentage IS 'Percentage discount from base price (negative = discount, e.g., -20 for 20% off base)';
COMMENT ON COLUMN dealer_products.sale_percentage IS 'Percentage discount from PURCHASE price (negative = discount, e.g., -10 for 10% off purchase price)';

-- Verify the migration
SELECT 
    model_number,
    base_price,
    purchase_percentage,
    dealer_purchase_price,
    sale_percentage,
    dealer_sale_price
FROM dealer_products
LIMIT 5;
