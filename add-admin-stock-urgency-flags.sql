-- ========================================
-- ADMIN STOCK URGENCY FLAGS TABLE
-- Allows admin to mark specific dealer-product combinations as urgent
-- These flags are shown to the dealer on their portal
-- ========================================

CREATE TABLE IF NOT EXISTS admin_stock_urgency_flags (
    id SERIAL PRIMARY KEY,
    dealer_id INTEGER REFERENCES dealers(dealer_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES dealer_products(id) ON DELETE CASCADE,
    flag_type VARCHAR(30) NOT NULL CHECK (flag_type IN ('low_stock', 'out_of_stock', 'stale', 'urgent')),
    note TEXT,
    flagged_by VARCHAR(100) DEFAULT 'admin',
    flagged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(dealer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_urgency_flags_dealer ON admin_stock_urgency_flags(dealer_id);
CREATE INDEX IF NOT EXISTS idx_urgency_flags_product ON admin_stock_urgency_flags(product_id);
CREATE INDEX IF NOT EXISTS idx_urgency_flags_active ON admin_stock_urgency_flags(is_active);

COMMENT ON TABLE admin_stock_urgency_flags IS 'Admin-managed urgency flags on dealer stock items. Visible to dealers on their portal.';
