-- Update notifications table to work with notifications dropdown
-- Run this in Supabase Dashboard > SQL Editor

-- 1. First, let's see what we're working with
SELECT 'Current notifications table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Add missing columns that the dropdown expects
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS message_id uuid,
ADD COLUMN IF NOT EXISTS connection_id uuid,
ADD COLUMN IF NOT EXISTS invoice_id uuid,
ADD COLUMN IF NOT EXISTS signature_id uuid,
ADD COLUMN IF NOT EXISTS alert_id uuid;

-- 3. Update the type constraint to include all notification types the dropdown expects
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check CHECK (
  type = ANY (ARRAY[
    'message'::text,
    'connection_request'::text,
    'connection_accepted'::text,
    'invoice_request'::text,
    'escrow_payment'::text,
    'vault_share'::text,
    'signature_request'::text,
    'alert_match'::text
  ])
);

-- 4. Convert existing data to new format
UPDATE public.notifications 
SET 
  title = CASE 
    WHEN type = 'connection_request' THEN 'New Connection Request'
    WHEN type = 'connection_response' THEN 'Connection Accepted'
    WHEN type = 'message' THEN 'New Message'
    ELSE 'Notification'
  END,
  description = content,
  data = jsonb_build_object(
    'sender_id', sender_id::text,
    'legacy_content', content
  ),
  type = CASE 
    WHEN type = 'connection_response' THEN 'connection_accepted'
    ELSE type
  END
WHERE title IS NULL;

-- 5. Make title and description required (after we've populated them)
ALTER TABLE public.notifications 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN description SET NOT NULL;

-- 6. Add foreign key constraints for the new ID columns
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

-- Note: Only add other FK constraints if those tables exist
-- Add these manually if you have these tables:
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES public.connections(id) ON DELETE CASCADE;
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_invoice_id_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
-- ALTER TABLE public.notifications ADD CONSTRAINT notifications_signature_id_fkey FOREIGN KEY (signature_id) REFERENCES public.signatures(id) ON DELETE CASCADE;

-- 7. Create updated indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- 8. Update the updated_at column when notifications are modified
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- 9. Create function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.notifications
    WHERE user_id = user_uuid AND read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids uuid[], user_uuid uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF user_uuid IS NOT NULL THEN
    -- Mark specific notifications as read for a user
    UPDATE public.notifications 
    SET read = true, updated_at = now()
    WHERE id = ANY(notification_ids) AND user_id = user_uuid;
  ELSE
    -- Mark all notifications as read for the current user
    UPDATE public.notifications 
    SET read = true, updated_at = now()
    WHERE user_id = auth.uid() AND read = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Update RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 12. Show final structure
SELECT 'Updated notifications table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Migration completed successfully!' as status; 