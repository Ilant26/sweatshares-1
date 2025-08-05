-- Drop and recreate the escrow status change function to fix ambiguous column reference
DROP FUNCTION IF EXISTS handle_escrow_status_change() CASCADE;

CREATE OR REPLACE FUNCTION handle_escrow_status_change()
RETURNS TRIGGER AS $$
DECLARE
  payer_name TEXT;
  payer_avatar TEXT;
  payee_name TEXT;
  payee_avatar TEXT;
  invoice_num TEXT;  -- Changed variable name to avoid ambiguity
  amount_formatted TEXT;
BEGIN
  -- Get payer and payee information
  SELECT COALESCE(full_name, username, 'Unknown User'), avatar_url 
  INTO payer_name, payer_avatar
  FROM profiles WHERE id = NEW.payer_id;
  
  SELECT COALESCE(full_name, username, 'Unknown User'), avatar_url 
  INTO payee_name, payee_avatar
  FROM profiles WHERE id = NEW.payee_id;
  
  -- Get invoice number (using different variable name and explicit table reference)
  SELECT i.invoice_number INTO invoice_num
  FROM invoices i WHERE i.id = NEW.invoice_id;
  
  -- Format amount
  amount_formatted := NEW.currency || ' ' || NEW.amount;
  
  -- Handle different status changes
  IF NEW.status = 'funded' AND (OLD.status IS NULL OR OLD.status != 'funded') THEN
    -- Notify payee that funds are in escrow
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payee_id,
      'escrow_funded',
      'Escrow Payment Received',
      payer_name || ' has funded an escrow payment for invoice ' || invoice_num,
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payer_id', NEW.payer_id,
        'payer_name', payer_name,
        'payer_avatar', payer_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type
      ),
      NOW()
    );
    
  ELSIF NEW.status = 'work_submitted' AND (OLD.status IS NULL OR OLD.status != 'work_submitted') THEN
    -- Notify payer that work has been submitted
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payer_id,
      'work_submitted',
      'Work Submitted for Review',
      payee_name || ' has submitted work for invoice ' || invoice_num || '. Please review and approve.',
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payee_id', NEW.payee_id,
        'payee_name', payee_name,
        'payee_avatar', payee_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type,
        'review_deadline', NEW.auto_release_date
      ),
      NOW()
    );
    
  ELSIF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Notify both parties that payment has been released
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payee_id,
      'payment_released',
      'Payment Released',
      'Payment for invoice ' || invoice_num || ' has been released from escrow',
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payer_id', NEW.payer_id,
        'payer_name', payer_name,
        'payer_avatar', payer_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type
      ),
      NOW()
    );
    
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payer_id,
      'payment_completed',
      'Payment Completed',
      'Payment for invoice ' || invoice_num || ' has been completed',
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payee_id', NEW.payee_id,
        'payee_name', payee_name,
        'payee_avatar', payee_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type
      ),
      NOW()
    );
    
  ELSIF NEW.status = 'disputed' AND (OLD.status IS NULL OR OLD.status != 'disputed') THEN
    -- Notify both parties about the dispute
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payee_id,
      'dispute_created',
      'Payment Disputed',
      'Payment for invoice ' || invoice_num || ' has been disputed',
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payer_id', NEW.payer_id,
        'payer_name', payer_name,
        'payer_avatar', payer_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type
      ),
      NOW()
    );
    
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payer_id,
      'dispute_created',
      'Payment Disputed',
      'Payment for invoice ' || invoice_num || ' has been disputed',
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payee_id', NEW.payee_id,
        'payee_name', payee_name,
        'payee_avatar', payee_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type
      ),
      NOW()
    );
    
  ELSIF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    -- Notify both parties about cancellation
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payee_id,
      'payment_cancelled',
      'Payment Cancelled',
      'Payment for invoice ' || invoice_num || ' has been cancelled',
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payer_id', NEW.payer_id,
        'payer_name', payer_name,
        'payer_avatar', payer_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type
      ),
      NOW()
    );
    
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      metadata,
      created_at
    ) VALUES (
      NEW.payer_id,
      'payment_cancelled',
      'Payment Cancelled',
      'Payment for invoice ' || invoice_num || ' has been cancelled',
      jsonb_build_object(
        'escrow_transaction_id', NEW.id,
        'invoice_id', NEW.invoice_id,
        'payee_id', NEW.payee_id,
        'payee_name', payee_name,
        'payee_avatar', payee_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', invoice_num,
        'transaction_type', NEW.transaction_type
      ),
      NOW()
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS escrow_status_change_trigger ON escrow_transactions;
CREATE TRIGGER escrow_status_change_trigger
  AFTER INSERT OR UPDATE OF status ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION handle_escrow_status_change();