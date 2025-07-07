-- Debug script to check the message sending issue
-- Run this to see what's causing the message creation error

-- Check if messages table exists and its structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- Check if profiles table has the required columns for notification triggers
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('full_name', 'username', 'email')
ORDER BY ordinal_position;

-- Check if notification functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('notify_new_message', 'create_notification')
AND routine_schema = 'public';

-- Check if message triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%message%' OR event_object_table = 'messages';

-- Check if there are any recent messages (to see if the table works)
SELECT COUNT(*) as message_count FROM messages;

-- Test if we can create a simple notification manually
DO $$
DECLARE
  test_user_id UUID;
  notification_id UUID;
BEGIN
  -- Get a user ID from your users
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Try to create a simple notification
    IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_notification') THEN
      SELECT create_notification(
        test_user_id,
        'message',
        'Test notification',
        'Testing notification creation',
        '{}'::jsonb
      ) INTO notification_id;
      
      RAISE NOTICE 'Successfully created test notification with ID: %', notification_id;
      
      -- Clean up
      DELETE FROM notifications WHERE id = notification_id;
      RAISE NOTICE 'Cleaned up test notification';
    ELSE
      RAISE NOTICE 'create_notification function does not exist';
    END IF;
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in notification test: %', SQLERRM;
END $$;

-- Check if RLS is causing issues with messages table
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('messages', 'notifications', 'profiles');

-- Show any policies on the messages table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'messages'; 