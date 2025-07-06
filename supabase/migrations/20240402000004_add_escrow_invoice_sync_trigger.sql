-- Add trigger to automatically sync invoice status with escrow transaction status
-- This ensures invoices are automatically marked as paid when escrow transactions are funded

-- Create a function to handle the escrow transaction status changes
CREATE OR REPLACE FUNCTION sync_invoice_status_with_escrow()
RETURNS TRIGGER AS $$
BEGIN
  -- If escrow transaction status changed to 'funded', update invoice to 'paid'
  IF NEW.status = 'funded' AND (OLD.status IS NULL OR OLD.status != 'funded') THEN
    UPDATE invoices 
    SET 
      status = 'paid',
      updated_at = NOW()
    WHERE id = NEW.invoice_id;
    
    RAISE NOTICE 'Invoice % automatically updated to paid status due to escrow transaction % being funded', NEW.invoice_id, NEW.id;
  END IF;
  
  -- If escrow transaction status changed from 'funded' to something else, update invoice to 'pending'
  IF OLD.status = 'funded' AND NEW.status != 'funded' THEN
    UPDATE invoices 
    SET 
      status = 'pending',
      updated_at = NOW()
    WHERE id = NEW.invoice_id;
    
    RAISE NOTICE 'Invoice % automatically updated to pending status due to escrow transaction % status change', NEW.invoice_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on escrow_transactions table
DROP TRIGGER IF EXISTS escrow_transaction_status_sync ON escrow_transactions;
CREATE TRIGGER escrow_transaction_status_sync
  AFTER UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_status_with_escrow();

-- Also create a trigger for INSERT to handle new escrow transactions
CREATE OR REPLACE FUNCTION sync_invoice_status_on_escrow_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- If new escrow transaction is created with 'funded' status, update invoice
  IF NEW.status = 'funded' THEN
    UPDATE invoices 
    SET 
      status = 'paid',
      updated_at = NOW()
    WHERE id = NEW.invoice_id;
    
    RAISE NOTICE 'Invoice % automatically updated to paid status due to new funded escrow transaction %', NEW.invoice_id, NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS escrow_transaction_insert_sync ON escrow_transactions;
CREATE TRIGGER escrow_transaction_insert_sync
  AFTER INSERT ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_status_on_escrow_insert();

-- Update any existing invoices that should be marked as paid
-- This fixes any existing inconsistencies
UPDATE invoices 
SET 
    status = 'paid',
    updated_at = NOW()
WHERE id IN (
    SELECT i.id
    FROM invoices i
    JOIN escrow_transactions et ON i.escrow_transaction_id = et.id
    WHERE i.payment_method = 'escrow' 
      AND i.status = 'pending'
      AND et.status = 'funded'
);

-- Add a comment to document the trigger
COMMENT ON FUNCTION sync_invoice_status_with_escrow() IS 'Automatically syncs invoice status with escrow transaction status. When escrow transaction becomes funded, invoice is marked as paid.';
COMMENT ON FUNCTION sync_invoice_status_on_escrow_insert() IS 'Automatically syncs invoice status when new escrow transaction is inserted with funded status.'; 