-- ============================================
-- CUSTOMER AUTHENTICATION SYSTEM SETUP
-- Run this in pgAdmin Query Tool
-- ============================================

-- 1. Drop existing table if you want to recreate (CAUTION: This deletes all customer data!)
-- DROP TABLE IF EXISTS customers CASCADE;

-- 2. Create customers table
CREATE TABLE IF NOT EXISTS customers (
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

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

-- 4. Add comments for documentation
COMMENT ON TABLE customers IS 'Customer accounts for website authentication';
COMMENT ON COLUMN customers.full_name IS 'Customer full name';
COMMENT ON COLUMN customers.email IS 'Unique email address for login';
COMMENT ON COLUMN customers.phone_number IS 'Phone number (verified via OTP during registration)';
COMMENT ON COLUMN customers.password_hash IS 'Password (should be hashed in production)';

-- 5. Verify table was created successfully
SELECT 
    'Table created successfully!' as status,
    COUNT(*) as customer_count
FROM customers;

-- 6. Show table structure
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
