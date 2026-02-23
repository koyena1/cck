-- Invoice Editing System for Dealer Portal
-- This migration adds support for editable invoices without Razorpay payment

-- Add columns to dealer_transactions table for invoice editing tracking
ALTER TABLE dealer_transactions
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_finalized BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS previous_version_id INTEGER,
ADD COLUMN IF NOT EXISTS updated_by VARCHAR(50) DEFAULT 'dealer';

-- Update existing transactions to be finalized (if they have paid status)
UPDATE dealer_transactions 
SET is_draft = false, 
    is_finalized = true,
    finalized_at = created_at
WHERE payment_status = 'paid';

-- Update pending transactions to be drafts
UPDATE dealer_transactions 
SET is_draft = true, 
    is_finalized = false
WHERE payment_status = 'pending';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_draft ON dealer_transactions(dealer_id, is_draft);
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_finalized ON dealer_transactions(dealer_id, is_finalized);
CREATE INDEX IF NOT EXISTS idx_dealer_transactions_invoice_number ON dealer_transactions(invoice_number);

-- Add comments
COMMENT ON COLUMN dealer_transactions.is_draft IS 'True if invoice is still being edited';
COMMENT ON COLUMN dealer_transactions.is_finalized IS 'True if invoice has been finalized by dealer';
COMMENT ON COLUMN dealer_transactions.finalized_at IS 'Timestamp when invoice was finalized';
COMMENT ON COLUMN dealer_transactions.version IS 'Version number of the invoice';
COMMENT ON COLUMN dealer_transactions.previous_version_id IS 'Reference to previous version if this is an edited invoice';
COMMENT ON COLUMN dealer_transactions.updated_by IS 'Who last updated the invoice (dealer/admin)';
