-- ========================================
-- DEALER PRODUCT PRICING SYSTEM
-- ========================================

-- Dealer Products Master Table
CREATE TABLE IF NOT EXISTS dealer_products (
    id SERIAL PRIMARY KEY,
    company VARCHAR(100) NOT NULL,
    segment VARCHAR(100) NOT NULL,
    model_number VARCHAR(200) NOT NULL UNIQUE,
    product_type VARCHAR(100) NOT NULL,
    description TEXT,
    specifications TEXT,
    base_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    dealer_purchase_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    dealer_sale_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    in_stock BOOLEAN DEFAULT true,
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster searches
CREATE INDEX IF NOT EXISTS idx_dealer_products_company ON dealer_products(company);
CREATE INDEX IF NOT EXISTS idx_dealer_products_segment ON dealer_products(segment);
CREATE INDEX IF NOT EXISTS idx_dealer_products_type ON dealer_products(product_type);
CREATE INDEX IF NOT EXISTS idx_dealer_products_model ON dealer_products(model_number);
CREATE INDEX IF NOT EXISTS idx_dealer_products_active ON dealer_products(is_active);

-- Dealer Product Price History (Track price changes)
CREATE TABLE IF NOT EXISTS dealer_product_price_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES dealer_products(id) ON DELETE CASCADE,
    old_purchase_price DECIMAL(10, 2),
    new_purchase_price DECIMAL(10, 2),
    old_sale_price DECIMAL(10, 2),
    new_sale_price DECIMAL(10, 2),
    changed_by VARCHAR(100),
    change_type VARCHAR(50), -- 'manual', 'excel_upload', 'percentage_adjustment'
    change_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dealer Transactions (Buy/Sale)
CREATE TABLE IF NOT EXISTS dealer_transactions (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL, -- 'purchase' or 'sale'
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    gst_amount DECIMAL(12, 2) DEFAULT 0,
    final_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'cancelled'
    payment_method VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dealer_transactions_dealer ON dealer_transactions(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_type ON dealer_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_date ON dealer_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_invoice ON dealer_transactions(invoice_number);

-- Dealer Transaction Items
CREATE TABLE IF NOT EXISTS dealer_transaction_items (
    id SERIAL PRIMARY KEY,
    transaction_id INTEGER REFERENCES dealer_transactions(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES dealer_products(id),
    product_name VARCHAR(200) NOT NULL,
    model_number VARCHAR(200) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(12, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON dealer_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_transaction_items_product ON dealer_transaction_items(product_id);

-- Dealer Pricing Excel Upload Log
CREATE TABLE IF NOT EXISTS dealer_pricing_upload_log (
    id SERIAL PRIMARY KEY,
    uploaded_by VARCHAR(100) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    total_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_details TEXT,
    upload_status VARCHAR(50) DEFAULT 'processing', -- 'processing', 'completed', 'failed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Data for Testing
INSERT INTO dealer_products (company, segment, model_number, product_type, description, base_price, dealer_purchase_price, dealer_sale_price, stock_quantity)
VALUES 
('Hikvision', 'IP Camera', 'DS-2CD1023G0-I', 'Bullet Camera', '2MP IR Fixed Network Bullet Camera', 3500.00, 2800.00, 3200.00, 50),
('Hikvision', 'IP Camera', 'DS-2CD1343G0-I', 'Dome Camera', '4MP IR Fixed Dome Network Camera', 4200.00, 3400.00, 3900.00, 45),
('CP Plus', 'HD Camera', 'CP-USC-TA13L2', 'Dome Camera', '1.3MP HD Dome Camera', 1200.00, 950.00, 1100.00, 100),
('CP Plus', 'HD Camera', 'CP-UVC-T1100L2', 'Bullet Camera', '1MP HD Bullet Camera', 1100.00, 880.00, 1000.00, 80),
('Dahua', 'IP Camera', 'DH-IPC-HFW1230S', 'Bullet Camera', '2MP IR Bullet Network Camera', 3200.00, 2600.00, 3000.00, 60),
('Dahua', 'NVR', 'NVR4104HS-P-4KS2', 'NVR', '4 Channel POE NVR', 6500.00, 5200.00, 6000.00, 30),
('Hikvision', 'DVR', 'DS-7104HQHI-K1', 'DVR', '4 Channel Turbo HD DVR', 4800.00, 3850.00, 4400.00, 40),
('CP Plus', 'DVR', 'CP-UVR-0401E1-CS', 'DVR', '4 Channel HD DVR', 3500.00, 2800.00, 3200.00, 55);

-- Comments for schema
COMMENT ON TABLE dealer_products IS 'Master table for all dealer products with pricing information';
COMMENT ON TABLE dealer_product_price_history IS 'Tracks all price changes for audit purposes';
COMMENT ON TABLE dealer_transactions IS 'Records all purchase and sale transactions by dealers';
COMMENT ON TABLE dealer_transaction_items IS 'Line items for each transaction';
COMMENT ON TABLE dealer_pricing_upload_log IS 'Logs all Excel file uploads for pricing updates';

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_dealer_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update timestamp on dealer_products
DROP TRIGGER IF EXISTS trigger_update_dealer_products_timestamp ON dealer_products;
CREATE TRIGGER trigger_update_dealer_products_timestamp
BEFORE UPDATE ON dealer_products
FOR EACH ROW
EXECUTE FUNCTION update_dealer_products_timestamp();

-- Trigger to update timestamp on dealer_transactions
DROP TRIGGER IF EXISTS trigger_update_dealer_transactions_timestamp ON dealer_transactions;
CREATE TRIGGER trigger_update_dealer_transactions_timestamp
BEFORE UPDATE ON dealer_transactions
FOR EACH ROW
EXECUTE FUNCTION update_dealer_products_timestamp();
