-- Simple fix for message trigger issue
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Disable the problematic trigger
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;

-- 2. Check what functions exist
SELECT routine_name, routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('create_notification', 'notify_new_message');

-- 3. Show current status
SELECT 'Message trigger disabled - messaging should work now' as status; 