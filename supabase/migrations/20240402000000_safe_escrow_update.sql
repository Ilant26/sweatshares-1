-- Safe update to escrow system tables
-- This migration updates existing tables without dropping them

-- Update escrow_transactions table structure
DO $$
BEGIN
    -- Add missing columns to escrow_transactions if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_transactions' AND column_name = 'stripe_transfer_id') THEN
        ALTER TABLE escrow_transactions ADD COLUMN stripe_transfer_id text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_transactions' AND column_name = 'payment_status') THEN
        ALTER TABLE escrow_transactions ADD COLUMN payment_status text CHECK (payment_status IN ('pending', 'completed', 'failed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_transactions' AND column_name = 'transfer_status') THEN
        ALTER TABLE escrow_transactions ADD COLUMN transfer_status text CHECK (transfer_status IN ('pending', 'completed', 'failed'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_transactions' AND column_name = 'transfer_failure_reason') THEN
        ALTER TABLE escrow_transactions ADD COLUMN transfer_failure_reason text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_transactions' AND column_name = 'funded_at') THEN
        ALTER TABLE escrow_transactions ADD COLUMN funded_at timestamp with time zone;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'escrow_transactions' AND column_name = 'transferred_at') THEN
        ALTER TABLE escrow_transactions ADD COLUMN transferred_at timestamp with time zone;
    END IF;
    
    -- Update status enum if needed (this might require recreating the table, but let's try to avoid that)
    -- For now, we'll just ensure the columns exist and handle the status values in the application
    
END $$;

-- Update status constraints to allow new status values
DO $$
BEGIN
    -- Try to drop and recreate the status constraint to allow new values
    BEGIN
        ALTER TABLE escrow_transactions DROP CONSTRAINT IF EXISTS escrow_transactions_status_check;
        ALTER TABLE escrow_transactions ADD CONSTRAINT escrow_transactions_status_check 
            CHECK (status IN ('pending', 'pending_payment', 'funded', 'work_completed', 'approved', 'revision_requested', 'disputed', 'released', 'refunded', 'payment_failed'));
    EXCEPTION WHEN OTHERS THEN
        -- If constraint doesn't exist or can't be dropped, continue
        NULL;
    END;
END $$;

-- Ensure indexes exist
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_invoice_id ON escrow_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_payer_id ON escrow_transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_payee_id ON escrow_transactions(payee_id);
CREATE INDEX IF NOT EXISTS idx_escrow_transactions_status ON escrow_transactions(status);

-- Update or create the timestamp function
CREATE OR REPLACE FUNCTION update_escrow_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set completion deadline date when payment is made
    IF NEW.status = 'funded' AND OLD.status != 'funded' THEN
        NEW.completion_deadline_date = now() + (NEW.completion_deadline_days || ' days')::interval;
        NEW.funded_at = now();
    END IF;
    
    -- Set auto release date when work is completed
    IF NEW.status = 'work_completed' AND OLD.status != 'work_completed' THEN
        NEW.completion_submitted_at = now();
        NEW.auto_release_date = now() + (NEW.review_period_days || ' days')::interval;
    END IF;
    
    -- Set completion approved date when approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.completion_approved_at = now();
        NEW.funds_released_at = now();
    END IF;
    
    -- Set transfer timestamp when transfer is completed
    IF NEW.transfer_status = 'completed' AND OLD.transfer_status != 'completed' THEN
        NEW.transferred_at = now();
    END IF;
    
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger
DROP TRIGGER IF EXISTS update_escrow_timestamps_trigger ON escrow_transactions;
CREATE TRIGGER update_escrow_timestamps_trigger
    BEFORE UPDATE ON escrow_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_escrow_timestamps();

-- Ensure RLS is enabled and policies exist
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them
DROP POLICY IF EXISTS "Users can view their own escrow transactions" ON escrow_transactions;
DROP POLICY IF EXISTS "Users can create escrow transactions" ON escrow_transactions;
DROP POLICY IF EXISTS "Users can update their own escrow transactions" ON escrow_transactions;

CREATE POLICY "Users can view their own escrow transactions" ON escrow_transactions
    FOR SELECT USING (
        auth.uid() = payer_id OR auth.uid() = payee_id
    );

CREATE POLICY "Users can create escrow transactions" ON escrow_transactions
    FOR INSERT WITH CHECK (
        auth.uid() = payee_id
    );

CREATE POLICY "Users can update their own escrow transactions" ON escrow_transactions
    FOR UPDATE USING (
        auth.uid() = payer_id OR auth.uid() = payee_id
    );

-- Handle escrow_disputes table
DO $$
BEGIN
    -- Create escrow_disputes table if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'escrow_disputes') THEN
        CREATE TABLE escrow_disputes (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            escrow_transaction_id uuid REFERENCES escrow_transactions(id) ON DELETE CASCADE,
            disputer_id uuid REFERENCES profiles(id),
            reason text NOT NULL,
            evidence text,
            status text CHECK (status IN ('open', 'under_review', 'resolved_for_payer', 'resolved_for_payee')),
            resolution_notes text,
            created_at timestamp with time zone DEFAULT now(),
            resolved_at timestamp with time zone
        );
        
        CREATE INDEX idx_escrow_disputes_transaction_id ON escrow_disputes(escrow_transaction_id);
        
        ALTER TABLE escrow_disputes ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view disputes they're involved in" ON escrow_disputes
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM escrow_transactions 
                    WHERE escrow_transactions.id = escrow_disputes.escrow_transaction_id 
                    AND (escrow_transactions.payer_id = auth.uid() OR escrow_transactions.payee_id = auth.uid())
                )
            );

        CREATE POLICY "Users can create disputes for their transactions" ON escrow_disputes
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM escrow_transactions 
                    WHERE escrow_transactions.id = escrow_disputes.escrow_transaction_id 
                    AND (escrow_transactions.payer_id = auth.uid() OR escrow_transactions.payee_id = auth.uid())
                )
            );
    END IF;
END $$; 