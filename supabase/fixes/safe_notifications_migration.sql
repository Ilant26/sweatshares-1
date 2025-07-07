-- Safe notifications table migration
-- Run this in Supabase Dashboard > SQL Editor

-- 1. First, let's see what notification types currently exist
SELECT 'Current notification types:' as info;
SELECT type, COUNT(*) as count 
FROM public.notifications 
GROUP BY type 
ORDER BY count DESC;

-- 2. Add missing columns first (without constraints)
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

-- 3. Convert ALL existing data to new format and fix types
UPDATE public.notifications 
SET 
  title = CASE 
    WHEN type = 'connection_request' THEN 'New Connection Request'
    WHEN type = 'connection_response' THEN 'Connection Accepted'
    WHEN type = 'message' THEN 'New Message'
    ELSE 'Notification'
  END,
  description = COALESCE(content, 'Notification received'),
  data = jsonb_build_object(
    'sender_id', COALESCE(sender_id::text, ''),
    'legacy_content', COALESCE(content, '')
  ),
  type = CASE 
    WHEN type = 'connection_response' THEN 'connection_accepted'
    WHEN type NOT IN ('connection_request', 'message') THEN 'connection_request'
    ELSE type
  END
WHERE title IS NULL OR type NOT IN ('connection_request', 'connection_accepted', 'message');

-- 4. Remove the old constraint and add the new one
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- 5. Add the new constraint (should work now since we've cleaned the data)
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

-- 6. Make title and description required (after we've populated them)
ALTER TABLE public.notifications 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN description SET NOT NULL;

-- 7. Add foreign key constraints for the new ID columns (only for existing tables)
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

-- 8. Create updated indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- 9. Update the updated_at column when notifications are modified
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

-- 10. Create function to get unread notification count
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

-- 11. Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(notification_ids uuid[], user_uuid uuid DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF array_length(notification_ids, 1) > 0 AND user_uuid IS NOT NULL THEN
    -- Mark specific notifications as read for a user
    UPDATE public.notifications 
    SET read = true, updated_at = now()
    WHERE id = ANY(notification_ids) AND user_id = user_uuid;
  ELSIF user_uuid IS NULL THEN
    -- Mark all notifications as read for the current user
    UPDATE public.notifications 
    SET read = true, updated_at = now()
    WHERE user_id = auth.uid() AND read = false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Update RLS policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 13. Verify the data after migration
SELECT 'Final notification types after migration:' as info;
SELECT type, COUNT(*) as count 
FROM public.notifications 
GROUP BY type 
ORDER BY count DESC;

-- 14. Show final structure
SELECT 'Updated notifications table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Migration completed successfully!' as status; 