-- Fixed migration to update existing notifications table without conflicts
-- This migration works with the existing notifications table structure

-- First, let's add missing columns to the existing notifications table
DO $$
BEGIN
  -- Add title column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'title') THEN
    ALTER TABLE notifications ADD COLUMN title TEXT;
  END IF;
  
  -- Add description column if it doesn't exist  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'description') THEN
    ALTER TABLE notifications ADD COLUMN description TEXT;
  END IF;
  
  -- Add data column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'data') THEN
    ALTER TABLE notifications ADD COLUMN data JSONB DEFAULT '{}';
  END IF;
  
  -- Add updated_at column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'updated_at') THEN
    ALTER TABLE notifications ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing notifications that have content/sender_id format to title/description format
UPDATE notifications 
SET 
  title = CASE 
    WHEN type = 'connection_request' THEN 'New connection request'
    WHEN type = 'connection_accepted' THEN 'Connection accepted'
    WHEN type = 'message' THEN 'New message'
    WHEN type = 'invoice_request' THEN 'New invoice request'
    WHEN type = 'escrow_payment' THEN 'Escrow payment'
    WHEN type = 'vault_share' THEN 'Document shared'
    WHEN type = 'signature_request' THEN 'Signature request'
    WHEN type = 'alert_match' THEN 'New alert match'
    ELSE 'Notification'
  END,
  description = COALESCE(content, 'You have a new notification'),
  data = CASE 
    WHEN sender_id IS NOT NULL THEN jsonb_build_object('sender_id', sender_id) || COALESCE(data, '{}'::jsonb)
    ELSE COALESCE(data, '{}'::jsonb)
  END,
  updated_at = COALESCE(updated_at, created_at, NOW())
WHERE title IS NULL OR description IS NULL OR updated_at IS NULL;

-- Now make title and description NOT NULL (if they aren't already)
DO $$
BEGIN
  -- First set any remaining NULL titles
  UPDATE notifications SET title = 'Notification' WHERE title IS NULL;
  UPDATE notifications SET description = 'You have a new notification' WHERE description IS NULL;
  UPDATE notifications SET updated_at = COALESCE(created_at, NOW()) WHERE updated_at IS NULL;
  
  -- Check if title can be made NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'title' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE notifications ALTER COLUMN title SET NOT NULL;
  END IF;
  
  -- Check if description can be made NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'description' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE notifications ALTER COLUMN description SET NOT NULL;
  END IF;
  
  -- Check if updated_at can be made NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'updated_at' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE notifications ALTER COLUMN updated_at SET NOT NULL;
  END IF;
END $$;

-- Drop existing policies that might depend on old columns
DO $$
BEGIN
  -- Drop all existing policies on notifications table
  DROP POLICY IF EXISTS "Users can create notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
  DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
  DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
  DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON notifications;
  DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON notifications;
  DROP POLICY IF EXISTS "Enable update for users based on user_id" ON notifications;
END $$;

-- Drop the old content and sender_id columns if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'content') THEN
    ALTER TABLE notifications DROP COLUMN content;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'sender_id') THEN
    ALTER TABLE notifications DROP COLUMN sender_id CASCADE;
  END IF;
END $$;

-- Add foreign key columns for existing tables only
DO $$
BEGIN
  -- Add message_id if messages table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'message_id') THEN
      ALTER TABLE notifications ADD COLUMN message_id UUID REFERENCES messages(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Add connection_id if connections table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'connections') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'connection_id') THEN
      ALTER TABLE notifications ADD COLUMN connection_id UUID REFERENCES connections(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Add invoice_id if invoices table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'invoice_id') THEN
      ALTER TABLE notifications ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Add signature_id if signatures table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'signatures') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'signature_id') THEN
      ALTER TABLE notifications ADD COLUMN signature_id UUID REFERENCES signatures(id) ON DELETE CASCADE;
    END IF;
  END IF;
  
  -- Add alert_id if alerts table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'alerts') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'alert_id') THEN
      ALTER TABLE notifications ADD COLUMN alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Update existing notification types to match valid values and add constraint
DO $$
BEGIN
  -- First, let's see what types currently exist and update invalid ones
  UPDATE notifications 
  SET type = CASE 
    WHEN type = 'connection_request' THEN 'connection_request'  -- Already correct
    WHEN type = 'connection_response' THEN 'connection_accepted'  -- Map response to accepted
    WHEN type ILIKE '%connection%' AND type ILIKE '%request%' THEN 'connection_request'
    WHEN type ILIKE '%connection%' AND (type ILIKE '%accept%' OR type ILIKE '%response%') THEN 'connection_accepted'
    WHEN type ILIKE '%message%' THEN 'message'
    WHEN type ILIKE '%invoice%' THEN 'invoice_request'
    WHEN type ILIKE '%escrow%' OR type ILIKE '%payment%' THEN 'escrow_payment'
    WHEN type ILIKE '%vault%' OR type ILIKE '%share%' THEN 'vault_share'
    WHEN type ILIKE '%signature%' OR type ILIKE '%sign%' THEN 'signature_request'
    WHEN type ILIKE '%alert%' OR type ILIKE '%match%' THEN 'alert_match'
    ELSE 'message'  -- Default fallback for unknown types
  END
  WHERE type NOT IN ('message', 'connection_request', 'connection_accepted', 'invoice_request', 'escrow_payment', 'vault_share', 'signature_request', 'alert_match');
  
  -- Drop existing type constraint if it exists
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  
  -- Add the comprehensive type constraint
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('message', 'connection_request', 'connection_accepted', 'invoice_request', 'escrow_payment', 'vault_share', 'signature_request', 'alert_match'));
END $$;

-- Create indexes for performance if they don't exist
DO $$
BEGIN
  -- Check and create indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_type') THEN
    CREATE INDEX idx_notifications_type ON notifications(type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_read') THEN
    CREATE INDEX idx_notifications_read ON notifications(read);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created_at') THEN
    CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_read') THEN
    CREATE INDEX idx_notifications_user_read ON notifications(user_id, read);
  END IF;
END $$;

-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'notifications' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create RLS policies with proper structure
DO $$
BEGIN
  -- Create new policies based on the updated schema
  CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

  CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

  CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);
END $$; 