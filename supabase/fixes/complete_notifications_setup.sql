-- Complete notifications setup - Part 2
-- Run this in Supabase Dashboard > SQL Editor

-- STEP 1: Add the new constraint now that data is clean
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

-- STEP 2: Make title and description required
ALTER TABLE public.notifications 
ALTER COLUMN title SET NOT NULL,
ALTER COLUMN description SET NOT NULL;

-- STEP 3: Add foreign key constraints
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_message_id_fkey 
FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE CASCADE;

-- STEP 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, read) WHERE read = false;

-- STEP 5: Create the updated_at trigger
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

-- STEP 6: Create function to get unread count
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

-- STEP 7: Create function to mark notifications as read
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

-- STEP 8: Update RLS policies
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

-- STEP 9: Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- STEP 10: Test the functions
SELECT 'Testing functions:' as info;

-- Test get_unread_notification_count (should work)
SELECT 'Unread count function test:' as test, get_unread_notification_count(auth.uid()) as count;

-- STEP 11: Show final table structure
SELECT 'Final table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Notifications setup completed successfully!' as status; 