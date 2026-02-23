-- ========================================
-- DEALER INVENTORY SYSTEM
-- This enables per-dealer inventory tracking
-- ========================================

-- Dealer Inventory - Track what each dealer has purchased and currently in stock
CREATE TABLE IF NOT EXISTS dealer_inventory (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES dealer_products(id) ON DELETE CASCADE,
    quantity_purchased INTEGER DEFAULT 0,
    quantity_sold INTEGER DEFAULT 0,
    quantity_available INTEGER DEFAULT 0, -- Auto-calculated: purchased - sold
    last_purchase_date TIMESTAMP,
    last_sale_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(dealer_id, product_id) -- One record per dealer-product combination
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_dealer ON dealer_inventory(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_product ON dealer_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_dealer_inventory_available ON dealer_inventory(quantity_available);

-- Function to update dealer inventory timestamp
CREATE OR REPLACE FUNCTION update_dealer_inventory_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    NEW.quantity_available = NEW.quantity_purchased - NEW.quantity_sold;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp and available quantity
DROP TRIGGER IF EXISTS trigger_update_dealer_inventory_timestamp ON dealer_inventory;
CREATE TRIGGER trigger_update_dealer_inventory_timestamp
BEFORE UPDATE ON dealer_inventory
FOR EACH ROW
EXECUTE FUNCTION update_dealer_inventory_timestamp();

-- Function to auto-calculate available quantity on insert
CREATE OR REPLACE FUNCTION calculate_dealer_inventory_available()
RETURNS TRIGGER AS $$
BEGIN
    NEW.quantity_available = NEW.quantity_purchased - NEW.quantity_sold;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for insert
DROP TRIGGER IF EXISTS trigger_calculate_dealer_inventory_available ON dealer_inventory;
CREATE TRIGGER trigger_calculate_dealer_inventory_available
BEFORE INSERT ON dealer_inventory
FOR EACH ROW
EXECUTE FUNCTION calculate_dealer_inventory_available();

-- View for easy inventory lookup with product details
CREATE OR REPLACE VIEW dealer_inventory_view AS
SELECT 
    di.id,
    di.dealer_id,
    d.full_name as dealer_name,
    d.business_name,
    di.product_id,
    dp.company,
    dp.segment,
    dp.model_number,
    dp.product_type,
    dp.description,
    dp.dealer_purchase_price,
    dp.dealer_sale_price,
    di.quantity_purchased,
    di.quantity_sold,
    di.quantity_available,
    di.last_purchase_date,
    di.last_sale_date,
    di.created_at,
    di.updated_at
FROM dealer_inventory di
JOIN dealers d ON di.dealer_id = d.dealer_id
JOIN dealer_products dp ON di.product_id = dp.id
WHERE di.quantity_available > 0;

COMMENT ON TABLE dealer_inventory IS 'Tracks inventory for each dealer - what they have bought and what is available for sale';
COMMENT ON VIEW dealer_inventory_view IS 'Complete view of dealer inventory with product details';
