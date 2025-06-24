-- Add VAT fields to invoices table
ALTER TABLE public.invoices 
ADD COLUMN vat_enabled boolean DEFAULT false,
ADD COLUMN vat_rate numeric(5,2) DEFAULT 20.00,
ADD COLUMN vat_amount numeric(10,2) DEFAULT 0.00,
ADD COLUMN subtotal numeric(10,2) DEFAULT 0.00,
ADD COLUMN total numeric(10,2) DEFAULT 0.00;

-- Update existing invoices to have subtotal and total equal to amount
UPDATE public.invoices 
SET subtotal = amount, total = amount 
WHERE subtotal = 0 AND total = 0;

-- Add check constraint to ensure total = subtotal + vat_amount when VAT is enabled
ALTER TABLE public.invoices 
ADD CONSTRAINT check_vat_calculation 
CHECK (
  (vat_enabled = false AND total = subtotal) OR 
  (vat_enabled = true AND total = subtotal + vat_amount)
);

-- Add check constraint for VAT rate
ALTER TABLE public.invoices 
ADD CONSTRAINT check_vat_rate 
CHECK (vat_rate >= 0 AND vat_rate <= 100); 