-- Fix payment_method column in invoices table
-- This migration ensures all invoices have a payment_method set

-- First, let's make sure the column exists and has the right constraints
DO $$ 
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'payment_method'
    ) THEN
        ALTER TABLE invoices 
        ADD COLUMN payment_method TEXT DEFAULT 'standard' CHECK (payment_method IN ('standard', 'payment_link', 'escrow'));
        
        -- Add comment to document the column
        COMMENT ON COLUMN invoices.payment_method IS 'Payment method for the invoice: standard, payment_link, or escrow';
    END IF;
END $$;

-- Update any existing invoices that have NULL payment_method to 'standard'
UPDATE invoices 
SET payment_method = 'standard' 
WHERE payment_method IS NULL;

-- Update invoices that have escrow_transaction_id but no payment_method set to 'escrow'
UPDATE invoices 
SET payment_method = 'escrow' 
WHERE escrow_transaction_id IS NOT NULL AND payment_method = 'standard';

-- Ensure the column cannot be NULL going forward
ALTER TABLE invoices 
ALTER COLUMN payment_method SET NOT NULL;

-- Add an index for better query performance
CREATE INDEX IF NOT EXISTS idx_invoices_payment_method ON invoices(payment_method);

-- Verify the data
SELECT 
    payment_method,
    COUNT(*) as count
FROM invoices 
GROUP BY payment_method
ORDER BY payment_method; 