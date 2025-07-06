-- Fix payment_method column in invoices table
-- Run this script to ensure all invoices have a proper payment_method

-- 1. Check current state of payment_method column
SELECT 
    'Current payment_method distribution:' as info,
    payment_method,
    COUNT(*) as count
FROM invoices 
GROUP BY payment_method
ORDER BY payment_method;

-- 2. Check for any NULL values
SELECT 
    'Invoices with NULL payment_method:' as info,
    COUNT(*) as count
FROM invoices 
WHERE payment_method IS NULL;

-- 3. Check invoices with escrow_transaction_id but wrong payment_method
SELECT 
    'Invoices with escrow_transaction_id but payment_method != escrow:' as info,
    COUNT(*) as count
FROM invoices 
WHERE escrow_transaction_id IS NOT NULL AND payment_method != 'escrow';

-- 4. Fix NULL payment_method values
UPDATE invoices 
SET payment_method = 'standard' 
WHERE payment_method IS NULL;

-- 5. Fix escrow invoices that have wrong payment_method
UPDATE invoices 
SET payment_method = 'escrow' 
WHERE escrow_transaction_id IS NOT NULL AND payment_method != 'escrow';

-- 6. Verify the fixes
SELECT 
    'After fixes - payment_method distribution:' as info,
    payment_method,
    COUNT(*) as count
FROM invoices 
GROUP BY payment_method
ORDER BY payment_method;

-- 7. Show sample of invoices with their payment methods
SELECT 
    id,
    invoice_number,
    payment_method,
    escrow_transaction_id,
    status,
    created_at
FROM invoices 
ORDER BY created_at DESC 
LIMIT 10; 