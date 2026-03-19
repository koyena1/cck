-- Dealer-specific pricing overrides

CREATE TABLE IF NOT EXISTS dealer_product_pricing_overrides (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER NOT NULL REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES dealer_products(id) ON DELETE CASCADE,
    base_price DECIMAL(10, 2) NOT NULL,
    purchase_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    sale_percentage DECIMAL(5, 2) NOT NULL DEFAULT 0,
    dealer_purchase_price DECIMAL(10, 2) NOT NULL,
    dealer_sale_price DECIMAL(10, 2) NOT NULL,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (dealer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_dppo_dealer_id ON dealer_product_pricing_overrides(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dppo_product_id ON dealer_product_pricing_overrides(product_id);

CREATE OR REPLACE FUNCTION update_dealer_product_pricing_overrides_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dealer_product_pricing_overrides_timestamp ON dealer_product_pricing_overrides;
CREATE TRIGGER trigger_update_dealer_product_pricing_overrides_timestamp
BEFORE UPDATE ON dealer_product_pricing_overrides
FOR EACH ROW
EXECUTE FUNCTION update_dealer_product_pricing_overrides_timestamp();
