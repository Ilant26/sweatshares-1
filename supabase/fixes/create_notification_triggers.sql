-- Create notification triggers for all events
-- Run this in Supabase Dashboard > SQL Editor

-- STEP 1: Create a helper function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id uuid,
  p_type text,
  p_title text,
  p_description text,
  p_data jsonb DEFAULT '{}'::jsonb,
  p_message_id uuid DEFAULT NULL,
  p_connection_id uuid DEFAULT NULL,
  p_invoice_id uuid DEFAULT NULL,
  p_signature_id uuid DEFAULT NULL,
  p_alert_id uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (
    user_id, type, title, description, data, 
    message_id, connection_id, invoice_id, signature_id, alert_id
  ) VALUES (
    p_user_id, p_type, p_title, p_description, p_data,
    p_message_id, p_connection_id, p_invoice_id, p_signature_id, p_alert_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Create trigger function for new messages
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
BEGIN
  -- Get sender's name from profiles
  SELECT COALESCE(full_name, email) INTO sender_name
  FROM auth.users
  WHERE id = NEW.sender_id;
  
  -- Create notification for the receiver
  PERFORM create_notification(
    NEW.receiver_id,
    'message',
    'New Message',
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    jsonb_build_object(
      'sender_id', NEW.sender_id::text,
      'sender_name', COALESCE(sender_name, 'Unknown'),
      'message_preview', LEFT(NEW.content, 100)
    ),
    NEW.id -- message_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 3: Create message notification trigger
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- STEP 4: Create trigger function for invoice requests
CREATE OR REPLACE FUNCTION notify_invoice_request()
RETURNS TRIGGER AS $$
DECLARE
  client_name text;
  freelancer_name text;
BEGIN
  -- Only notify on new invoices
  IF TG_OP = 'INSERT' THEN
    -- Get client and freelancer names
    SELECT COALESCE(full_name, email) INTO client_name
    FROM auth.users WHERE id = NEW.client_id;
    
    SELECT COALESCE(full_name, email) INTO freelancer_name
    FROM auth.users WHERE id = NEW.freelancer_id;
    
    -- Notify the client about new invoice request
    PERFORM create_notification(
      NEW.client_id,
      'invoice_request',
      'New Invoice Request',
      COALESCE(freelancer_name, 'A freelancer') || ' sent you an invoice for $' || NEW.total_amount,
      jsonb_build_object(
        'freelancer_id', NEW.freelancer_id::text,
        'freelancer_name', COALESCE(freelancer_name, 'Unknown'),
        'amount', NEW.total_amount,
        'currency', COALESCE(NEW.currency, 'USD')
      ),
      NULL, NULL, NEW.id -- invoice_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create invoice notification trigger (if invoices table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_notify_invoice_request ON public.invoices;
    CREATE TRIGGER trigger_notify_invoice_request
      AFTER INSERT ON public.invoices
      FOR EACH ROW
      EXECUTE FUNCTION notify_invoice_request();
    RAISE NOTICE 'Invoice notification trigger created';
  ELSE
    RAISE NOTICE 'Invoices table not found, skipping invoice trigger';
  END IF;
END $$;

-- STEP 6: Create trigger function for escrow payments
CREATE OR REPLACE FUNCTION notify_escrow_payment()
RETURNS TRIGGER AS $$
DECLARE
  payer_name text;
  payee_name text;
BEGIN
  -- Only notify on new escrow transactions
  IF TG_OP = 'INSERT' THEN
    -- Get payer and payee names
    SELECT COALESCE(full_name, email) INTO payer_name
    FROM auth.users WHERE id = NEW.payer_id;
    
    SELECT COALESCE(full_name, email) INTO payee_name
    FROM auth.users WHERE id = NEW.payee_id;
    
    -- Notify the payee about new escrow payment
    PERFORM create_notification(
      NEW.payee_id,
      'escrow_payment',
      'New Escrow Payment',
      COALESCE(payer_name, 'Someone') || ' created an escrow payment for $' || NEW.amount,
      jsonb_build_object(
        'payer_id', NEW.payer_id::text,
        'payer_name', COALESCE(payer_name, 'Unknown'),
        'amount', NEW.amount,
        'currency', COALESCE(NEW.currency, 'USD'),
        'escrow_status', NEW.status
      ),
      NULL, NULL, NEW.invoice_id -- invoice_id for escrow
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 7: Create escrow notification trigger (if escrow_transactions table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'escrow_transactions' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_notify_escrow_payment ON public.escrow_transactions;
    CREATE TRIGGER trigger_notify_escrow_payment
      AFTER INSERT ON public.escrow_transactions
      FOR EACH ROW
      EXECUTE FUNCTION notify_escrow_payment();
    RAISE NOTICE 'Escrow payment notification trigger created';
  ELSE
    RAISE NOTICE 'Escrow transactions table not found, skipping escrow trigger';
  END IF;
END $$;

-- STEP 8: Create trigger function for signature requests
CREATE OR REPLACE FUNCTION notify_signature_request()
RETURNS TRIGGER AS $$
DECLARE
  requester_name text;
  signer_name text;
BEGIN
  -- Only notify on new signature requests
  IF TG_OP = 'INSERT' THEN
    -- Get requester name
    SELECT COALESCE(full_name, email) INTO requester_name
    FROM auth.users WHERE id = NEW.requester_id;
    
    -- Notify each signer
    INSERT INTO public.notifications (user_id, type, title, description, data, signature_id)
    SELECT 
      sp.signer_id,
      'signature_request',
      'New Signature Request',
      COALESCE(requester_name, 'Someone') || ' requested your signature on "' || NEW.document_name || '"',
      jsonb_build_object(
        'requester_id', NEW.requester_id::text,
        'requester_name', COALESCE(requester_name, 'Unknown'),
        'document_name', NEW.document_name
      ),
      NEW.id
    FROM signature_positions sp
    WHERE sp.signature_id = NEW.id
    AND sp.signer_id IS NOT NULL
    AND sp.signer_id != NEW.requester_id; -- Don't notify the requester
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 9: Create signature notification trigger (if signatures table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signatures' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_notify_signature_request ON public.signatures;
    CREATE TRIGGER trigger_notify_signature_request
      AFTER INSERT ON public.signatures
      FOR EACH ROW
      EXECUTE FUNCTION notify_signature_request();
    RAISE NOTICE 'Signature request notification trigger created';
  ELSE
    RAISE NOTICE 'Signatures table not found, skipping signature trigger';
  END IF;
END $$;

-- STEP 10: Create trigger function for vault shares
CREATE OR REPLACE FUNCTION notify_vault_share()
RETURNS TRIGGER AS $$
DECLARE
  sharer_name text;
  recipient_name text;
  document_name text;
BEGIN
  -- Only notify on new shares
  IF TG_OP = 'INSERT' THEN
    -- Get sharer name
    SELECT COALESCE(full_name, email) INTO sharer_name
    FROM auth.users WHERE id = NEW.shared_by;
    
    -- Get document name from vault_documents table
    SELECT name INTO document_name
    FROM vault_documents WHERE id = NEW.document_id;
    
    -- Notify the recipient
    PERFORM create_notification(
      NEW.shared_with,
      'vault_share',
      'Document Shared',
      COALESCE(sharer_name, 'Someone') || ' shared "' || COALESCE(document_name, 'a document') || '" with you',
      jsonb_build_object(
        'sharer_id', NEW.shared_by::text,
        'sharer_name', COALESCE(sharer_name, 'Unknown'),
        'document_name', COALESCE(document_name, 'Unknown Document'),
        'document_id', NEW.document_id::text
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 11: Create vault share notification trigger (if vault_shares table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vault_shares' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_notify_vault_share ON public.vault_shares;
    CREATE TRIGGER trigger_notify_vault_share
      AFTER INSERT ON public.vault_shares
      FOR EACH ROW
      EXECUTE FUNCTION notify_vault_share();
    RAISE NOTICE 'Vault share notification trigger created';
  ELSE
    RAISE NOTICE 'Vault shares table not found, skipping vault share trigger';
  END IF;
END $$;

-- STEP 12: Show what triggers were created
SELECT 'Notification triggers created successfully!' as status;

-- List all triggers on notification-related tables
SELECT 
  schemaname,
  tablename,
  triggername,
  'Trigger created for ' || tablename as description
FROM pg_triggers 
WHERE triggername LIKE '%notify_%'
ORDER BY tablename, triggername; 