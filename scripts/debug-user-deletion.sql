-- Debug User Deletion Issues
-- This script will help identify why user deletion failed

-- Check if the user exists
SELECT 'User exists check' as check_type, 
       id, 
       full_name, 
       email, 
       created_at 
FROM profiles 
WHERE id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any active escrow transactions
SELECT 'Active escrow transactions' as check_type,
       id,
       invoice_id,
       status,
       created_at
FROM escrow_transactions 
WHERE payer_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965' 
   OR payee_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any pending invoices
SELECT 'Pending invoices' as check_type,
       id,
       invoice_number,
       status,
       sender_id,
       receiver_id
FROM invoices 
WHERE (sender_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965' 
    OR receiver_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965')
   AND status IN ('pending', 'paid');

-- Check for any active listings
SELECT 'Active listings' as check_type,
       id,
       title,
       status,
       user_id
FROM listings 
WHERE user_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965' 
   AND status = 'active';

-- Check for any signature requests
SELECT 'Signature requests' as check_type,
       id,
       document_name,
       status,
       requester_id,
       signer_id
FROM signature_requests 
WHERE requester_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965' 
   OR signer_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any alerts
SELECT 'Alerts' as check_type,
       id,
       title,
       status,
       user_id
FROM alerts 
WHERE user_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any notifications
SELECT 'Notifications' as check_type,
       id,
       type,
       read,
       user_id
FROM notifications 
WHERE user_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any posts
SELECT 'Posts' as check_type,
       id,
       title,
       user_id
FROM posts 
WHERE user_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any comments
SELECT 'Comments' as check_type,
       id,
       content,
       user_id,
       post_id
FROM comments 
WHERE user_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any likes
SELECT 'Likes' as check_type,
       id,
       user_id,
       post_id
FROM likes 
WHERE user_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965';

-- Check for any favorites
SELECT 'Favorites' as check_type,
       id,
       user_id,
       profile_id,
       listing_id
FROM favorites 
WHERE user_id = '9ea51711-0df3-4b6a-91aa-10d31e4d6965'; 