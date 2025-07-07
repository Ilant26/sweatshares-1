-- Temporary fix: Disable message notification trigger
-- Run this to get messages working again while we debug the notification issue

-- Disable the message notification trigger if it exists
DROP TRIGGER IF EXISTS trigger_notify_new_message ON messages;

-- Show confirmation
SELECT 'Message notification trigger disabled - messages should work now' as status; 