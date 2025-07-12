-- Create comprehensive escrow notification system
-- This migration adds notifications for all escrow workflow steps

-- Function to create escrow notifications with proper data structure
CREATE OR REPLACE FUNCTION create_escrow_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_data JSONB DEFAULT '{}',
  p_invoice_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, description, data, invoice_id
  ) VALUES (
    p_user_id, p_type, p_title, p_description, p_data, p_invoice_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for escrow transaction status changes
CREATE OR REPLACE FUNCTION notify_escrow_status_changes() RETURNS TRIGGER AS $$
DECLARE
  payer_name TEXT;
  payer_avatar TEXT;
  payee_name TEXT;
  payee_avatar TEXT;
  invoice_number TEXT;
  amount_formatted TEXT;
BEGIN
  -- Get payer and payee information
  SELECT COALESCE(full_name, username, 'Unknown User'), avatar_url INTO payer_name, payer_avatar
  FROM profiles WHERE id = NEW.payer_id;
  
  SELECT COALESCE(full_name, username, 'Unknown User'), avatar_url INTO payee_name, payee_avatar
  FROM profiles WHERE id = NEW.payee_id;
  
  -- Get invoice number
  SELECT invoice_number INTO invoice_number
  FROM invoices WHERE id = NEW.invoice_id;
  
  -- Format amount
  amount_formatted := NEW.currency || ' ' || NEW.amount;
  
  -- Handle different status changes
  IF TG_OP = 'INSERT' THEN
    -- New escrow transaction created
    PERFORM create_escrow_notification(
      NEW.payee_id,
      'escrow_payment',
      'New Escrow Payment Created',
      payer_name || ' created an escrow payment for ' || amount_formatted,
      jsonb_build_object(
        'payer_id', NEW.payer_id::text,
        'payer_name', payer_name,
        'payer_avatar_url', payer_avatar,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'escrow_status', NEW.status,
        'invoice_number', invoice_number,
        'transaction_id', NEW.id::text
      ),
      NEW.invoice_id
    );
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Status changes
    IF NEW.status = 'funded' AND (OLD.status IS NULL OR OLD.status != 'funded') THEN
      -- Payment funded - notify payee
      PERFORM create_escrow_notification(
        NEW.payee_id,
        'escrow_payment',
        'Payment Funded in Escrow',
        'Payment of ' || amount_formatted || ' is now held in escrow. You can start working!',
        jsonb_build_object(
          'payer_id', NEW.payer_id::text,
          'payer_name', payer_name,
          'payer_avatar_url', payer_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text,
          'deadline_date', NEW.completion_deadline_date
        ),
        NEW.invoice_id
      );
      
    ELSIF NEW.status = 'work_completed' AND (OLD.status IS NULL OR OLD.status != 'work_completed') THEN
      -- Work submitted - notify payer
      PERFORM create_escrow_notification(
        NEW.payer_id,
        'escrow_payment',
        'Work Completed & Submitted',
        payee_name || ' has submitted work for review. Please review within ' || NEW.review_period_days || ' days.',
        jsonb_build_object(
          'payee_id', NEW.payee_id::text,
          'payee_name', payee_name,
          'payee_avatar_url', payee_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text,
          'review_deadline', NEW.auto_release_date,
          'completion_proof', NEW.completion_proof
        ),
        NEW.invoice_id
      );
      
    ELSIF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
      -- Work approved - notify payee
      PERFORM create_escrow_notification(
        NEW.payee_id,
        'escrow_payment',
        'Work Approved & Payment Released',
        'Your work has been approved! Payment of ' || amount_formatted || ' has been released to your account.',
        jsonb_build_object(
          'payer_id', NEW.payer_id::text,
          'payer_name', payer_name,
          'payer_avatar_url', payer_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text,
          'released_at', NEW.funds_released_at
        ),
        NEW.invoice_id
      );
      
    ELSIF NEW.status = 'revision_requested' AND (OLD.status IS NULL OR OLD.status != 'revision_requested') THEN
      -- Revision requested - notify payee
      PERFORM create_escrow_notification(
        NEW.payee_id,
        'escrow_payment',
        'Revision Requested',
        payer_name || ' has requested changes to your work. Please review the feedback and resubmit.',
        jsonb_build_object(
          'payer_id', NEW.payer_id::text,
          'payer_name', payer_name,
          'payer_avatar_url', payer_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text,
          'revision_reason', NEW.dispute_reason
        ),
        NEW.invoice_id
      );
      
    ELSIF NEW.status = 'disputed' AND (OLD.status IS NULL OR OLD.status != 'disputed') THEN
      -- Dispute opened - notify both parties
      PERFORM create_escrow_notification(
        NEW.payer_id,
        'escrow_payment',
        'Dispute Opened',
        'A dispute has been opened for this transaction. Our team will review the case.',
        jsonb_build_object(
          'payee_id', NEW.payee_id::text,
          'payee_name', payee_name,
          'payee_avatar_url', payee_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text,
          'dispute_reason', NEW.dispute_reason
        ),
        NEW.invoice_id
      );
      
      PERFORM create_escrow_notification(
        NEW.payee_id,
        'escrow_payment',
        'Dispute Opened',
        'A dispute has been opened for this transaction. Our team will review the case.',
        jsonb_build_object(
          'payer_id', NEW.payer_id::text,
          'payer_name', payer_name,
          'payer_avatar_url', payer_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text,
          'dispute_reason', NEW.dispute_reason
        ),
        NEW.invoice_id
      );
      
    ELSIF NEW.status = 'released' AND (OLD.status IS NULL OR OLD.status != 'released') THEN
      -- Auto-release - notify payee
      PERFORM create_escrow_notification(
        NEW.payee_id,
        'escrow_payment',
        'Payment Auto-Released',
        'Payment of ' || amount_formatted || ' has been automatically released after the review period.',
        jsonb_build_object(
          'payer_id', NEW.payer_id::text,
          'payer_name', payer_name,
          'payer_avatar_url', payer_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text,
          'released_at', NEW.funds_released_at
        ),
        NEW.invoice_id
      );
      
    ELSIF NEW.status = 'refunded' AND (OLD.status IS NULL OR OLD.status != 'refunded') THEN
      -- Refunded - notify payer
      PERFORM create_escrow_notification(
        NEW.payer_id,
        'escrow_payment',
        'Payment Refunded',
        'Payment of ' || amount_formatted || ' has been refunded to your account.',
        jsonb_build_object(
          'payee_id', NEW.payee_id::text,
          'payee_name', payee_name,
          'payee_avatar_url', payee_avatar,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'escrow_status', NEW.status,
          'invoice_number', invoice_number,
          'transaction_id', NEW.id::text
        ),
        NEW.invoice_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for escrow transaction notifications
DROP TRIGGER IF EXISTS trigger_notify_escrow_status_changes ON escrow_transactions;
CREATE TRIGGER trigger_notify_escrow_status_changes
  AFTER INSERT OR UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_escrow_status_changes();

-- Function to notify about approaching deadlines
CREATE OR REPLACE FUNCTION notify_approaching_deadlines() RETURNS void AS $$
DECLARE
  transaction_record RECORD;
  payer_name TEXT;
  payee_name TEXT;
  days_remaining INTEGER;
BEGIN
  -- Check for work completion deadlines (3 days before)
  FOR transaction_record IN 
    SELECT 
      et.*,
      p1.full_name as payer_name,
      p2.full_name as payee_name,
      EXTRACT(DAY FROM (et.completion_deadline_date - NOW())) as days_remaining
    FROM escrow_transactions et
    JOIN profiles p1 ON et.payer_id = p1.id
    JOIN profiles p2 ON et.payee_id = p2.id
    WHERE et.status = 'funded'
      AND et.completion_deadline_date IS NOT NULL
      AND et.completion_deadline_date > NOW()
      AND et.completion_deadline_date <= NOW() + INTERVAL '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.invoice_id = et.invoice_id 
        AND n.type = 'escrow_payment'
        AND n.data->>'notification_type' = 'deadline_warning'
        AND n.created_at > NOW() - INTERVAL '1 day'
      )
  LOOP
    -- Notify payee about approaching deadline
    PERFORM create_escrow_notification(
      transaction_record.payee_id,
      'escrow_payment',
      'Work Deadline Approaching',
      'Your work deadline is approaching in ' || transaction_record.days_remaining || ' days. Please submit your work soon.',
      jsonb_build_object(
        'payer_id', transaction_record.payer_id::text,
        'payer_name', transaction_record.payer_name,
        'amount', transaction_record.amount,
        'currency', transaction_record.currency,
        'escrow_status', transaction_record.status,
        'transaction_id', transaction_record.id::text,
        'deadline_date', transaction_record.completion_deadline_date,
        'days_remaining', transaction_record.days_remaining,
        'notification_type', 'deadline_warning'
      ),
      transaction_record.invoice_id
    );
  END LOOP;
  
  -- Check for review deadlines (1 day before auto-release)
  FOR transaction_record IN 
    SELECT 
      et.*,
      p1.full_name as payer_name,
      p2.full_name as payee_name,
      EXTRACT(DAY FROM (et.auto_release_date - NOW())) as days_remaining
    FROM escrow_transactions et
    JOIN profiles p1 ON et.payer_id = p1.id
    JOIN profiles p2 ON et.payee_id = p2.id
    WHERE et.status = 'work_completed'
      AND et.auto_release_date IS NOT NULL
      AND et.auto_release_date > NOW()
      AND et.auto_release_date <= NOW() + INTERVAL '1 day'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n 
        WHERE n.invoice_id = et.invoice_id 
        AND n.type = 'escrow_payment'
        AND n.data->>'notification_type' = 'review_deadline_warning'
        AND n.created_at > NOW() - INTERVAL '1 day'
      )
  LOOP
    -- Notify payer about approaching auto-release
    PERFORM create_escrow_notification(
      transaction_record.payer_id,
      'escrow_payment',
      'Auto-Release Approaching',
      'Work will be automatically approved and payment released in ' || transaction_record.days_remaining || ' day(s). Review now to avoid auto-release.',
      jsonb_build_object(
        'payee_id', transaction_record.payee_id::text,
        'payee_name', transaction_record.payee_name,
        'amount', transaction_record.amount,
        'currency', transaction_record.currency,
        'escrow_status', transaction_record.status,
        'transaction_id', transaction_record.id::text,
        'auto_release_date', transaction_record.auto_release_date,
        'days_remaining', transaction_record.days_remaining,
        'notification_type', 'review_deadline_warning'
      ),
      transaction_record.invoice_id
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a scheduled job to check for approaching deadlines (if using pg_cron)
-- This would need to be set up in Supabase Dashboard > Database > Extensions > pg_cron
-- SELECT cron.schedule('check-escrow-deadlines', '0 9 * * *', 'SELECT notify_approaching_deadlines();');

-- Add comment for documentation
COMMENT ON FUNCTION notify_escrow_status_changes() IS 'Creates notifications for all escrow transaction status changes';
COMMENT ON FUNCTION notify_approaching_deadlines() IS 'Creates notifications for approaching work and review deadlines'; 