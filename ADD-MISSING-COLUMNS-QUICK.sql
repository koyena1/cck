-- Add the 3 missing columns to customers table
-- Run this in pgAdmin Query Tool

-- Add is_active column
ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Add email_verified column
ALTER TABLE customers ADD COLUMN email_verified BOOLEAN DEFAULT false;

-- Add updated_at column
ALTER TABLE customers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Verify all columns are now present
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
