-- Add latitude and longitude columns to dealers table
-- This enables map-based location tracking for dealer businesses

ALTER TABLE dealers 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments for clarity
COMMENT ON COLUMN dealers.latitude IS 'Geographic latitude of dealer business location';
COMMENT ON COLUMN dealers.longitude IS 'Geographic longitude of dealer business location';

-- Create an index for geospatial queries (if needed in future)
CREATE INDEX IF NOT EXISTS idx_dealers_coordinates ON dealers(latitude, longitude);
