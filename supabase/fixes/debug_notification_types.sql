-- Debug script to check existing notification types
-- Run this BEFORE the migration to see what needs to be fixed

-- Check what notification types currently exist
SELECT type, COUNT(*) as count 
FROM notifications 
GROUP BY type 
ORDER BY count DESC;

-- Show sample notifications with their current types
SELECT id, type, 
       CASE WHEN content IS NOT NULL THEN LEFT(content, 50) ELSE NULL END as content_preview,
       CASE WHEN sender_id IS NOT NULL THEN 'Has sender_id' ELSE 'No sender_id' END as sender_status,
       created_at
FROM notifications 
ORDER BY created_at DESC 
LIMIT 10;

-- Check what the proposed type mapping would be
SELECT 
  type as original_type,
  CASE 
    WHEN type = 'connection_request' THEN 'connection_request'  -- Already correct
    WHEN type = 'connection_response' THEN 'connection_accepted'  -- Map response to accepted
    WHEN type ILIKE '%connection%' AND type ILIKE '%request%' THEN 'connection_request'
    WHEN type ILIKE '%connection%' AND (type ILIKE '%accept%' OR type ILIKE '%response%') THEN 'connection_accepted'
    WHEN type ILIKE '%message%' THEN 'message'
    WHEN type ILIKE '%invoice%' THEN 'invoice_request'
    WHEN type ILIKE '%escrow%' OR type ILIKE '%payment%' THEN 'escrow_payment'
    WHEN type ILIKE '%vault%' OR type ILIKE '%share%' THEN 'vault_share'
    WHEN type ILIKE '%signature%' OR type ILIKE '%sign%' THEN 'signature_request'
    WHEN type ILIKE '%alert%' OR type ILIKE '%match%' THEN 'alert_match'
    ELSE 'message'
  END as mapped_type,
  COUNT(*) as count
FROM notifications 
GROUP BY type 
ORDER BY count DESC; 