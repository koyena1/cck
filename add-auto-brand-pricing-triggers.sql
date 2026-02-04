-- Trigger to automatically create brand pricing entries when a new camera type is added
-- This ensures every brand automatically gets a pricing entry for each camera type

CREATE OR REPLACE FUNCTION auto_create_brand_pricing_for_new_camera_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert pricing records for all active brands for the new camera type
  INSERT INTO brand_camera_type_pricing (brand_id, camera_type_id, price)
  SELECT id, NEW.id, 0
  FROM brands
  WHERE is_active = true
  ON CONFLICT (brand_id, camera_type_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_brand_pricing_on_camera_type_insert ON camera_types;

-- Create trigger
CREATE TRIGGER trigger_auto_brand_pricing_on_camera_type_insert
AFTER INSERT ON camera_types
FOR EACH ROW
EXECUTE FUNCTION auto_create_brand_pricing_for_new_camera_type();

-- Also create a trigger for when a new brand is added
CREATE OR REPLACE FUNCTION auto_create_brand_pricing_for_new_brand()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert pricing records for all active camera types for the new brand
  INSERT INTO brand_camera_type_pricing (brand_id, camera_type_id, price)
  SELECT NEW.id, id, 0
  FROM camera_types
  WHERE is_active = true
  ON CONFLICT (brand_id, camera_type_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS trigger_auto_brand_pricing_on_brand_insert ON brands;

-- Create trigger
CREATE TRIGGER trigger_auto_brand_pricing_on_brand_insert
AFTER INSERT ON brands
FOR EACH ROW
EXECUTE FUNCTION auto_create_brand_pricing_for_new_brand();

-- Backfill: Create pricing entries for existing brands and camera types
INSERT INTO brand_camera_type_pricing (brand_id, camera_type_id, price)
SELECT b.id, ct.id, 0
FROM brands b
CROSS JOIN camera_types ct
WHERE b.is_active = true AND ct.is_active = true
ON CONFLICT (brand_id, camera_type_id) DO NOTHING;

-- Verify triggers were created
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name IN ('trigger_auto_brand_pricing_on_camera_type_insert', 'trigger_auto_brand_pricing_on_brand_insert');
