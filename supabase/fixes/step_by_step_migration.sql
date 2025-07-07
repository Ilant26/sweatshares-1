-- Step-by-step notifications migration
-- Run this in Supabase Dashboard > SQL Editor

-- STEP 1: Check current state
SELECT 'Current notification types:' as info;
SELECT type, COUNT(*) as count 
FROM public.notifications 
GROUP BY type 
ORDER BY count DESC;

-- STEP 2: Remove the existing constraint first
ALTER TABLE public.notifications 
DROP CONSTRAINT IF EXISTS notifications_type_check;

-- STEP 3: Add missing columns
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS message_id uuid,
ADD COLUMN IF NOT EXISTS connection_id uuid,
ADD COLUMN IF NOT EXISTS invoice_id uuid,
ADD COLUMN IF NOT EXISTS signature_id uuid,
ADD COLUMN IF NOT EXISTS alert_id uuid;

-- STEP 4: Convert existing data
UPDATE public.notifications 
SET 
  title = CASE 
    WHEN type = 'connection_request' THEN 'New Connection Request'
    WHEN type = 'connection_response' THEN 'Connection Accepted'
    WHEN type = 'message' THEN 'New Message'
    ELSE 'Notification'
  END,
  description = COALESCE(content, 'Notification received'),
  data = jsonb_build_object(
    'sender_id', COALESCE(sender_id::text, ''),
    'legacy_content', COALESCE(content, '')
  );

-- STEP 5: Fix any invalid types
UPDATE public.notifications 
SET type = 'connection_accepted'
WHERE type = 'connection_response';

-- STEP 6: Check what types we have now
SELECT 'Types after conversion:' as info;
SELECT type, COUNT(*) as count 
FROM public.notifications 
GROUP BY type 
ORDER BY count DESC;

SELECT 'Migration step completed - check the types above!' as status; 