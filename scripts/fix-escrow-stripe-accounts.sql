-- Fix existing escrow transactions by linking them to the correct Stripe Connect accounts
-- Run this script in your Supabase SQL Editor

-- Update escrow_transactions with the correct Stripe Connect account IDs
UPDATE escrow_transactions 
SET stripe_connect_account_id = sca.stripe_account_id
FROM stripe_connect_accounts sca
WHERE escrow_transactions.payee_id = sca.user_id 
  AND sca.account_status = 'active' 
  AND sca.onboarding_completed = true
  AND escrow_transactions.stripe_connect_account_id IS NULL;

-- Verify the update worked
SELECT 
  et.id as escrow_transaction_id,
  et.payee_id,
  et.stripe_connect_account_id,
  sca.stripe_account_id,
  sca.account_status,
  sca.onboarding_completed
FROM escrow_transactions et
LEFT JOIN stripe_connect_accounts sca ON et.payee_id = sca.user_id
WHERE et.stripe_connect_account_id IS NOT NULL
ORDER BY et.created_at DESC; 