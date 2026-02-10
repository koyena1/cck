-- ============================================
-- RECREATE customers table with correct schema
-- ⚠️ WARNING: This will DELETE all existing customer data!
-- Only use this if adding columns doesn't work
-- ============================================

-- Step 1: Backup existing data (if any)
-- Uncomment the line below to create a backup
-- CREATE TABLE customers_backup AS SELECT * FROM customers;

-- Step 2: Drop the existing table
DROP TABLE IF EXISTS customers CASCADE;

-- Step 3: Create the table with correct schema
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    address TEXT,
    pincode VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 4: Create indexes for performance
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone_number);

-- Step 5: Add comments for documentation
COMMENT ON TABLE customers IS 'Customer accounts for website authentication';
COMMENT ON COLUMN customers.customer_id IS 'Primary key - auto-incrementing customer ID';
COMMENT ON COLUMN customers.full_name IS 'Customer full name';
COMMENT ON COLUMN customers.email IS 'Unique email address for login';
COMMENT ON COLUMN customers.phone_number IS 'Phone number (verified via OTP)';
COMMENT ON COLUMN customers.password_hash IS 'Hashed password';
COMMENT ON COLUMN customers.address IS 'Customer address (optional)';
COMMENT ON COLUMN customers.pincode IS 'Postal code (optional)';
COMMENT ON COLUMN customers.is_active IS 'Account active status';
COMMENT ON COLUMN customers.email_verified IS 'Email verification status';

-- Step 6: Verify table structure
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_name = 'customers'
ORDER BY 
    ordinal_position;

-- Step 7: Verify indexes
SELECT 
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    tablename = 'customers';

-- ============================================
-- SUCCESS! Table recreated with correct schema
-- You can now test customer registration
-- ============================================
