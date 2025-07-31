-- Force Delete Remaining Users
-- This script will aggressively delete the remaining 3 users

DO $$
DECLARE
    user_ids UUID[] := ARRAY[
        '92052d4f-30bc-489d-94d5-8b90c9e2770c',
        '9ea51711-0df3-4b6a-91aa-10d31e4d6965',
        '23c6de3d-dcfa-4570-afe9-5e0c11ffb5ab'
    ];
    current_user_id UUID;
    deleted_count INTEGER := 0;
    total_deleted INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting aggressive deletion for remaining % users', array_length(user_ids, 1);
    
    FOREACH current_user_id IN ARRAY user_ids
    LOOP
        BEGIN
            RAISE NOTICE '=== Processing user: % ===', current_user_id;
            
            -- 1. Update invoices to remove escrow references (if any)
            UPDATE invoices 
            SET escrow_transaction_id = NULL 
            WHERE escrow_transaction_id IN (
                SELECT id FROM escrow_transactions 
                WHERE payer_id = current_user_id OR payee_id = current_user_id
            );
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Updated % invoices to remove escrow references', deleted_count;
            
            -- 2. Delete escrow documents first
            DELETE FROM escrow_documents 
            WHERE escrow_transaction_id IN (
                SELECT id FROM escrow_transactions 
                WHERE payer_id = current_user_id OR payee_id = current_user_id
            );
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % escrow documents', deleted_count;
            
            -- 3. Delete escrow transactions
            DELETE FROM escrow_transactions 
            WHERE payer_id = current_user_id OR payee_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % escrow transactions', deleted_count;
            
            -- 4. Delete post attachments first (before posts)
            DELETE FROM post_attachments 
            WHERE post_id IN (SELECT id FROM posts WHERE user_id = current_user_id);
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % post attachments', deleted_count;
            
            -- 5. Delete post likes
            DELETE FROM post_likes WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % post likes', deleted_count;
            
            -- 6. Delete comment likes
            DELETE FROM comment_likes WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % comment likes', deleted_count;
            
            -- 7. Delete saved posts
            DELETE FROM saved_posts WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % saved posts', deleted_count;
            
            -- 8. Delete liked listings
            DELETE FROM liked_listings WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % liked listings', deleted_count;
            
            -- 9. Delete alert notifications
            DELETE FROM alert_notifications WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % alert notifications', deleted_count;
            
            -- 10. Delete notifications
            DELETE FROM notifications WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % notifications', deleted_count;
            
            -- 11. Delete comments
            DELETE FROM comments WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % comments', deleted_count;
            
            -- 12. Delete posts
            DELETE FROM posts WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % posts', deleted_count;
            
            -- 13. Delete alerts
            DELETE FROM alerts WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % alerts', deleted_count;
            
            -- 14. Delete invoices
            DELETE FROM invoices 
            WHERE sender_id = current_user_id OR receiver_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % invoices', deleted_count;
            
            -- 15. Delete listings
            DELETE FROM listings WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % listings', deleted_count;
            
            -- 16. Delete external clients
            DELETE FROM external_clients WHERE user_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % external clients', deleted_count;
            
            -- 17. Delete messages
            DELETE FROM messages 
            WHERE sender_id = current_user_id OR receiver_id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % messages', deleted_count;
            
            -- 18. Finally, delete the profile
            DELETE FROM profiles WHERE id = current_user_id;
            GET DIAGNOSTICS deleted_count = ROW_COUNT;
            RAISE NOTICE 'Deleted % profile records', deleted_count;
            
            IF deleted_count > 0 THEN
                total_deleted := total_deleted + 1;
                RAISE NOTICE 'Successfully deleted user: %', current_user_id;
            ELSE
                RAISE NOTICE 'User % was already deleted or not found', current_user_id;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing user %: %', current_user_id, SQLERRM;
        END;
        
        RAISE NOTICE '---';
    END LOOP;
    
    RAISE NOTICE 'Aggressive deletion completed. Total users successfully deleted: %', total_deleted;
END $$; 