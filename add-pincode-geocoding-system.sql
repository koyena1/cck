-- Optional: Pincode Master Table for Geocoding
-- This table stores geographic coordinates for Indian pincodes
-- Use this to automatically get customer coordinates from pincode

CREATE TABLE IF NOT EXISTS pincode_master (
    pincode VARCHAR(6) PRIMARY KEY,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    region VARCHAR(50),
    division VARCHAR(100),
    office_name VARCHAR(200),
    office_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pincode_coordinates ON pincode_master(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_pincode_state ON pincode_master(state);
CREATE INDEX IF NOT EXISTS idx_pincode_district ON pincode_master(district);

COMMENT ON TABLE pincode_master IS 'Master table for Indian pincodes with geographic coordinates';
COMMENT ON COLUMN pincode_master.latitude IS 'Geographic latitude of pincode center point';
COMMENT ON COLUMN pincode_master.longitude IS 'Geographic longitude of pincode center point';

-- Sample data for testing (West Bengal pincodes)
INSERT INTO pincode_master (pincode, latitude, longitude, district, state, office_name, office_type)
VALUES 
    ('721636', 22.4200, 87.3200, 'East Medinipur', 'West Bengal', 'Tamluk', 'Sub Office'),
    ('721939', 22.4500, 87.3500, 'East Medinipur', 'West Bengal', 'Deypara', 'Branch Office'),
    ('700001', 22.5726, 88.3639, 'Kolkata', 'West Bengal', 'Kolkata GPO', 'Head Office'),
    ('700091', 22.6100, 88.4000, 'North 24 Parganas', 'West Bengal', 'Barasat', 'Sub Office'),
    ('711101', 22.5800, 88.3200, 'Howrah', 'West Bengal', 'Howrah', 'Head Office')
ON CONFLICT (pincode) DO NOTHING;

-- Function to get coordinates for a pincode
CREATE OR REPLACE FUNCTION get_pincode_coordinates(p_pincode VARCHAR(6))
RETURNS TABLE (
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    district VARCHAR(100),
    state VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT pm.latitude, pm.longitude, pm.district, pm.state
    FROM pincode_master pm
    WHERE pm.pincode = p_pincode;
END;
$$ LANGUAGE plpgsql;

-- Function to find nearest pincodes to given coordinates
CREATE OR REPLACE FUNCTION find_nearest_pincodes(
    p_latitude DECIMAL(10, 8),
    p_longitude DECIMAL(11, 8),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    pincode VARCHAR(6),
    district VARCHAR(100),
    state VARCHAR(100),
    distance_km DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pm.pincode,
        pm.district,
        pm.state,
        -- Haversine formula for distance calculation
        ROUND(
            (6371 * acos(
                cos(radians(p_latitude)) * 
                cos(radians(pm.latitude)) * 
                cos(radians(pm.longitude) - radians(p_longitude)) + 
                sin(radians(p_latitude)) * 
                sin(radians(pm.latitude))
            ))::NUMERIC,
            2
        ) as distance_km
    FROM pincode_master pm
    ORDER BY distance_km ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:

-- Get coordinates for a pincode
-- SELECT * FROM get_pincode_coordinates('721636');

-- Find 5 nearest pincodes to coordinates
-- SELECT * FROM find_nearest_pincodes(22.5726, 88.3639, 5);

-- Add coordinates to orders table (optional)
-- ALTER TABLE orders ADD COLUMN latitude DECIMAL(10, 8);
-- ALTER TABLE orders ADD COLUMN longitude DECIMAL(11, 8);

-- Trigger to auto-populate order coordinates from pincode
CREATE OR REPLACE FUNCTION auto_populate_order_coordinates()
RETURNS TRIGGER AS $$
DECLARE
    pincode_coords RECORD;
BEGIN
    -- Only populate if coordinates not already set
    IF NEW.latitude IS NULL AND NEW.longitude IS NULL THEN
        -- Try to get coordinates from pincode
        SELECT pm.latitude, pm.longitude
        INTO pincode_coords
        FROM pincode_master pm
        WHERE pm.pincode = NEW.pincode;
        
        IF FOUND THEN
            NEW.latitude := pincode_coords.latitude;
            NEW.longitude := pincode_coords.longitude;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (uncomment if orders table has lat/lng columns)
-- DROP TRIGGER IF EXISTS trigger_auto_populate_order_coordinates ON orders;
-- CREATE TRIGGER trigger_auto_populate_order_coordinates
--     BEFORE INSERT ON orders
--     FOR EACH ROW
--     EXECUTE FUNCTION auto_populate_order_coordinates();

