-- Force User Deletion Script
-- This script manually deletes user data in the correct order to avoid constraint issues

-- Set the user IDs to delete
DO $$
DECLARE
    user_ids UUID[] := ARRAY[
        '92052d4f-30bc-489d-94d5-8b90c9e2770c',
        '9ea51711-0df3-4b6a-91aa-10d31e4d6965',
        '23c6de3d-dcfa-4570-afe9-5e0c11ffb5ab',
        'a0b09755-e7d9-46d4-97ea-67c53d728b3b',
        '59828abb-2e61-45d7-87df-fa3620966dbb',
        '6faa0c0e-b972-4d24-bfbc-abe10c16a77a'
    ];
    user_id_to_delete UUID;
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting force deletion for % users', array_length(user_ids, 1);
    
    -- Loop through each user
    FOREACH user_id_to_delete IN ARRAY user_ids
    LOOP
        RAISE NOTICE 'Processing user: %', user_id_to_delete;
    
    -- 1. Update invoices to remove escrow transaction references first
    UPDATE invoices 
    SET escrow_transaction_id = NULL 
    WHERE escrow_transaction_id IN (
        SELECT id FROM escrow_transactions 
        WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Updated % invoices to remove escrow references', deleted_count;
    
    -- 2. Delete escrow transactions (now safe to delete)
    DELETE FROM escrow_transactions 
    WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % escrow transactions', deleted_count;
    
    -- 3. Skip signature requests for now (need to check table structure)
    RAISE NOTICE 'Skipping signature requests - need to check table structure';
    
    -- 4. Skip signature positions for now (need to check table structure)
    RAISE NOTICE 'Skipping signature positions - need to check table structure';
    
    -- 5. Delete escrow documents (these should already be deleted with escrow_transactions)
    -- But let's be safe and delete any orphaned ones
    DELETE FROM escrow_documents 
    WHERE escrow_transaction_id IN (
        SELECT id FROM escrow_transactions 
        WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % escrow documents', deleted_count;
    
    -- 6. Delete post likes
    DELETE FROM post_likes WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % post likes', deleted_count;
    
    -- 7. Delete comment likes
    DELETE FROM comment_likes WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % comment likes', deleted_count;
    
    -- 8. Delete saved posts
    DELETE FROM saved_posts WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % saved posts', deleted_count;
    
    -- 9. Delete liked listings
    DELETE FROM liked_listings WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % liked listings', deleted_count;
    
    -- 10. Delete notifications
    DELETE FROM notifications WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % notifications', deleted_count;
    
    -- 11. Delete alert notifications
    DELETE FROM alert_notifications WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % alert notifications', deleted_count;
    
    -- 12. Delete comments
    DELETE FROM comments WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % comments', deleted_count;
    
    -- 13. Delete post attachments
    DELETE FROM post_attachments WHERE post_id IN (
        SELECT id FROM posts WHERE user_id = user_id_to_delete
    );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % post attachments', deleted_count;
    
    -- 14. Delete posts
    DELETE FROM posts WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % posts', deleted_count;
    
    -- 15. Delete alerts
    DELETE FROM alerts WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % alerts', deleted_count;
    
    -- 16. Delete invoices
    DELETE FROM invoices 
    WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % invoices', deleted_count;
    
    -- 17. Delete listings
    DELETE FROM listings WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % listings', deleted_count;
    
    -- 18. Delete external clients
    DELETE FROM external_clients WHERE user_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % external clients', deleted_count;
    
    -- 19. Skip connections (need to check column names)
    RAISE NOTICE 'Skipping connections - need to check column names';
    
    -- 20. Delete messages
    DELETE FROM messages 
    WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % messages', deleted_count;
    
    -- 21. Finally, delete the profile
    DELETE FROM profiles WHERE id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Deleted % profile records', deleted_count;
    
        RAISE NOTICE 'Force deletion completed for user: %', user_id_to_delete;
        total_deleted := total_deleted + 1;
    END LOOP;
    
    RAISE NOTICE 'All users processed. Total users deleted: %', total_deleted;
END $$; 