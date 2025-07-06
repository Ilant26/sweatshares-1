-- Fix escrow invoice status based on escrow transaction status
-- This script updates invoices that have escrow transactions with 'funded' status to 'paid'

-- First, let's see the current state
SELECT 
    'Current escrow invoice status distribution:' as info,
    i.status as invoice_status,
    et.status as escrow_status,
    COUNT(*) as count
FROM invoices i
LEFT JOIN escrow_transactions et ON i.escrow_transaction_id = et.id
WHERE i.payment_method = 'escrow'
GROUP BY i.status, et.status
ORDER BY i.status, et.status;

-- Show invoices that should be updated
SELECT 
    'Invoices that need status update:' as info,
    i.id,
    i.invoice_number,
    i.status as invoice_status,
    et.status as escrow_status,
    et.stripe_payment_intent_id,
    i.created_at
FROM invoices i
LEFT JOIN escrow_transactions et ON i.escrow_transaction_id = et.id
WHERE i.payment_method = 'escrow' 
  AND i.status = 'pending'
  AND et.status = 'funded'
ORDER BY i.created_at DESC;

-- Update invoices that have funded escrow transactions but are still pending
UPDATE invoices 
SET 
    status = 'paid',
    updated_at = NOW()
WHERE id IN (
    SELECT i.id
    FROM invoices i
    JOIN escrow_transactions et ON i.escrow_transaction_id = et.id
    WHERE i.payment_method = 'escrow' 
      AND i.status = 'pending'
      AND et.status = 'funded'
);

-- Also update invoices that have a stripe_payment_intent_id but are still pending
UPDATE invoices 
SET 
    status = 'paid',
    updated_at = NOW()
WHERE id IN (
    SELECT i.id
    FROM invoices i
    JOIN escrow_transactions et ON i.escrow_transaction_id = et.id
    WHERE i.payment_method = 'escrow' 
      AND i.status = 'pending'
      AND et.stripe_payment_intent_id IS NOT NULL
      AND et.stripe_payment_intent_id != ''
);

-- Verify the updates
SELECT 
    'After updates - escrow invoice status distribution:' as info,
    i.status as invoice_status,
    et.status as escrow_status,
    COUNT(*) as count
FROM invoices i
LEFT JOIN escrow_transactions et ON i.escrow_transaction_id = et.id
WHERE i.payment_method = 'escrow'
GROUP BY i.status, et.status
ORDER BY i.status, et.status;

-- Show updated invoices
SELECT 
    'Updated invoices:' as info,
    i.id,
    i.invoice_number,
    i.status as invoice_status,
    et.status as escrow_status,
    et.stripe_payment_intent_id,
    i.updated_at
FROM invoices i
LEFT JOIN escrow_transactions et ON i.escrow_transaction_id = et.id
WHERE i.payment_method = 'escrow' 
  AND i.status = 'paid'
  AND i.updated_at >= NOW() - INTERVAL '1 hour'
ORDER BY i.updated_at DESC; 