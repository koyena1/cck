-- Camera Pricing Matrix Table
-- Stores unique price for each combination of camera attributes
CREATE TABLE IF NOT EXISTS camera_pricing (
    id SERIAL PRIMARY KEY,
    camera_type_id INTEGER REFERENCES camera_types(id) ON DELETE CASCADE,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    pixel_id INTEGER REFERENCES pixel_options(id) ON DELETE CASCADE,
    tech_type_id INTEGER REFERENCES camera_tech_types(id) ON DELETE CASCADE,
    base_price DECIMAL(10, 2) NOT NULL,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(camera_type_id, brand_id, pixel_id, tech_type_id)
);

-- Create index for faster lookups
CREATE INDEX idx_camera_pricing_lookup ON camera_pricing(camera_type_id, brand_id, pixel_id, tech_type_id);

-- Insert sample pricing data
INSERT INTO camera_pricing (camera_type_id, brand_id, pixel_id, tech_type_id, base_price, notes) VALUES
-- Hikvision IP Cameras
(1, 1, 1, 1, 2800.00, 'Hikvision 2MP IP Non-Audio'),
(1, 1, 1, 2, 3200.00, 'Hikvision 2MP IP Audio'),
(1, 1, 1, 3, 3500.00, 'Hikvision 2MP IP Smart Hybrid'),
(1, 1, 2, 1, 3500.00, 'Hikvision 5MP IP Non-Audio'),
(1, 1, 2, 2, 3800.00, 'Hikvision 5MP IP Audio'),
(1, 1, 2, 3, 4200.00, 'Hikvision 5MP IP Smart Hybrid'),

-- CP Plus IP Cameras
(1, 2, 1, 1, 2500.00, 'CP Plus 2MP IP Non-Audio'),
(1, 2, 1, 2, 2900.00, 'CP Plus 2MP IP Audio'),
(1, 2, 1, 3, 3200.00, 'CP Plus 2MP IP Smart Hybrid'),
(1, 2, 2, 1, 3200.00, 'CP Plus 5MP IP Non-Audio'),
(1, 2, 2, 2, 3500.00, 'CP Plus 5MP IP Audio'),
(1, 2, 2, 3, 3900.00, 'CP Plus 5MP IP Smart Hybrid'),

-- Hikvision HD Cameras
(2, 1, 1, 1, 2200.00, 'Hikvision 2MP HD Non-Audio'),
(2, 1, 1, 2, 2600.00, 'Hikvision 2MP HD Audio'),
(2, 1, 1, 3, 2900.00, 'Hikvision 2MP HD Smart Hybrid'),
(2, 1, 2, 1, 2900.00, 'Hikvision 5MP HD Non-Audio'),
(2, 1, 2, 2, 3200.00, 'Hikvision 5MP HD Audio'),
(2, 1, 2, 3, 3600.00, 'Hikvision 5MP HD Smart Hybrid'),

-- CP Plus HD Cameras
(2, 2, 1, 1, 1900.00, 'CP Plus 2MP HD Non-Audio'),
(2, 2, 1, 2, 2300.00, 'CP Plus 2MP HD Audio'),
(2, 2, 1, 3, 2600.00, 'CP Plus 2MP HD Smart Hybrid'),
(2, 2, 2, 1, 2600.00, 'CP Plus 5MP HD Non-Audio'),
(2, 2, 2, 2, 2900.00, 'CP Plus 5MP HD Audio'),
(2, 2, 2, 3, 3300.00, 'CP Plus 5MP HD Smart Hybrid');

-- Function to update timestamp
CREATE OR REPLACE FUNCTION update_camera_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
CREATE TRIGGER camera_pricing_update_timestamp
BEFORE UPDATE ON camera_pricing
FOR EACH ROW
EXECUTE FUNCTION update_camera_pricing_timestamp();
