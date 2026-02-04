-- Add brand image column to brands table
-- This allows admins to upload brand logos/images

-- Add image_url column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'brands' 
        AND column_name = 'image_url'
    ) THEN
        ALTER TABLE brands ADD COLUMN image_url TEXT;
    END IF;
END $$;

-- Update existing brands with placeholder or default images
UPDATE brands 
SET image_url = '/brands/' || LOWER(REPLACE(name, ' ', '')) || '.png'
WHERE image_url IS NULL;

-- Add comment to document the column
COMMENT ON COLUMN brands.image_url IS 'URL/path to brand logo image uploaded by admin';
