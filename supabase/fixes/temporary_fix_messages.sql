-- Temporary fix to get messaging working
-- Run this in Supabase Dashboard > SQL Editor

-- Disable the message trigger temporarily
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;

-- Check what columns actually exist in profiles table
SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'Message trigger disabled - messaging should work now!' as status; 