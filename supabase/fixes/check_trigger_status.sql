-- Read-only check of trigger status
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Check current triggers on messages table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers 
WHERE event_object_table = 'messages'
ORDER BY trigger_name;

-- 2. Check if notification functions exist
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_notification', 'notify_new_message', 'mark_notifications_read', 'get_unread_notification_count')
ORDER BY routine_name;

-- 3. Check notifications table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Check table ownership
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('messages', 'notifications')
ORDER BY tablename; 