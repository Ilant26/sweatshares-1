-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('message', 'connection_request', 'connection_accepted', 'invoice_request', 'escrow_payment', 'vault_share', 'signature_request', 'alert_match')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Foreign key references for different notification types
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  connection_id UUID REFERENCES connections(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  signature_id UUID REFERENCES signatures(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Function to create notifications
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT,
  p_data JSONB DEFAULT '{}',
  p_message_id UUID DEFAULT NULL,
  p_connection_id UUID DEFAULT NULL,
  p_invoice_id UUID DEFAULT NULL,
  p_signature_id UUID DEFAULT NULL,
  p_alert_id UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, description, data,
    message_id, connection_id, invoice_id, signature_id, alert_id
  ) VALUES (
    p_user_id, p_type, p_title, p_description, p_data,
    p_message_id, p_connection_id, p_invoice_id, p_signature_id, p_alert_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL,
  p_type TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF p_notification_ids IS NOT NULL THEN
    -- Mark specific notifications as read
    UPDATE notifications 
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id 
      AND id = ANY(p_notification_ids)
      AND read = FALSE;
  ELSIF p_type IS NOT NULL THEN
    -- Mark all notifications of a specific type as read
    UPDATE notifications 
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id 
      AND type = p_type
      AND read = FALSE;
  ELSE
    -- Mark all notifications as read
    UPDATE notifications 
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id 
      AND read = FALSE;
  END IF;
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for new messages
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Get sender's name
  SELECT COALESCE(full_name, username, email) INTO sender_name
  FROM profiles 
  WHERE id = NEW.sender_id;
  
  -- Create notification for receiver
  IF NEW.receiver_id != NEW.sender_id THEN
    PERFORM create_notification(
      NEW.receiver_id,
      'message',
      'New message',
      sender_name || ' sent you a message',
      jsonb_build_object(
        'sender_id', NEW.sender_id,
        'sender_name', sender_name,
        'message_preview', LEFT(NEW.content, 100)
      ),
      p_message_id => NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for connection requests
CREATE OR REPLACE FUNCTION notify_connection_request() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  receiver_name TEXT;
BEGIN
  -- Get sender and receiver names
  SELECT COALESCE(full_name, username, email) INTO sender_name
  FROM profiles WHERE id = NEW.sender_id;
  
  SELECT COALESCE(full_name, username, email) INTO receiver_name
  FROM profiles WHERE id = NEW.receiver_id;
  
  IF NEW.status = 'pending' AND OLD.status IS DISTINCT FROM 'pending' THEN
    -- New connection request
    PERFORM create_notification(
      NEW.receiver_id,
      'connection_request',
      'New connection request',
      sender_name || ' wants to connect with you',
      jsonb_build_object(
        'sender_id', NEW.sender_id,
        'sender_name', sender_name
      ),
      p_connection_id => NEW.id
    );
  ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Connection accepted - notify sender
    PERFORM create_notification(
      NEW.sender_id,
      'connection_accepted',
      'Connection accepted',
      receiver_name || ' accepted your connection request',
      jsonb_build_object(
        'receiver_id', NEW.receiver_id,
        'receiver_name', receiver_name
      ),
      p_connection_id => NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for invoice/escrow notifications
CREATE OR REPLACE FUNCTION notify_invoice_events() RETURNS TRIGGER AS $$
DECLARE
  client_name TEXT;
  freelancer_name TEXT;
BEGIN
  -- Get names
  SELECT COALESCE(full_name, username, email) INTO client_name
  FROM profiles WHERE id = NEW.client_id;
  
  SELECT COALESCE(full_name, username, email) INTO freelancer_name
  FROM profiles WHERE id = NEW.freelancer_id;
  
  -- New invoice request
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      NEW.freelancer_id,
      'invoice_request',
      'New invoice request',
      client_name || ' sent you an invoice request for ' || NEW.currency || NEW.amount,
      jsonb_build_object(
        'client_id', NEW.client_id,
        'client_name', client_name,
        'amount', NEW.amount,
        'currency', NEW.currency,
        'invoice_number', NEW.invoice_number
      ),
      p_invoice_id => NEW.id
    );
  END IF;
  
  -- Escrow payment status changes
  IF TG_OP = 'UPDATE' AND NEW.escrow_status IS DISTINCT FROM OLD.escrow_status THEN
    IF NEW.escrow_status = 'pending_payment' THEN
      PERFORM create_notification(
        NEW.client_id,
        'escrow_payment',
        'Escrow payment required',
        'Payment required for invoice ' || NEW.invoice_number,
        jsonb_build_object(
          'freelancer_id', NEW.freelancer_id,
          'freelancer_name', freelancer_name,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'invoice_number', NEW.invoice_number
        ),
        p_invoice_id => NEW.id
      );
    ELSIF NEW.escrow_status = 'funds_held' THEN
      PERFORM create_notification(
        NEW.freelancer_id,
        'escrow_payment',
        'Funds held in escrow',
        'Payment for invoice ' || NEW.invoice_number || ' is now held in escrow',
        jsonb_build_object(
          'client_id', NEW.client_id,
          'client_name', client_name,
          'amount', NEW.amount,
          'currency', NEW.currency,
          'invoice_number', NEW.invoice_number
        ),
        p_invoice_id => NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for signature requests
CREATE OR REPLACE FUNCTION notify_signature_events() RETURNS TRIGGER AS $$
DECLARE
  signer_name TEXT;
  requester_name TEXT;
BEGIN
  -- Get names
  SELECT COALESCE(full_name, username, email) INTO requester_name
  FROM profiles WHERE id = NEW.created_by;
  
  -- New signature request (when signature is created)
  IF TG_OP = 'INSERT' THEN
    SELECT COALESCE(full_name, username, email) INTO signer_name
    FROM profiles WHERE id = NEW.signer_id;
    
    PERFORM create_notification(
      NEW.signer_id,
      'signature_request',
      'New signature request',
      requester_name || ' requested your signature for "' || NEW.document_name || '"',
      jsonb_build_object(
        'requester_id', NEW.created_by,
        'requester_name', requester_name,
        'document_name', NEW.document_name
      ),
      p_signature_id => NEW.id
    );
  END IF;
  
  -- Document signed notification
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    SELECT COALESCE(full_name, username, email) INTO signer_name
    FROM profiles WHERE id = NEW.signer_id;
    
    PERFORM create_notification(
      NEW.created_by,
      'signature_request',
      'Document signed',
      signer_name || ' signed "' || NEW.document_name || '"',
      jsonb_build_object(
        'signer_id', NEW.signer_id,
        'signer_name', signer_name,
        'document_name', NEW.document_name
      ),
      p_signature_id => NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for vault document shares
CREATE OR REPLACE FUNCTION notify_vault_share() RETURNS TRIGGER AS $$
DECLARE
  owner_name TEXT;
  recipient_name TEXT;
BEGIN
  -- This function would be triggered when documents are shared in the vault
  -- You'll need to adjust based on your vault sharing table structure
  
  -- Get owner and recipient names
  SELECT COALESCE(full_name, username, email) INTO owner_name
  FROM profiles WHERE id = NEW.owner_id;
  
  SELECT COALESCE(full_name, username, email) INTO recipient_name  
  FROM profiles WHERE id = NEW.shared_with_id;
  
  -- Notify recipient of document share
  PERFORM create_notification(
    NEW.shared_with_id,
    'vault_share',
    'Document shared with you',
    owner_name || ' shared a document "' || NEW.document_name || '" with you',
    jsonb_build_object(
      'owner_id', NEW.owner_id,
      'owner_name', owner_name,
      'document_name', NEW.document_name
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_new_message();

DROP TRIGGER IF EXISTS trigger_notify_connection_request ON connections;
CREATE TRIGGER trigger_notify_connection_request
  AFTER INSERT OR UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION notify_connection_request();

DROP TRIGGER IF EXISTS trigger_notify_invoice_events ON invoices;
CREATE TRIGGER trigger_notify_invoice_events
  AFTER INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION notify_invoice_events();

DROP TRIGGER IF EXISTS trigger_notify_signature_events ON signatures;
CREATE TRIGGER trigger_notify_signature_events
  AFTER INSERT OR UPDATE ON signatures
  FOR EACH ROW EXECUTE FUNCTION notify_signature_events();

-- Create function to get notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 