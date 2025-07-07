-- Comprehensive debug for message trigger issue

-- 1. First, disable the trigger to get messaging working
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;

-- 2. Check if all required functions exist
SELECT 
  routine_name,
  routine_type,
  CASE WHEN routine_name IS NOT NULL THEN 'EXISTS' ELSE 'MISSING' END as status
FROM (
  VALUES ('create_notification'), ('notify_new_message'), ('mark_notifications_read'), ('get_unread_notification_count')
) AS expected(routine_name)
LEFT JOIN information_schema.routines r ON r.routine_name = expected.routine_name AND r.routine_schema = 'public';

-- 3. Check notifications table structure
SELECT 'Notifications table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- 4. Check profiles table structure (needed by trigger)
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('id', 'full_name', 'username', 'email')
ORDER BY ordinal_position;

-- 5. Test if we can create a notification manually
DO $$
DECLARE
  test_user_id UUID;
  notification_id UUID;
  error_msg TEXT;
BEGIN
  -- Get a test user
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    BEGIN
      -- Try to create a notification manually
      SELECT create_notification(
        test_user_id,
        'message',
        'Test notification',
        'Testing manual notification creation',
        '{"test": true}'::jsonb
      ) INTO notification_id;
      
      RAISE NOTICE 'SUCCESS: Created notification with ID %', notification_id;
      
      -- Clean up
      DELETE FROM notifications WHERE id = notification_id;
      RAISE NOTICE 'Cleaned up test notification';
      
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE 'ERROR creating notification: %', error_msg;
    END;
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;

-- 6. Test the message trigger function manually
DO $$
DECLARE
  test_user_id UUID;
  test_user2_id UUID;
  test_message_id UUID;
  error_msg TEXT;
BEGIN
  -- Get two test users
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_user2_id FROM auth.users LIMIT 1 OFFSET 1;
  
  IF test_user_id IS NOT NULL AND test_user2_id IS NOT NULL THEN
    BEGIN
      -- Create a test message
      INSERT INTO messages (sender_id, receiver_id, content, read)
      VALUES (test_user_id, test_user2_id, 'Test message for trigger', false)
      RETURNING id INTO test_message_id;
      
      RAISE NOTICE 'Created test message with ID %', test_message_id;
      
      -- Manually call the trigger function
      PERFORM notify_new_message() FROM (
        SELECT test_message_id as id, test_user_id as sender_id, test_user2_id as receiver_id, 'Test message for trigger' as content, false as read
      ) as NEW;
      
      RAISE NOTICE 'SUCCESS: Trigger function executed without error';
      
      -- Clean up
      DELETE FROM messages WHERE id = test_message_id;
      RAISE NOTICE 'Cleaned up test message';
      
    EXCEPTION
      WHEN OTHERS THEN
        GET STACKED DIAGNOSTICS error_msg = MESSAGE_TEXT;
        RAISE NOTICE 'ERROR in trigger function: %', error_msg;
        -- Clean up on error
        DELETE FROM messages WHERE id = test_message_id;
    END;
  ELSE
    RAISE NOTICE 'Need at least 2 users for testing';
  END IF;
END $$;

-- 7. Show current trigger status
SELECT 'Current message triggers:' as info;
SELECT trigger_name, event_manipulation, action_timing, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages';

SELECT 'Message trigger disabled - messages should work now' as status; 