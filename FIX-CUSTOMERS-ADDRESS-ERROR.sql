-- ============================================
-- FIX: Add ALL missing columns to customers table
-- Run this in pgAdmin Query Tool to fix column errors
-- ============================================

-- Step 1: Check current table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'customers'
ORDER BY 
    ordinal_position;

-- Step 2: Add address column (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'address'
    ) THEN
        ALTER TABLE customers ADD COLUMN address TEXT;
        RAISE NOTICE '✅ Column "address" added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Column "address" already exists';
    END IF;
END $$;

-- Step 3: Add pincode column (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'pincode'
    ) THEN
        ALTER TABLE customers ADD COLUMN pincode VARCHAR(10);
        RAISE NOTICE '✅ Column "pincode" added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Column "pincode" already exists';
    END IF;
END $$;

-- Step 4: Add is_active column (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE customers ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE '✅ Column "is_active" added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Column "is_active" already exists';
    END IF;
END $$;

-- Step 5: Add email_verified column (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE customers ADD COLUMN email_verified BOOLEAN DEFAULT false;
        RAISE NOTICE '✅ Column "email_verified" added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Column "email_verified" already exists';
    END IF;
END $$;

-- Step 6: Add created_at column (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE customers ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Column "created_at" added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Column "created_at" already exists';
    END IF;
END $$;

-- Step 7: Add updated_at column (if missing)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE customers ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ Column "updated_at" added successfully';
    ELSE
        RAISE NOTICE 'ℹ️ Column "updated_at" already exists';
    END IF;
END $$;

-- Step 4: Verify the fix
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

-- ============================================
-- EXPECTED RESULT:
-- You should see columns including:
-- - customer_id
-- - full_name
-- - email
-- - phone_number
-- - password_hash
-- - address          (NEW)
-- - pincode          (NEW)
-- - is_active
-- - email_verified
-- - created_at
-- - updated_at
-- ============================================
