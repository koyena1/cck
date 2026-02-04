-- ============================================
-- Unified Orders System Migration
-- This script updates the existing orders table to support both:
-- 1. HD Combo/Quotation orders (existing functionality)
-- 2. Product cart orders (new functionality)
-- ============================================

-- Add new columns to support product cart orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS products JSONB,
ADD COLUMN IF NOT EXISTS products_total NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS with_amc BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS amc_details JSONB,
ADD COLUMN IF NOT EXISTS amc_cost NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS landmark VARCHAR(255);

-- Update order_type to allow 'product_cart' in addition to existing types
-- Existing types: 'hd_combo', 'quotation', etc.
-- New type: 'product_cart'

-- Add comments for clarity
COMMENT ON COLUMN orders.products IS 'JSONB array of products for cart-based orders';
COMMENT ON COLUMN orders.products_total IS 'Subtotal of all products before installation/AMC';
COMMENT ON COLUMN orders.with_amc IS 'Whether customer opted for AMC service';
COMMENT ON COLUMN orders.amc_details IS 'JSONB object with AMC plan details';
COMMENT ON COLUMN orders.amc_cost IS 'AMC service cost';
COMMENT ON COLUMN orders.order_type IS 'Type: hd_combo, quotation, product_cart, etc.';

-- Rename installation_address to address for consistency (if needed)
-- Note: installation_address already exists, keeping it for backward compatibility

-- Make customer_email NOT NULL for future orders (existing data allowed)
-- ALTER TABLE orders ALTER COLUMN customer_email SET NOT NULL; -- Uncomment if all orders have email

-- Add index for product cart orders filtering
CREATE INDEX IF NOT EXISTS idx_orders_type_status ON orders(order_type, status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- Update status enum to include 'in-progress' (if using CHECK constraint)
-- The existing table uses varchar(50) with default 'Pending', which is flexible

-- Add mapping between old and new column names for compatibility:
-- installation_address = address (use existing column)
-- pincode = pin_code (already exists as pincode)
-- city, state (already exist)

COMMENT ON TABLE orders IS 'Unified orders table supporting HD combo quotations and product cart orders';

-- Optional: Create a view for product cart orders only
CREATE OR REPLACE VIEW product_cart_orders AS
SELECT 
  order_id,
  order_number,
  customer_name,
  customer_phone,
  customer_email,
  installation_address as address,
  pincode,
  city,
  state,
  landmark,
  products,
  products_total,
  includes_installation as with_installation,
  installation_charges as installation_cost,
  with_amc,
  amc_details,
  amc_cost,
  total_amount,
  payment_method,
  payment_status,
  status,
  created_at,
  updated_at
FROM orders
WHERE order_type = 'product_cart';

-- Optional: Create a view for quotation orders
CREATE OR REPLACE VIEW quotation_orders AS
SELECT 
  order_id,
  order_number,
  customer_name,
  customer_phone,
  customer_email,
  order_type,
  combo_id,
  installation_address,
  pincode,
  city,
  state,
  camera_type,
  brand,
  channels,
  dvr_model,
  indoor_cameras,
  outdoor_cameras,
  storage_size,
  cable_option,
  includes_accessories,
  includes_installation,
  subtotal,
  installation_charges,
  delivery_charges,
  tax_amount,
  discount_amount,
  total_amount,
  status,
  assigned_dealer_id,
  payment_method,
  payment_status,
  created_at,
  updated_at
FROM orders
WHERE order_type IN ('hd_combo', 'quotation', 'ip_combo');

-- Success message
SELECT 'Unified orders migration completed successfully!' AS status;
SELECT 'Orders table now supports both quotation and product cart orders' AS info;
SELECT 'Use order_type = product_cart for cart orders' AS usage;
