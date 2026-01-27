-- Enhanced Camera Pricing Table (replaces camera_pricing)
DROP TABLE IF EXISTS camera_pricing CASCADE;

CREATE TABLE camera_pricing (
    id SERIAL PRIMARY KEY,
    camera_type_id INTEGER REFERENCES camera_types(id) ON DELETE CASCADE,
    brand_id INTEGER REFERENCES brands(id) ON DELETE CASCADE,
    pixel_id INTEGER REFERENCES pixel_options(id) ON DELETE CASCADE,
    tech_type_id INTEGER REFERENCES camera_tech_types(id) ON DELETE CASCADE,
    
    -- Enhanced fields
    model_number VARCHAR(100),
    shape VARCHAR(50), -- Dome, Bullet, VF Dome, VF Bullet
    ir_distance VARCHAR(50), -- 20 mtr, 40 mtr, 80 mtr, etc.
    specifications TEXT,
    warranty VARCHAR(100) DEFAULT '2 years Warranty',
    
    -- Pricing
    price DECIMAL(10, 2) NOT NULL,
    
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_camera_pricing_active ON camera_pricing(is_active);
CREATE INDEX idx_camera_pricing_type_brand ON camera_pricing(camera_type_id, brand_id);

-- HD Camera Accessories Pricing
CREATE TABLE hd_accessories_pricing (
    id SERIAL PRIMARY KEY,
    ch_count INTEGER NOT NULL, -- 4, 8, 16
    smps_qty INTEGER NOT NULL,
    bnc_qty INTEGER NOT NULL,
    dc_jack_qty INTEGER NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ch_count, smps_qty)
);

-- Sample HD accessories data
INSERT INTO hd_accessories_pricing (ch_count, smps_qty, bnc_qty, dc_jack_qty, total_cost, description) VALUES
(4, 1, 8, 4, 600.00, '4CH SMPS 1pc, BNC 8pc, DC Jack 4pc'),
(8, 1, 16, 8, 875.00, '8CH SMPS 1pc, BNC 16pc, DC Jack 8pc'),
(16, 2, 32, 16, 1750.00, '16CH SMPS 2pc, BNC 32pc, DC Jack 16pc');

-- IP Camera Accessories Pricing
CREATE TABLE ip_accessories_pricing (
    id SERIAL PRIMARY KEY,
    ch_count INTEGER NOT NULL, -- 4, 8, 16
    poe_qty INTEGER NOT NULL,
    rj45_qty INTEGER NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(ch_count, poe_qty)
);

-- Sample IP accessories data
INSERT INTO ip_accessories_pricing (ch_count, poe_qty, rj45_qty, total_cost, description) VALUES
(4, 1, 12, 1260.00, '4CH POE 1pc, RJ45 Connector 12pc'),
(8, 1, 20, 1600.00, '8CH POE 1pc, RJ45 Connector 20pc'),
(16, 2, 40, 3150.00, '16CH POE 2pc, RJ45 Connector 40pc');

-- Cable Options Pricing
CREATE TABLE cable_options_pricing (
    id SERIAL PRIMARY KEY,
    cable_type VARCHAR(100) NOT NULL,
    cable_name VARCHAR(200) NOT NULL,
    length VARCHAR(50), -- 90 MTR, 100 MTR, 305 MTR
    price DECIMAL(10, 2) NOT NULL,
    camera_type_id INTEGER REFERENCES camera_types(id), -- HD or IP
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample cable data
INSERT INTO cable_options_pricing (cable_type, cable_name, length, price, camera_type_id, display_order) VALUES
('hd_cable', '3+1 Cable', '90 MTR', 450.00, 2, 1),
('ip_cable', 'CAT6 Cable', '100 MTR', 800.00, 3, 1),
('ip_cable', 'CAT6 Cable', '305 MTR', 2400.00, 3, 2);

-- Installation Pricing
CREATE TABLE installation_pricing (
    id SERIAL PRIMARY KEY,
    camera_qty_from INTEGER NOT NULL,
    camera_qty_to INTEGER NOT NULL,
    price_per_camera DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample installation pricing
INSERT INTO installation_pricing (camera_qty_from, camera_qty_to, price_per_camera, description) VALUES
(1, 8, 400.00, 'Installation for 1-8 cameras'),
(9, 999, 350.00, 'Installation for 9+ cameras');

-- AMC Pricing
CREATE TABLE amc_pricing (
    id SERIAL PRIMARY KEY,
    amc_type VARCHAR(50) NOT NULL, -- with_material, without_material
    duration INTEGER NOT NULL, -- 1 or 2 (years)
    price_per_camera DECIMAL(10, 2) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(amc_type, duration)
);

-- Sample AMC pricing
INSERT INTO amc_pricing (amc_type, duration, price_per_camera, description) VALUES
('with_material', 1, 400.00, 'AMC with Material - 1 Year'),
('with_material', 2, 700.00, 'AMC with Material - 2 Years'),
('without_material', 1, 250.00, 'AMC without Material - 1 Year'),
('without_material', 2, 200.00, 'AMC without Material - 2 Years');

-- Insert sample camera pricing data with enhanced fields
INSERT INTO camera_pricing (camera_type_id, brand_id, pixel_id, tech_type_id, model_number, shape, ir_distance, specifications, price) VALUES
-- Hikvision IP Cameras
(3, 1, 1, 1, 'DS-2CE5ADOT-ITP\ECO', 'Dome', '20 mtr', '1080P Resolution, CMOS Image Sensor, Up to 20m IR Distance, 2.8 mm/3.6 mm', 640.00),
(3, 1, 1, 2, 'DS-2CE1ADOT-ITP\ECO', 'Bullet', '20 mtr', '1080P Resolution, CMOS Image Sensor, Up to 20m IR Distance, 2.8 mm/3.6 mm', 700.00),

-- Hikvision HD Cameras 2MP
(2, 1, 1, 1, 'DS-2CE76D0T-ITPFS', 'Dome', '20 mtr', '1080P, Built-in-Mic, Up to 20m IR Distance, Switchable to TVI/AHD/CVI/CVBS', 770.00),
(2, 1, 1, 1, 'DS-2CE16D0T-ITPFS', 'Bullet', '20 mtr', '1080P, Built-in-Mic, Up to 20m IR Distance, Switchable to TVI/AHD/CVI/CVBS', 850.00),

-- Hikvision HD Cameras 5MP
(2, 1, 2, 1, 'DS-2CE1AHOT-IT1F', 'Bullet', '20 mtr', '1080P, CMOS Sensor, Up to 20m IR Distance, Switchable to TVI/AHD/CVI/CVBS, 6mm', 1490.00),
(2, 1, 2, 1, 'DS-2CE1ADOT-IT3F', 'Bullet', '40 mtr', '1080P, CMOS Sensor, Up to 40m IR Distance, Switchable to TVI/AHD/CVI/CVBS, 8mm', 1680.00);
