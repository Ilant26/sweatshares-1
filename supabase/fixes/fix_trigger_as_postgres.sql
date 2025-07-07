-- Fix message trigger as postgres user
-- Run this in Supabase Dashboard > SQL Editor

-- First, let's check what triggers exist on the public.messages table
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages' 
AND event_object_schema = 'public'
ORDER BY trigger_name;

-- Now disable the problematic trigger using proper syntax
-- This should work since we're targeting the specific schema
DO $$
BEGIN
  -- Try to drop the trigger
  EXECUTE 'DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages';
  RAISE NOTICE 'Successfully disabled trigger_notify_new_message';
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not disable trigger: %', SQLERRM;
END $$;

-- Verify the trigger is gone
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'SUCCESS: No triggers found on messages table'
    ELSE 'WARNING: ' || COUNT(*) || ' triggers still exist'
  END as status
FROM information_schema.triggers 
WHERE event_object_table = 'messages' 
AND event_object_schema = 'public'
AND trigger_name = 'trigger_notify_new_message';

-- Show remaining triggers (if any)
SELECT 
  'Remaining triggers:' as info,
  trigger_name,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'messages' 
AND event_object_schema = 'public'; 