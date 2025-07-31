-- Check which tables exist in the database
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'likes', 'comments', 'favorites', 'notifications', 'alerts', 
    'posts', 'invoices', 'listings', 'external_clients', 'connections', 
    'messages', 'profiles', 'escrow_transactions', 'escrow_documents',
    'signature_requests', 'signature_positions'
  )
ORDER BY table_name;

-- Check for any tables with similar names
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%like%' 
    OR table_name LIKE '%comment%' 
    OR table_name LIKE '%favorite%'
    OR table_name LIKE '%post%'
    OR table_name LIKE '%alert%'
    OR table_name LIKE '%notification%')
ORDER BY table_name; 