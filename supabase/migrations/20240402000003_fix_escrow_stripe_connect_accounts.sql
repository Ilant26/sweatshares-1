-- Fix existing escrow transactions by linking them to the correct Stripe Connect accounts
-- This migration updates escrow_transactions.stripe_connect_account_id with the stripe_account_id
-- from stripe_connect_accounts table based on the payee_id

UPDATE escrow_transactions 
SET stripe_connect_account_id = sca.stripe_account_id
FROM stripe_connect_accounts sca
WHERE escrow_transactions.payee_id = sca.user_id 
  AND sca.account_status = 'active' 
  AND sca.onboarding_completed = true
  AND escrow_transactions.stripe_connect_account_id IS NULL;

-- Add a comment to document what this migration does
COMMENT ON COLUMN escrow_transactions.stripe_connect_account_id IS 'Stripe Connect account ID of the payee (person receiving payment)'; 