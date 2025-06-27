-- Add payment_method column to invoices table
ALTER TABLE invoices 
ADD COLUMN payment_method TEXT DEFAULT 'standard' CHECK (payment_method IN ('standard', 'payment_link', 'escrow'));

-- Add comment to document the column
COMMENT ON COLUMN invoices.payment_method IS 'Payment method for the invoice: standard, payment_link, or escrow'; 