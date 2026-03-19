-- Add low stock test data for testing the low stock indicator
-- This will create inventory records with quantities between 1-4

-- First, let's check if there are any existing dealer_inventory records
-- SELECT * FROM dealer_inventory WHERE dealer_id = 3 LIMIT 10;

-- Add some low stock items for dealer with ID 3
-- Replace product_id values with actual product IDs from your dealer_products table

-- Example: Add 2 units of a product (low stock)
INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, quantity_sold, quantity_available, last_purchase_date, created_at, updated_at)
VALUES 
  (3, 1, 10, 8, 2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 2, 8, 5, 3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 3, 15, 14, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 4, 20, 16, 4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (dealer_id, product_id) 
DO UPDATE SET 
  quantity_purchased = 10,
  quantity_sold = 8,
  quantity_available = 2,
  last_purchase_date = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;

-- Add some out of stock items (quantity = 0) to test both conditions
INSERT INTO dealer_inventory (dealer_id, product_id, quantity_purchased, quantity_sold, quantity_available, last_purchase_date, created_at, updated_at)
VALUES 
  (3, 5, 25, 25, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (3, 6, 30, 30, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (dealer_id, product_id) 
DO UPDATE SET 
  quantity_purchased = 25,
  quantity_sold = 25,
  quantity_available = 0,
  last_purchase_date = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP;

-- Verify the data
SELECT 
  di.*,
  dp.company,
  dp.model_number,
  CASE 
    WHEN di.quantity_available = 0 THEN 'OUT OF STOCK'
    WHEN di.quantity_available > 0 AND di.quantity_available < 5 THEN 'LOW STOCK'
    ELSE 'GOOD STOCK'
  END as stock_status
FROM dealer_inventory di
JOIN dealer_products dp ON dp.id = di.product_id
WHERE di.dealer_id = 3
ORDER BY di.quantity_available;
