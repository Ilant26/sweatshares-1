-- Check if notification functions and triggers are properly set up

-- Check if notification functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('notify_new_message', 'create_notification', 'mark_notifications_read', 'get_unread_notification_count')
AND routine_schema = 'public';

-- Check if message triggers exist
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE trigger_name LIKE '%message%' OR event_object_table = 'messages';

-- Check if messages table has the correct structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- Test creating a simple message without triggers
DO $$
DECLARE
  test_user_id UUID;
  test_user2_id UUID;
  test_message_id UUID;
BEGIN
  -- Get two user IDs
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  SELECT id INTO test_user2_id FROM auth.users LIMIT 1 OFFSET 1;
  
  IF test_user_id IS NOT NULL AND test_user2_id IS NOT NULL THEN
    -- Try to create a simple message
    INSERT INTO messages (sender_id, receiver_id, content, read)
    VALUES (test_user_id, test_user2_id, 'Test message', false)
    RETURNING id INTO test_message_id;
    
    RAISE NOTICE 'Successfully created test message with ID: %', test_message_id;
    
    -- Clean up
    DELETE FROM messages WHERE id = test_message_id;
    RAISE NOTICE 'Cleaned up test message';
  ELSE
    RAISE NOTICE 'Need at least 2 users for testing';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test message: %', SQLERRM;
END $$; 