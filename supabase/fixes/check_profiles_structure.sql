-- Check profiles table structure
-- Run this in Supabase Dashboard > SQL Editor

SELECT 'Profiles table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position; 