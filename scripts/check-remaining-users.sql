-- Check why these users still exist
-- This script will help identify what's preventing their deletion

DO $$
DECLARE
    user_ids UUID[] := ARRAY[
        '92052d4f-30bc-489d-94d5-8b90c9e2770c',
        '9ea51711-0df3-4b6a-91aa-10d31e4d6965',
        '23c6de3d-dcfa-4570-afe9-5e0c11ffb5ab'
    ];
    current_user_id UUID;
    record_count INTEGER;
BEGIN
    FOREACH current_user_id IN ARRAY user_ids
    LOOP
        RAISE NOTICE '=== Checking user: % ===', current_user_id;
        
        -- Check if profile exists
        SELECT COUNT(*) INTO record_count FROM profiles WHERE id = current_user_id;
        RAISE NOTICE 'Profile records: %', record_count;
        
        -- Check escrow transactions
        SELECT COUNT(*) INTO record_count FROM escrow_transactions 
        WHERE payer_id = current_user_id OR payee_id = current_user_id;
        RAISE NOTICE 'Escrow transactions: %', record_count;
        
        -- Check invoices
        SELECT COUNT(*) INTO record_count FROM invoices 
        WHERE sender_id = current_user_id OR receiver_id = current_user_id;
        RAISE NOTICE 'Invoices: %', record_count;
        
        -- Check listings
        SELECT COUNT(*) INTO record_count FROM listings WHERE user_id = current_user_id;
        RAISE NOTICE 'Listings: %', record_count;
        
        -- Check external clients
        SELECT COUNT(*) INTO record_count FROM external_clients WHERE user_id = current_user_id;
        RAISE NOTICE 'External clients: %', record_count;
        
        -- Check messages
        SELECT COUNT(*) INTO record_count FROM messages 
        WHERE sender_id = current_user_id OR receiver_id = current_user_id;
        RAISE NOTICE 'Messages: %', record_count;
        
        -- Check posts
        SELECT COUNT(*) INTO record_count FROM posts WHERE user_id = current_user_id;
        RAISE NOTICE 'Posts: %', record_count;
        
        -- Check comments
        SELECT COUNT(*) INTO record_count FROM comments WHERE user_id = current_user_id;
        RAISE NOTICE 'Comments: %', record_count;
        
        -- Check notifications
        SELECT COUNT(*) INTO record_count FROM notifications WHERE user_id = current_user_id;
        RAISE NOTICE 'Notifications: %', record_count;
        
        -- Check alerts
        SELECT COUNT(*) INTO record_count FROM alerts WHERE user_id = current_user_id;
        RAISE NOTICE 'Alerts: %', record_count;
        
        -- Check post likes
        SELECT COUNT(*) INTO record_count FROM post_likes WHERE user_id = current_user_id;
        RAISE NOTICE 'Post likes: %', record_count;
        
        -- Check comment likes
        SELECT COUNT(*) INTO record_count FROM comment_likes WHERE user_id = current_user_id;
        RAISE NOTICE 'Comment likes: %', record_count;
        
        -- Check saved posts
        SELECT COUNT(*) INTO record_count FROM saved_posts WHERE user_id = current_user_id;
        RAISE NOTICE 'Saved posts: %', record_count;
        
        -- Check liked listings
        SELECT COUNT(*) INTO record_count FROM liked_listings WHERE user_id = current_user_id;
        RAISE NOTICE 'Liked listings: %', record_count;
        
        -- Check alert notifications
        SELECT COUNT(*) INTO record_count FROM alert_notifications WHERE user_id = current_user_id;
        RAISE NOTICE 'Alert notifications: %', record_count;
        
        -- Check post attachments
        SELECT COUNT(*) INTO record_count FROM post_attachments 
        WHERE post_id IN (SELECT id FROM posts WHERE user_id = current_user_id);
        RAISE NOTICE 'Post attachments: %', record_count;
        
        RAISE NOTICE '---';
    END LOOP;
END $$; 