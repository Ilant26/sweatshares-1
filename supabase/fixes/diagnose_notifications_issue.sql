-- Diagnose notifications constraint issue
-- Run this in Supabase Dashboard > SQL Editor

-- 1. Check current constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'public.notifications'::regclass 
AND contype = 'c';

-- 2. Check what notification types currently exist
SELECT 'Current notification types and counts:' as info;
SELECT type, COUNT(*) as count 
FROM public.notifications 
GROUP BY type 
ORDER BY count DESC;

-- 3. Find any problematic rows
SELECT 'Checking for invalid types:' as info;
SELECT id, type, content, title, description
FROM public.notifications 
WHERE type NOT IN (
  'message',
  'connection_request', 
  'connection_accepted',
  'invoice_request',
  'escrow_payment',
  'vault_share',
  'signature_request',
  'alert_match'
)
LIMIT 5;

-- 4. Check the specific failing row
SELECT 'Checking the specific failing row:' as info;
SELECT id, type, content, title, description, created_at
FROM public.notifications 
WHERE id = '0b4a4e33-6761-4611-ab91-6bccae7f1b44'
OR content LIKE '%accepted your connection request%'
LIMIT 3;

-- 5. Show table structure
SELECT 'Current table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'notifications' 
AND table_schema = 'public'
ORDER BY ordinal_position; 