-- Make stripe_payment_intent_id nullable in escrow_transactions
ALTER TABLE escrow_transactions ALTER COLUMN stripe_payment_intent_id DROP NOT NULL; 