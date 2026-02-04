-- Quotation Settings Tables for Admin Management

-- Camera Types (IP Camera, HD Camera, etc.)
CREATE TABLE IF NOT EXISTS camera_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Brands (Hikvision, CP Plus, etc.)
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channel Options (4Ch, 8Ch, 16Ch with details)
CREATE TABLE IF NOT EXISTS channel_options (
  id SERIAL PRIMARY KEY,
  channel_count INTEGER NOT NULL UNIQUE,
  features JSONB, -- ["Supports up to 4 Cameras", "1080p/5MP Lite Resolution", ...]
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pixel Options (2MP, 5MP, etc.)
CREATE TABLE IF NOT EXISTS pixel_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Camera Technology Types (HD Non Audio, HD Audio, HD Smart Hybrid, etc.)
CREATE TABLE IF NOT EXISTS camera_tech_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  camera_type VARCHAR(50) NOT NULL, -- 'IP' or 'HD'
  location VARCHAR(50) NOT NULL, -- 'indoor' or 'outdoor'  
  base_price DECIMAL(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Storage Options (500GB, 1TB, 2TB, etc.)
CREATE TABLE IF NOT EXISTS storage_options (
  id SERIAL PRIMARY KEY,
  capacity VARCHAR(50) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cable Options (90M, 180M, 305M rolls)
CREATE TABLE IF NOT EXISTS cable_options (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  cable_type VARCHAR(50) NOT NULL, -- 'HD' (3+1 Coaxial) or 'IP' (CAT6 LAN)
  length VARCHAR(50) NOT NULL, -- '90M', '180M', '305M'
  price DECIMAL(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Accessories (BNC Connectors, DC Pins, SMPS, etc.)
CREATE TABLE IF NOT EXISTS accessories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Global Quotation Settings (Tax, Discount, etc.)
CREATE TABLE IF NOT EXISTS quotation_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default data
INSERT INTO camera_types (name, display_order) VALUES
('IP Camera', 1),
('HD Camera', 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO brands (name, display_order) VALUES
('Hikvision', 1),
('CP Plus', 2),
('Honeywell', 3),
('Dahua', 4)
ON CONFLICT (name) DO NOTHING;

INSERT INTO channel_options (channel_count, features, display_order) VALUES
(4, '["Supports up to 4 Cameras", "1080p/5MP Lite Resolution", "1 SATA Port (Up to 6TB)", "H.265+ Compression"]', 1),
(8, '["Supports up to 8 Cameras", "5MP Real-time Resolution Support", "1 SATA Port (Up to 10TB)", "Smart Search Features"]', 2),
(16, '["Supports up to 16 Cameras", "4K Output / 5MP Multi-channel", "2 SATA Ports (Up to 20TB)", "Advanced Analytics"]', 3)
ON CONFLICT (channel_count) DO NOTHING;

INSERT INTO pixel_options (name, display_order) VALUES
('2MP', 1),
('5MP', 2)
ON CONFLICT (name) DO NOTHING;

INSERT INTO camera_tech_types (name, camera_type, location, base_price, display_order) VALUES
('HD Non Audio', 'HD', 'indoor', 1200, 1),
('HD Audio', 'HD', 'indoor', 1500, 2),
('HD Smart Hybrid', 'HD', 'outdoor', 1800, 3),
('HD Full Color', 'HD', 'outdoor', 2200, 4)
ON CONFLICT (name) DO NOTHING;

INSERT INTO storage_options (capacity, price, display_order) VALUES
('500GB', 2200, 1),
('1TB', 4100, 2),
('2TB', 6200, 3),
('4TB', 9800, 4)
ON CONFLICT (capacity) DO NOTHING;

INSERT INTO cable_options (name, cable_type, length, price, display_order) VALUES
('3+1 Coaxial Cable (90 Mtr Roll)', 'HD', '90M', 1800, 1),
('3+1 Coaxial Cable (180 Mtr Roll)', 'HD', '180M', 3200, 2),
('3+1 Coaxial Cable (305 Mtr Roll)', 'HD', '305M', 5500, 3),
('CAT6 LAN Cable (100 Mtr Roll)', 'IP', '100M', 2000, 4),
('CAT6 LAN Cable (305 Mtr Roll)', 'IP', '305M', 5800, 5)
ON CONFLICT DO NOTHING;

INSERT INTO accessories (name, price, display_order) VALUES
('BNC Connectors (Pack)', 450, 1),
('DC Pins (Pack)', 250, 2),
('SMPS Power Box', 1200, 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO quotation_settings (setting_key, setting_value, description) VALUES
('gst_rate', '18', 'GST/Tax rate in percentage'),
('default_discount', '0', 'Default discount percentage'),
('installation_charges_base', '5000', 'Base installation charges')
ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
