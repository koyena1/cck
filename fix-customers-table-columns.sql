-- Add missing columns to customers table
-- Run this in pgAdmin Query Tool

-- Add address column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'address'
    ) THEN
        ALTER TABLE customers ADD COLUMN address TEXT;
        RAISE NOTICE 'Column "address" added successfully';
    ELSE
        RAISE NOTICE 'Column "address" already exists';
    END IF;
END $$;

-- Add pincode column (if not exists)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'pincode'
    ) THEN
        ALTER TABLE customers ADD COLUMN pincode VARCHAR(10);
        RAISE NOTICE 'Column "pincode" added successfully';
    ELSE
        RAISE NOTICE 'Column "pincode" already exists';
    END IF;
END $$;

-- Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'customers'
ORDER BY 
    ordinal_position;
