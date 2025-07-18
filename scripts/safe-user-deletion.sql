-- Safe User Deletion Script
-- This script deletes a user and all associated data in the correct order
-- to avoid foreign key constraint violations

-- Usage: Replace 'USER_ID_TO_DELETE' with the actual user ID
-- Example: SELECT delete_user_safely('123e4567-e89b-12d3-a456-426614174000');

CREATE OR REPLACE FUNCTION delete_user_safely(user_id_to_delete UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Start transaction
    -- Delete in reverse dependency order
    
    -- 1. Delete escrow documents first
    DELETE FROM escrow_documents WHERE escrow_transaction_id IN (
        SELECT id FROM escrow_transactions WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete
    );
    
    -- 2. Delete escrow disputes
    DELETE FROM escrow_disputes WHERE escrow_transaction_id IN (
        SELECT id FROM escrow_transactions WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete
    );
    
    -- 3. Delete escrow transactions
    DELETE FROM escrow_transactions WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete;
    
    -- 4. Delete stripe connect accounts
    DELETE FROM stripe_connect_accounts WHERE user_id = user_id_to_delete;
    
    -- 5. Delete vault shares where user is involved
    DELETE FROM vault_shares WHERE shared_with_id = user_id_to_delete;
    
    -- 6. Delete vault documents
    DELETE FROM vault_documents WHERE owner_id = user_id_to_delete;
    
    -- 7. Delete signature positions for user's signature requests
    DELETE FROM signature_positions WHERE signature_request_id IN (
        SELECT id FROM signature_requests WHERE sender_id = user_id_to_delete OR signer_id = user_id_to_delete
    );
    
    -- 8. Delete signature requests
    DELETE FROM signature_requests WHERE sender_id = user_id_to_delete OR signer_id = user_id_to_delete;
    
    -- 9. Delete invoices
    DELETE FROM invoices WHERE payer_id = user_id_to_delete OR payee_id = user_id_to_delete;
    
    -- 10. Delete alert matches
    DELETE FROM alert_matches WHERE alert_id IN (SELECT id FROM alerts WHERE user_id = user_id_to_delete);
    
    -- 11. Delete alerts
    DELETE FROM alerts WHERE user_id = user_id_to_delete;
    
    -- 12. Delete listings
    DELETE FROM listings WHERE user_id = user_id_to_delete;
    
    -- 13. Delete saved profiles and liked listings (user as subject)
    DELETE FROM saved_profiles WHERE user_id = user_id_to_delete OR profile_id = user_id_to_delete;
    DELETE FROM liked_listings WHERE user_id = user_id_to_delete;
    
    -- 14. Delete post-related data (comments, likes, saved posts)
    DELETE FROM saved_posts WHERE user_id = user_id_to_delete;
    DELETE FROM post_likes WHERE user_id = user_id_to_delete;
    DELETE FROM comment_likes WHERE user_id = user_id_to_delete;
    DELETE FROM comments WHERE user_id = user_id_to_delete;
    DELETE FROM posts WHERE user_id = user_id_to_delete;
    
    -- 15. Delete connections (both as sender and receiver)
    DELETE FROM connections WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
    
    -- 16. Delete messages
    DELETE FROM messages WHERE sender_id = user_id_to_delete OR receiver_id = user_id_to_delete;
    
    -- 17. Delete notifications
    DELETE FROM notifications WHERE user_id = user_id_to_delete OR sender_id = user_id_to_delete;
    
    -- 18. Delete support requests and bug reports
    DELETE FROM support_requests WHERE user_id = user_id_to_delete;
    DELETE FROM bug_reports WHERE user_id = user_id_to_delete;
    
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

-- Function to check what would be deleted (dry run)
CREATE OR REPLACE FUNCTION check_user_deletion_impact(user_id_to_check UUID)
RETURNS TABLE(table_name TEXT, record_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 'profiles'::TEXT, COUNT(*) FROM profiles WHERE id = user_id_to_check
    UNION ALL
    SELECT 'posts'::TEXT, COUNT(*) FROM posts WHERE user_id = user_id_to_check
    UNION ALL
    SELECT 'comments'::TEXT, COUNT(*) FROM comments WHERE user_id = user_id_to_check
    UNION ALL
    SELECT 'messages_sent'::TEXT, COUNT(*) FROM messages WHERE sender_id = user_id_to_check
    UNION ALL
    SELECT 'messages_received'::TEXT, COUNT(*) FROM messages WHERE receiver_id = user_id_to_check
    UNION ALL
    SELECT 'connections'::TEXT, COUNT(*) FROM connections WHERE sender_id = user_id_to_check OR receiver_id = user_id_to_check
    UNION ALL
    SELECT 'listings'::TEXT, COUNT(*) FROM listings WHERE user_id = user_id_to_check
    UNION ALL
    SELECT 'vault_documents'::TEXT, COUNT(*) FROM vault_documents WHERE owner_id = user_id_to_check
    UNION ALL
    SELECT 'invoices'::TEXT, COUNT(*) FROM invoices WHERE payer_id = user_id_to_check OR payee_id = user_id_to_check
    UNION ALL
    SELECT 'signature_requests'::TEXT, COUNT(*) FROM signature_requests WHERE sender_id = user_id_to_check OR signer_id = user_id_to_check
    UNION ALL
    SELECT 'escrow_transactions'::TEXT, COUNT(*) FROM escrow_transactions WHERE payer_id = user_id_to_check OR payee_id = user_id_to_check
    UNION ALL
    SELECT 'external_clients'::TEXT, COUNT(*) FROM external_clients WHERE user_id = user_id_to_check
    UNION ALL
    SELECT 'support_requests'::TEXT, COUNT(*) FROM support_requests WHERE user_id = user_id_to_check;
END;
$$ LANGUAGE plpgsql;

-- Example usage:
-- 
-- 1. Check what would be deleted:
-- SELECT * FROM check_user_deletion_impact('USER_ID_HERE');
--
-- 2. Actually delete the user:
-- SELECT delete_user_safely('USER_ID_HERE'); 