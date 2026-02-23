-- Add Razorpay payment fields to dealer_transactions table

-- Add new columns for Razorpay integration
ALTER TABLE dealer_transactions
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS razorpay_signature VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_razorpay_order ON dealer_transactions(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_payment_status ON dealer_transactions(payment_status);

-- Update existing records to have 'completed' status (backward compatibility)
UPDATE dealer_transactions
SET payment_status = 'completed'
WHERE payment_status IS NULL OR payment_status = '';

-- Add comments
COMMENT ON COLUMN dealer_transactions.razorpay_order_id IS 'Razorpay order ID for payment tracking';
COMMENT ON COLUMN dealer_transactions.razorpay_payment_id IS 'Razorpay payment ID after successful payment';
COMMENT ON COLUMN dealer_transactions.razorpay_signature IS 'Razorpay signature for payment verification';

-- Show table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'dealer_transactions'
ORDER BY ordinal_position;
