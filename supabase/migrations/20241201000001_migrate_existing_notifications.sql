-- Migration to update existing notifications to match the comprehensive schema
-- This migration handles the transition from the old format to the new format

-- First, let's check if we need to add any missing columns
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
  data = jsonb_build_object(
    'sender_id', sender_id
  ) || COALESCE(data, '{}'::jsonb)
WHERE title IS NULL OR description IS NULL;

-- Now make title and description NOT NULL (if they aren't already)
DO $$
BEGIN
  -- Check if title can be made NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'title' 
    AND is_nullable = 'NO'
  ) THEN
    -- First set any remaining NULL titles
    UPDATE notifications SET title = 'Notification' WHERE title IS NULL;
    -- Then make it NOT NULL
    ALTER TABLE notifications ALTER COLUMN title SET NOT NULL;
  END IF;
  
  -- Check if description can be made NOT NULL
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'description' 
    AND is_nullable = 'NO'
  ) THEN
    -- First set any remaining NULL descriptions
    UPDATE notifications SET description = 'You have a new notification' WHERE description IS NULL;
    -- Then make it NOT NULL
    ALTER TABLE notifications ALTER COLUMN description SET NOT NULL;
  END IF;
END $$;

-- Drop the old content column if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'content') THEN
    ALTER TABLE notifications DROP COLUMN content;
  END IF;
END $$;

-- Add any missing foreign key columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'message_id') THEN
    ALTER TABLE notifications ADD COLUMN message_id UUID REFERENCES messages(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'connection_id') THEN
    ALTER TABLE notifications ADD COLUMN connection_id UUID REFERENCES connections(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'invoice_id') THEN
    ALTER TABLE notifications ADD COLUMN invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'signature_id') THEN
    ALTER TABLE notifications ADD COLUMN signature_id UUID REFERENCES signatures(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'alert_id') THEN
    ALTER TABLE notifications ADD COLUMN alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Ensure proper type constraint exists
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%notifications_type_check%'
  ) THEN
    ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
  END IF;
  
  -- Add the proper type constraint
  ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
    CHECK (type IN ('message', 'connection_request', 'connection_accepted', 'invoice_request', 'escrow_payment', 'vault_share', 'signature_request', 'alert_match'));
END $$; 