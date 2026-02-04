-- Create a dynamic brand pricing table that links brands to camera types
-- This allows any number of camera types to have prices for each brand

CREATE TABLE IF NOT EXISTS brand_camera_type_pricing (
  id SERIAL PRIMARY KEY,
  brand_id INTEGER NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  camera_type_id INTEGER NOT NULL REFERENCES camera_types(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(brand_id, camera_type_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_brand_camera_type_pricing_brand 
  ON brand_camera_type_pricing(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_camera_type_pricing_camera_type 
  ON brand_camera_type_pricing(camera_type_id);

-- Migrate existing data from brands table if columns exist
DO $$
DECLARE
  hd_camera_type_id INTEGER;
  ip_camera_type_id INTEGER;
  brand_record RECORD;
BEGIN
  -- Get camera type IDs
  SELECT id INTO hd_camera_type_id FROM camera_types WHERE LOWER(name) LIKE '%hd%' LIMIT 1;
  SELECT id INTO ip_camera_type_id FROM camera_types WHERE LOWER(name) LIKE '%ip%' LIMIT 1;
  
  -- Only migrate if we found the camera types
  IF hd_camera_type_id IS NOT NULL AND ip_camera_type_id IS NOT NULL THEN
    -- Migrate existing HD and IP prices
    FOR brand_record IN SELECT id, hd_price, ip_price FROM brands LOOP
      -- Insert HD price if column exists and has value
      IF brand_record.hd_price IS NOT NULL AND brand_record.hd_price > 0 THEN
        INSERT INTO brand_camera_type_pricing (brand_id, camera_type_id, price)
        VALUES (brand_record.id, hd_camera_type_id, brand_record.hd_price)
        ON CONFLICT (brand_id, camera_type_id) DO UPDATE SET price = EXCLUDED.price;
      END IF;
      
      -- Insert IP price if column exists and has value
      IF brand_record.ip_price IS NOT NULL AND brand_record.ip_price > 0 THEN
        INSERT INTO brand_camera_type_pricing (brand_id, camera_type_id, price)
        VALUES (brand_record.id, ip_camera_type_id, brand_record.ip_price)
        ON CONFLICT (brand_id, camera_type_id) DO UPDATE SET price = EXCLUDED.price;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Migrated existing HD and IP prices to brand_camera_type_pricing table';
  END IF;
END $$;

-- Verify the migration
SELECT 
  b.name as brand,
  ct.name as camera_type,
  bctp.price
FROM brand_camera_type_pricing bctp
JOIN brands b ON bctp.brand_id = b.id
JOIN camera_types ct ON bctp.camera_type_id = ct.id
ORDER BY b.name, ct.name;
