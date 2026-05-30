-- Add location fields to customer profiles
-- This keeps customer profile data aligned with Buy Now details

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS city VARCHAR(100),
  ADD COLUMN IF NOT EXISTS landmark VARCHAR(150),
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Optional: update existing rows with empty strings for consistency
UPDATE customers
SET city = COALESCE(city, ''),
    landmark = COALESCE(landmark, ''),
    district = COALESCE(district, ''),
    state = COALESCE(state, '')
WHERE city IS NULL OR landmark IS NULL OR district IS NULL OR state IS NULL;
