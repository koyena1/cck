-- Add pricing structure to all quotation setting tables

-- 1. Add price columns to camera_types table
ALTER TABLE camera_types ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- 2. Add price columns to brands table (with camera type specific pricing)
-- We'll need to restructure this to support per-camera-type pricing
-- First, let's add a simple price column
ALTER TABLE brands ADD COLUMN IF NOT EXISTS hd_price DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS ip_price DECIMAL(10, 2) DEFAULT 0;

-- 3. Channel options already updated in previous file
ALTER TABLE channel_options ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- 4. Add price to pixel_options
ALTER TABLE pixel_options ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- Set default prices for Camera Types
UPDATE camera_types SET price = 500 WHERE name = 'HD Camera';
UPDATE camera_types SET price = 800 WHERE name = 'IP Camera';

-- Set default prices for Brands (HD and IP prices)
UPDATE brands SET hd_price = 300, ip_price = 500 WHERE name = 'Hikvision';
UPDATE brands SET hd_price = 250, ip_price = 450 WHERE name = 'CP Plus';
UPDATE brands SET hd_price = 280, ip_price = 480 WHERE name = 'Honeywell';
UPDATE brands SET hd_price = 270, ip_price = 470 WHERE name = 'Dahua';

-- Set default prices for Channels
UPDATE channel_options SET price = 3500 WHERE channel_count = 4;
UPDATE channel_options SET price = 5500 WHERE channel_count = 8;
UPDATE channel_options SET price = 8500 WHERE channel_count = 16;
UPDATE channel_options SET price = 12000 WHERE channel_count = 32;

-- Set default prices for Pixels
UPDATE pixel_options SET price = 0 WHERE name = '2MP';
UPDATE pixel_options SET price = 500 WHERE name = '5MP';
UPDATE pixel_options SET price = 1000 WHERE name = '8MP';

-- Display all updated data
SELECT 'Camera Types:' as table_name;
SELECT id, name, price FROM camera_types ORDER BY display_order;

SELECT 'Brands:' as table_name;
SELECT id, name, hd_price, ip_price FROM brands ORDER BY display_order;

SELECT 'Channels:' as table_name;
SELECT id, channel_count, price FROM channel_options ORDER BY display_order;

SELECT 'Pixels:' as table_name;
SELECT id, name, price FROM pixel_options ORDER BY display_order;
