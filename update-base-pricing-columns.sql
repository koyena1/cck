-- Add price columns to base pricing tables
-- Run this script in your PostgreSQL database

-- Camera Types: Add price column (base price for IP/HD)
ALTER TABLE camera_types ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Brands: Add HD and IP price columns (different prices per camera type)
ALTER TABLE brands ADD COLUMN IF NOT EXISTS hd_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE brands ADD COLUMN IF NOT EXISTS ip_price DECIMAL(10,2) DEFAULT 0;

-- Channel Options: Add price column (DVR/NVR cost)
ALTER TABLE channel_options ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Pixel Options: Add price column (resolution premium)
ALTER TABLE pixel_options ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0;

-- Set default prices for camera types
UPDATE camera_types SET price = 500 WHERE name = 'IP Camera';
UPDATE camera_types SET price = 300 WHERE name = 'HD Camera';

-- Set default brand prices (example values - adjust as needed)
UPDATE brands SET hd_price = 300, ip_price = 500 WHERE name = 'Hikvision';
UPDATE brands SET hd_price = 250, ip_price = 450 WHERE name = 'Dahua';
UPDATE brands SET hd_price = 200, ip_price = 400 WHERE name = 'CP Plus';

-- Set default channel prices
UPDATE channel_options SET price = 3500 WHERE channel_count = 4;
UPDATE channel_options SET price = 5500 WHERE channel_count = 8;
UPDATE channel_options SET price = 9500 WHERE channel_count = 16;
UPDATE channel_options SET price = 15000 WHERE channel_count = 32;

-- Set default pixel prices (premium for higher resolution)
UPDATE pixel_options SET price = 0 WHERE name = '2MP';
UPDATE pixel_options SET price = 200 WHERE name = '5MP';
UPDATE pixel_options SET price = 400 WHERE name = '8MP';

-- Verify the changes
SELECT 'Camera Types' as table_name, name, price FROM camera_types
UNION ALL
SELECT 'Brands - HD' as table_name, name, hd_price FROM brands
UNION ALL
SELECT 'Brands - IP' as table_name, name, ip_price FROM brands
UNION ALL
SELECT 'Channels' as table_name, CONCAT(channel_count::text, ' CH'), price FROM channel_options
UNION ALL
SELECT 'Pixels' as table_name, name, price FROM pixel_options
ORDER BY table_name, name;
