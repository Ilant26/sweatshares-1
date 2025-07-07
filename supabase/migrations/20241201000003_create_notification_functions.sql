-- Create notification helper functions
-- These functions work with the updated notifications table schema

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
    user_id, type, title, description, data, read, created_at, updated_at,
    message_id, connection_id, invoice_id, signature_id, alert_id
  ) VALUES (
    p_user_id, p_type, p_title, p_description, p_data, false, NOW(), NOW(),
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

-- Function to get unread notification count
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

-- Trigger function for connection requests (only if connections table exists)
CREATE OR REPLACE FUNCTION notify_connection_request() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
  receiver_name TEXT;
BEGIN
  -- Only proceed if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
    -- Get sender and receiver names
    SELECT COALESCE(full_name, username, email) INTO sender_name
    FROM profiles WHERE id = NEW.sender_id;
    
    SELECT COALESCE(full_name, username, email) INTO receiver_name
    FROM profiles WHERE id = NEW.receiver_id;
    
    IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'pending') THEN
      -- New connection request
      PERFORM create_notification(
        NEW.receiver_id,
        'connection_request',
        'New connection request',
        COALESCE(sender_name, 'Someone') || ' wants to connect with you',
        jsonb_build_object(
          'sender_id', NEW.sender_id,
          'sender_name', COALESCE(sender_name, 'Unknown User')
        ),
        p_connection_id => NEW.id
      );
    ELSIF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
      -- Connection accepted - notify sender
      PERFORM create_notification(
        NEW.sender_id,
        'connection_accepted',
        'Connection accepted',
        COALESCE(receiver_name, 'Someone') || ' accepted your connection request',
        jsonb_build_object(
          'receiver_id', NEW.receiver_id,
          'receiver_name', COALESCE(receiver_name, 'Unknown User')
        ),
        p_connection_id => NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for connections if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') THEN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS trigger_notify_connection_request ON connections;
    
    -- Create new trigger
    CREATE TRIGGER trigger_notify_connection_request
      AFTER INSERT OR UPDATE ON connections
      FOR EACH ROW EXECUTE FUNCTION notify_connection_request();
  END IF;
END $$;

-- Trigger function for messages (only if messages table exists)
CREATE OR REPLACE FUNCTION notify_new_message() RETURNS TRIGGER AS $$
DECLARE
  sender_name TEXT;
BEGIN
  -- Only proceed if profiles table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
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
        COALESCE(sender_name, 'Someone') || ' sent you a message',
        jsonb_build_object(
          'sender_id', NEW.sender_id,
          'sender_name', COALESCE(sender_name, 'Unknown User'),
          'message_preview', LEFT(NEW.content, 100)
        ),
        p_message_id => NEW.id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for messages if the table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    -- Drop existing trigger if it exists
    DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;
    
    -- Create new trigger
    CREATE TRIGGER trigger_notify_new_message
      AFTER INSERT ON messages
      FOR EACH ROW EXECUTE FUNCTION notify_new_message();
  END IF;
END $$; 