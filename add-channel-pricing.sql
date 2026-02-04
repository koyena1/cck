-- Add price column to channel_options table
ALTER TABLE channel_options ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0;

-- Update existing records with default prices (you can change these)
UPDATE channel_options SET price = 3500 WHERE channel_count = 4;
UPDATE channel_options SET price = 5500 WHERE channel_count = 8;
UPDATE channel_options SET price = 8500 WHERE channel_count = 16;
UPDATE channel_options SET price = 12000 WHERE channel_count = 32;

-- Display updated data
SELECT * FROM channel_options ORDER BY display_order;
