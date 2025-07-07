-- Complete notifications fix based on actual schema
-- Run this in Supabase Dashboard > SQL Editor

-- STEP 1: Create working notification triggers for all events
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
    message_id, connection_id, invoice_id, signature_id, alert_id,
    content
  ) VALUES (
    p_user_id, p_type, p_title, p_description, p_data,
    p_message_id, p_connection_id, p_invoice_id, p_signature_id, p_alert_id,
    p_description -- content is required, use description
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 2: Create message notification trigger
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
BEGIN
  -- Get sender's name from profiles (use actual columns)
  SELECT COALESCE(full_name, username) INTO sender_name
  FROM public.profiles
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

DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- STEP 3: Create connection notification trigger
CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
  receiver_name text;
BEGIN
  -- Get names
  SELECT COALESCE(full_name, username) INTO sender_name
  FROM public.profiles WHERE id = NEW.sender_id;
  
  SELECT COALESCE(full_name, username) INTO receiver_name
  FROM public.profiles WHERE id = NEW.receiver_id;
  
  IF TG_OP = 'INSERT' AND NEW.status = 'pending' THEN
    -- Notify receiver about new connection request
    PERFORM create_notification(
      NEW.receiver_id,
      'connection_request',
      'New Connection Request',
      COALESCE(sender_name, 'Someone') || ' wants to connect with you',
      jsonb_build_object(
        'sender_id', NEW.sender_id::text,
        'sender_name', COALESCE(sender_name, 'Unknown')
      ),
      NULL, NEW.id -- connection_id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    -- Notify sender that connection was accepted
    PERFORM create_notification(
      NEW.sender_id,
      'connection_accepted',
      'Connection Accepted',
      COALESCE(receiver_name, 'Someone') || ' accepted your connection request',
      jsonb_build_object(
        'receiver_id', NEW.receiver_id::text,
        'receiver_name', COALESCE(receiver_name, 'Unknown')
      ),
      NULL, NEW.id -- connection_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_connection_request ON public.connections;
CREATE TRIGGER trigger_notify_connection_request
  AFTER INSERT OR UPDATE ON public.connections
  FOR EACH ROW
  EXECUTE FUNCTION notify_connection_request();

-- STEP 4: Create invoice notification trigger
CREATE OR REPLACE FUNCTION notify_invoice_request()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
  receiver_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get names
    SELECT COALESCE(full_name, username) INTO sender_name
    FROM public.profiles WHERE id = NEW.sender_id;
    
    SELECT COALESCE(full_name, username) INTO receiver_name
    FROM public.profiles WHERE id = NEW.receiver_id;
    
    -- Only notify if there's a receiver (not external client)
    IF NEW.receiver_id IS NOT NULL THEN
      PERFORM create_notification(
        NEW.receiver_id,
        'invoice_request',
        'New Invoice Request',
        COALESCE(sender_name, 'Someone') || ' sent you an invoice for ' || NEW.currency || ' ' || NEW.total,
        jsonb_build_object(
          'sender_id', NEW.sender_id::text,
          'sender_name', COALESCE(sender_name, 'Unknown'),
          'amount', NEW.total,
          'currency', NEW.currency
        ),
        NULL, NULL, NEW.id -- invoice_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_invoice_request ON public.invoices;
CREATE TRIGGER trigger_notify_invoice_request
  AFTER INSERT ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION notify_invoice_request();

-- STEP 5: Create escrow notification trigger
CREATE OR REPLACE FUNCTION notify_escrow_payment()
RETURNS TRIGGER AS $$
DECLARE
  payer_name text;
  payee_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get names
    SELECT COALESCE(full_name, username) INTO payer_name
    FROM public.profiles WHERE id = NEW.payer_id;
    
    SELECT COALESCE(full_name, username) INTO payee_name
    FROM public.profiles WHERE id = NEW.payee_id;
    
    -- Notify payee about new escrow payment
    PERFORM create_notification(
      NEW.payee_id,
      'escrow_payment',
      'New Escrow Payment',
      COALESCE(payer_name, 'Someone') || ' created an escrow payment for ' || NEW.currency || ' ' || NEW.amount,
      jsonb_build_object(
        'payer_id', NEW.payer_id::text,
        'payer_name', COALESCE(payer_name, 'Unknown'),
        'amount', NEW.amount,
        'currency', NEW.currency,
        'escrow_status', NEW.status
      ),
      NULL, NULL, NEW.invoice_id -- invoice_id for escrow
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_escrow_payment ON public.escrow_transactions;
CREATE TRIGGER trigger_notify_escrow_payment
  AFTER INSERT ON public.escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_escrow_payment();

-- STEP 6: Create signature request notification trigger
CREATE OR REPLACE FUNCTION notify_signature_request()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
  document_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get sender name
    SELECT COALESCE(full_name, username) INTO sender_name
    FROM public.profiles WHERE id = NEW.sender_id;
    
    -- Get document name
    SELECT filename INTO document_name
    FROM public.vault_documents WHERE id = NEW.document_id;
    
    -- Notify receiver about signature request
    PERFORM create_notification(
      NEW.receiver_id,
      'signature_request',
      'New Signature Request',
      COALESCE(sender_name, 'Someone') || ' requested your signature on "' || COALESCE(document_name, 'a document') || '"',
      jsonb_build_object(
        'sender_id', NEW.sender_id::text,
        'sender_name', COALESCE(sender_name, 'Unknown'),
        'document_name', COALESCE(document_name, 'Unknown Document')
      ),
      NULL, NULL, NULL, NEW.id -- signature_id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_signature_request ON public.signature_requests;
CREATE TRIGGER trigger_notify_signature_request
  AFTER INSERT ON public.signature_requests
  FOR EACH ROW
  EXECUTE FUNCTION notify_signature_request();

-- STEP 7: Create vault share notification trigger
CREATE OR REPLACE FUNCTION notify_vault_share()
RETURNS TRIGGER AS $$
DECLARE
  sharer_name text;
  document_name text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Get sharer name from profiles
    SELECT COALESCE(full_name, username) INTO sharer_name
    FROM public.profiles WHERE id = NEW.shared_by_id;
    
    -- Get document name
    SELECT filename INTO document_name
    FROM public.vault_documents WHERE id = NEW.document_id;
    
    -- Notify recipient
    PERFORM create_notification(
      NEW.shared_with_id,
      'vault_share',
      'Document Shared',
      COALESCE(sharer_name, 'Someone') || ' shared "' || COALESCE(document_name, 'a document') || '" with you',
      jsonb_build_object(
        'sharer_id', NEW.shared_by_id::text,
        'sharer_name', COALESCE(sharer_name, 'Unknown'),
        'document_name', COALESCE(document_name, 'Unknown Document'),
        'document_id', NEW.document_id::text
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_notify_vault_share ON public.vault_shares;
CREATE TRIGGER trigger_notify_vault_share
  AFTER INSERT ON public.vault_shares
  FOR EACH ROW
  EXECUTE FUNCTION notify_vault_share();

-- STEP 8: Show created triggers
SELECT 'All notification triggers created successfully!' as status;

SELECT 
  schemaname,
  tablename,
  triggername,
  'Trigger created for ' || tablename as description
FROM pg_triggers 
WHERE triggername LIKE '%notify_%'
ORDER BY tablename, triggername; 