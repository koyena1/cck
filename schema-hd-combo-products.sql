-- HD Combo Products Table
-- This table stores all HD Combo products managed from admin backend

CREATE TABLE IF NOT EXISTS hd_combo_products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    channels INTEGER NOT NULL,
    camera_type VARCHAR(50) NOT NULL, -- Bullet, Dome, etc.
    resolution VARCHAR(20) NOT NULL, -- 2MP, 4MP, 5MP, etc.
    hdd VARCHAR(50) NOT NULL, -- 500GB, 1TB, 2TB, etc.
    cable VARCHAR(50) NOT NULL, -- 60 Meter, 90 Meter, 120 Meter, etc.
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    image TEXT, -- Base64 encoded image or URL
    specs TEXT[], -- Array of specifications
    rating DECIMAL(2, 1) DEFAULT 4.5,
    reviews INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries
CREATE INDEX idx_hd_combo_brand ON hd_combo_products(brand);
CREATE INDEX idx_hd_combo_active ON hd_combo_products(is_active);
CREATE INDEX idx_hd_combo_channels ON hd_combo_products(channels);

-- Sample data (optional - can be inserted via admin)
-- INSERT INTO hd_combo_products (name, brand, channels, camera_type, resolution, hdd, cable, price, original_price, image, specs, rating, reviews)
-- VALUES 
--   ('Hikvision 4CH DVR Complete Kit', 'Hikvision', 4, 'Bullet', '2MP', '1TB', '90 Meter', 15999, 22000, '/prod1.jpg', 
--    ARRAY['4CH DVR', '4 Bullet Cameras 2MP', '1TB HDD', '90m Cable'], 4.5, 128);
