-- Fix message trigger to use correct column names
-- Run this in Supabase Dashboard > SQL Editor

-- STEP 1: Check what columns exist in profiles table
SELECT 'Profiles table columns:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- STEP 2: Check what columns exist in auth.users table
SELECT 'Auth users columns (user_metadata):' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'auth'
AND column_name IN ('email', 'user_metadata', 'raw_user_meta_data')
ORDER BY ordinal_position;

-- STEP 3: Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_notify_new_message ON public.messages;

-- STEP 4: Create updated trigger function that works with actual table structure
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_name text;
  sender_email text;
BEGIN
  -- First try to get name from profiles table
  SELECT 
    COALESCE(
      CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') 
        THEN (SELECT full_name FROM profiles WHERE id = NEW.sender_id)
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') 
        THEN (SELECT name FROM profiles WHERE id = NEW.sender_id)
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') 
        THEN (SELECT username FROM profiles WHERE id = NEW.sender_id)
        ELSE NULL
      END
    ) INTO sender_name;
  
  -- Get email from auth.users
  SELECT email INTO sender_email FROM auth.users WHERE id = NEW.sender_id;
  
  -- Use the best available name
  sender_name := COALESCE(
    sender_name,
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = NEW.sender_id),
    (SELECT user_metadata->>'full_name' FROM auth.users WHERE id = NEW.sender_id),
    sender_email,
    'Someone'
  );
  
  -- Create notification for the receiver
  PERFORM create_notification(
    NEW.receiver_id,
    'message',
    'New Message',
    sender_name || ' sent you a message',
    jsonb_build_object(
      'sender_id', NEW.sender_id::text,
      'sender_name', sender_name,
      'sender_email', sender_email,
      'message_preview', LEFT(NEW.content, 100)
    ),
    NEW.id -- message_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- STEP 5: Create the updated message notification trigger
CREATE TRIGGER trigger_notify_new_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- STEP 6: Test the trigger by showing a test query
SELECT 'Testing name resolution for current user:' as test;
SELECT 
  u.id,
  u.email,
  u.raw_user_meta_data->>'full_name' as meta_full_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'full_name') 
    THEN 'profiles.full_name exists'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') 
    THEN 'profiles.name exists'
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'username') 
    THEN 'profiles.username exists'
    ELSE 'no name column found in profiles'
  END as profile_status
FROM auth.users u
WHERE u.id = auth.uid()
LIMIT 1;

SELECT 'Message trigger updated successfully!' as status; 