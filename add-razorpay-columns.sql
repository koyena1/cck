-- Add Razorpay payment tracking columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_payment_id ON orders(payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);

-- Update comments
COMMENT ON COLUMN orders.payment_id IS 'Razorpay payment ID after successful payment';
COMMENT ON COLUMN orders.razorpay_order_id IS 'Razorpay order ID created for payment';
