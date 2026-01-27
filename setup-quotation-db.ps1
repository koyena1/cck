$env:PGPASSWORD='Koyen@123'
$psql = "C:\Program Files\PostgreSQL\17\bin\psql.exe"

$sql = @"
CREATE TABLE IF NOT EXISTS camera_types (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS brands (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS channel_options (id SERIAL PRIMARY KEY, channel_count INTEGER NOT NULL UNIQUE, features JSONB, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS pixel_options (id SERIAL PRIMARY KEY, name VARCHAR(50) NOT NULL UNIQUE, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS camera_tech_types (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, camera_type VARCHAR(50) NOT NULL, location VARCHAR(50) NOT NULL, base_price DECIMAL(10, 2) NOT NULL, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS storage_options (id SERIAL PRIMARY KEY, capacity VARCHAR(50) NOT NULL UNIQUE, price DECIMAL(10, 2) NOT NULL, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS cable_options (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL, cable_type VARCHAR(50) NOT NULL, length VARCHAR(50) NOT NULL, price DECIMAL(10, 2) NOT NULL, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS accessories (id SERIAL PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, price DECIMAL(10, 2) NOT NULL, display_order INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
CREATE TABLE IF NOT EXISTS quotation_settings (id SERIAL PRIMARY KEY, setting_key VARCHAR(100) NOT NULL UNIQUE, setting_value TEXT NOT NULL, description TEXT, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);

INSERT INTO camera_types (name, display_order) VALUES ('IP Camera', 1), ('HD Camera', 2) ON CONFLICT (name) DO NOTHING;
INSERT INTO brands (name, display_order) VALUES ('Hikvision', 1), ('CP Plus', 2), ('Honeywell', 3), ('Dahua', 4) ON CONFLICT (name) DO NOTHING;
INSERT INTO pixel_options (name, display_order) VALUES ('2MP', 1), ('5MP', 2) ON CONFLICT (name) DO NOTHING;
INSERT INTO camera_tech_types (name, camera_type, location, base_price, display_order) VALUES ('HD Non Audio', 'HD', 'indoor', 1200, 1), ('HD Audio', 'HD', 'indoor', 1500, 2), ('HD Smart Hybrid', 'HD', 'outdoor', 1800, 3), ('HD Full Color', 'HD', 'outdoor', 2200, 4) ON CONFLICT (name) DO NOTHING;
INSERT INTO storage_options (capacity, price, display_order) VALUES ('500GB', 2200, 1), ('1TB', 4100, 2), ('2TB', 6200, 3), ('4TB', 9800, 4) ON CONFLICT (capacity) DO NOTHING;
INSERT INTO cable_options (name, cable_type, length, price, display_order) VALUES ('3+1 Coaxial Cable (90 Mtr Roll)', 'HD', '90M', 1800, 1), ('3+1 Coaxial Cable (180 Mtr Roll)', 'HD', '180M', 3200, 2), ('3+1 Coaxial Cable (305 Mtr Roll)', 'HD', '305M', 5500, 3), ('CAT6 LAN Cable (100 Mtr Roll)', 'IP', '100M', 2000, 4), ('CAT6 LAN Cable (305 Mtr Roll)', 'IP', '305M', 5800, 5);
INSERT INTO accessories (name, price, display_order) VALUES ('BNC Connectors (Pack)', 450, 1), ('DC Pins (Pack)', 250, 2), ('SMPS Power Box', 1200, 3) ON CONFLICT (name) DO NOTHING;
INSERT INTO quotation_settings (setting_key, setting_value, description) VALUES ('gst_rate', '18', 'GST/Tax rate in percentage'), ('default_discount', '0', 'Default discount percentage'), ('installation_charges_base', '5000', 'Base installation charges') ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value;
"@

& $psql -U postgres -d cctv_platform -c $sql

# Insert channel options separately due to JSON complexity
& $psql -U postgres -d cctv_platform -c "INSERT INTO channel_options (channel_count, features, display_order) VALUES (4, '[\"Supports up to 4 Cameras\", \"1080p/5MP Lite Resolution\", \"1 SATA Port\", \"H.265+ Compression\"]'::jsonb, 1) ON CONFLICT (channel_count) DO NOTHING;"
& $psql -U postgres -d cctv_platform -c "INSERT INTO channel_options (channel_count, features, display_order) VALUES (8, '[\"Supports up to 8 Cameras\", \"5MP Real-time Resolution Support\", \"1 SATA Port\", \"Smart Search Features\"]'::jsonb, 2) ON CONFLICT (channel_count) DO NOTHING;"
& $psql -U postgres -d cctv_platform -c "INSERT INTO channel_options (channel_count, features, display_order) VALUES (16, '[\"Supports up to 16 Cameras\", \"4K Output / 5MP Multi-channel\", \"2 SATA Ports\", \"Advanced Analytics\"]'::jsonb, 3) ON CONFLICT (channel_count) DO NOTHING;"

Write-Host "Database tables created successfully!"
