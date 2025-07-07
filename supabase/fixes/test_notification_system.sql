-- Test script for the notification system
-- Run this after the migrations to verify everything works

-- Check the current notifications table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'notifications' 
ORDER BY ordinal_position;

-- Check existing notifications (if any)
SELECT id, user_id, type, title, description, data, read, created_at 
FROM notifications 
LIMIT 5;

-- Test creating a notification manually
DO $$
DECLARE
  test_user_id UUID;
  notification_id UUID;
BEGIN
  -- Get a user ID from your users (replace with actual user ID if available)
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NOT NULL THEN
    -- Test creating a notification
    SELECT create_notification(
      test_user_id,
      'connection_request',
      'Test notification',
      'This is a test notification created by the migration script',
      '{"test": true, "sender_name": "Test User"}'::jsonb
    ) INTO notification_id;
    
    RAISE NOTICE 'Created test notification with ID: %', notification_id;
    
    -- Test marking it as read
    PERFORM mark_notifications_read(test_user_id, ARRAY[notification_id]);
    
    RAISE NOTICE 'Marked notification as read';
    
    -- Test getting unread count
    RAISE NOTICE 'Unread count for user: %', get_unread_notification_count(test_user_id);
    
    -- Clean up test notification
    DELETE FROM notifications WHERE id = notification_id;
    RAISE NOTICE 'Cleaned up test notification';
  ELSE
    RAISE NOTICE 'No users found for testing';
  END IF;
END $$;

-- Check if required functions exist
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name IN ('create_notification', 'mark_notifications_read', 'get_unread_notification_count')
AND routine_schema = 'public';

-- Check if triggers are set up (if connections table exists)
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers 
WHERE trigger_name LIKE '%notify%';

-- Show notification type constraint
SELECT constraint_name, check_clause
FROM information_schema.check_constraints 
WHERE constraint_name LIKE '%notifications_type%'; 