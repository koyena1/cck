-- ========================================
-- PROFORMA INVOICE SYSTEM
-- ========================================

-- Proforma Invoices Table
CREATE TABLE IF NOT EXISTS dealer_proformas (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    proforma_number VARCHAR(100) UNIQUE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    sub_total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 5.00,
    tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'sent', 'edited', 'finalized'
    generated_by VARCHAR(50) DEFAULT 'admin', -- 'admin' or 'dealer'
    dealer_notes TEXT,
    admin_notes TEXT,
    sent_to_email VARCHAR(255),
    sent_at TIMESTAMP,
    finalized_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dealer_proformas_dealer ON dealer_proformas(dealer_id);
CREATE INDEX IF NOT EXISTS idx_dealer_proformas_status ON dealer_proformas(status);
CREATE INDEX IF NOT EXISTS idx_dealer_proformas_period ON dealer_proformas(period_start, period_end);

-- Proforma Line Items
CREATE TABLE IF NOT EXISTS dealer_proforma_items (
    id SERIAL PRIMARY KEY,
    proforma_id INTEGER REFERENCES dealer_proformas(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES dealer_products(id),
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    sale_date DATE,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    rate DECIMAL(10, 2) NOT NULL DEFAULT 0,
    amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proforma_items_proforma ON dealer_proforma_items(proforma_id);
CREATE INDEX IF NOT EXISTS idx_proforma_items_product ON dealer_proforma_items(product_id);

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_dealer_proformas_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_dealer_proformas_timestamp ON dealer_proformas;
CREATE TRIGGER trigger_update_dealer_proformas_timestamp
BEFORE UPDATE ON dealer_proformas
FOR EACH ROW
EXECUTE FUNCTION update_dealer_proformas_timestamp();
