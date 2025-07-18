-- Safe User Deletion Script - FINAL CORRECTED VERSION
-- This script deletes a user and all associated data in the correct order
-- to avoid foreign key constraint violations

CREATE OR REPLACE FUNCTION delete_user_safely(user_id_to_delete UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Delete in reverse dependency order
    
    -- 1. Delete escrow documents first (if escrow_documents table exists)
    BEGIN
        DELETE FROM escrow_documents WHERE escrow_transaction_id IN (
            SELECT id FROM escrow_transactions WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete
        );
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 2. Delete escrow disputes
    BEGIN
        DELETE FROM escrow_disputes WHERE escrow_transaction_id IN (
            SELECT id FROM escrow_transactions WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete
        );
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 3. Delete escrow transactions
    BEGIN
        DELETE FROM escrow_transactions WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 4. Delete stripe connect accounts
    BEGIN
        DELETE FROM stripe_connect_accounts WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 5. Delete vault shares where user is involved
    BEGIN
        DELETE FROM vault_shares WHERE shared_with_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 6. Delete vault documents
    BEGIN
        DELETE FROM vault_documents WHERE owner_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 7. Delete signature positions for user's signature requests
    BEGIN
        DELETE FROM signature_positions WHERE signature_request_id IN (
            SELECT id FROM signature_requests WHERE sender_id = user_id_to_delete OR signer_id = user_id_to_delete
        );
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 8. Delete signature requests
    BEGIN
        DELETE FROM signature_requests WHERE sender_id = user_id_to_delete OR signer_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 9. Delete invoices (using correct column names: sender_id, receiver_id)
    DELETE FROM invoices WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
    
    -- 10. Delete alert matches
    BEGIN
        DELETE FROM alert_matches WHERE alert_id IN (SELECT id FROM alerts WHERE user_id = user_id_to_delete);
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 11. Delete alerts
    BEGIN
        DELETE FROM alerts WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 12. Delete listings
    DELETE FROM listings WHERE user_id = user_id_to_delete;
    
    -- 13. Delete saved profiles and liked listings (user as subject)
    BEGIN
        DELETE FROM saved_profiles WHERE user_id = user_id_to_delete OR profile_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        DELETE FROM liked_listings WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 14. Delete post-related data (comments, likes, saved posts)
    BEGIN
        DELETE FROM saved_posts WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        DELETE FROM post_likes WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        DELETE FROM comment_likes WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        DELETE FROM comments WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        DELETE FROM posts WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 15. Delete connections (both as sender and receiver)
    DELETE FROM connections WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
    
    -- 16. Delete messages
    DELETE FROM messages WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
    
    -- 17. Delete notifications
    BEGIN
        DELETE FROM notifications WHERE user_id = user_id_to_delete OR sender_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 18. Delete support requests and bug reports
    BEGIN
        DELETE FROM support_requests WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    BEGIN
        DELETE FROM bug_reports WHERE user_id = user_id_to_delete;
    EXCEPTION WHEN undefined_table THEN
        NULL;
    END;
    
    -- 19. Delete external clients
    DELETE FROM external_clients WHERE user_id = user_id_to_delete;
    
    -- 20. Delete profile (this should cascade to many tables that reference profiles.id)
    DELETE FROM profiles WHERE id = user_id_to_delete;
    
    -- 21. Finally delete from auth.users (this might cascade to remaining tables)
    DELETE FROM auth.users WHERE id = user_id_to_delete;
    
    RETURN TRUE;
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error details
    RAISE NOTICE 'Error deleting user %: %', user_id_to_delete, SQLERRM;
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to check what would be deleted (dry run) - FIXED AMBIGUITY
CREATE OR REPLACE FUNCTION check_user_deletion_impact(user_id_to_check UUID)
RETURNS TABLE(data_type TEXT, record_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'profiles'::TEXT, COUNT(*) FROM profiles WHERE id = user_id_to_check
    UNION ALL
    SELECT 'messages_sent'::TEXT, COUNT(*) FROM messages WHERE sender_id = user_id_to_check
    UNION ALL
    SELECT 'messages_received'::TEXT, COUNT(*) FROM messages WHERE receiver_id = user_id_to_check
    UNION ALL
    SELECT 'connections'::TEXT, COUNT(*) FROM connections WHERE sender_id = user_id_to_check OR receiver_id = user_id_to_check
    UNION ALL
    SELECT 'listings'::TEXT, COUNT(*) FROM listings WHERE user_id = user_id_to_check
    UNION ALL
    SELECT 'invoices'::TEXT, COUNT(*) FROM invoices WHERE sender_id = user_id_to_check OR receiver_id = user_id_to_check
    UNION ALL
    SELECT 'external_clients'::TEXT, COUNT(*) FROM external_clients WHERE user_id = user_id_to_check;
    
    -- Add optional tables only if they exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
        RETURN QUERY SELECT 'posts'::TEXT, COUNT(*) FROM posts WHERE user_id = user_id_to_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'comments') THEN
        RETURN QUERY SELECT 'comments'::TEXT, COUNT(*) FROM comments WHERE user_id = user_id_to_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vault_documents') THEN
        RETURN QUERY SELECT 'vault_documents'::TEXT, COUNT(*) FROM vault_documents WHERE owner_id = user_id_to_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'signature_requests') THEN
        RETURN QUERY SELECT 'signature_requests'::TEXT, COUNT(*) FROM signature_requests WHERE sender_id = user_id_to_check OR signer_id = user_id_to_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'escrow_transactions') THEN
        RETURN QUERY SELECT 'escrow_transactions'::TEXT, COUNT(*) FROM escrow_transactions WHERE payer_id = user_id_to_check OR payee_id = user_id_to_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'support_requests') THEN
        RETURN QUERY SELECT 'support_requests'::TEXT, COUNT(*) FROM support_requests WHERE user_id = user_id_to_check;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'alerts') THEN
        RETURN QUERY SELECT 'alerts'::TEXT, COUNT(*) FROM alerts WHERE user_id = user_id_to_check;
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- 
-- 1. Check what would be deleted:
-- SELECT * FROM check_user_deletion_impact('USER_ID_HERE');
--
-- 2. Actually delete the user:
-- SELECT delete_user_safely('USER_ID_HERE'); 