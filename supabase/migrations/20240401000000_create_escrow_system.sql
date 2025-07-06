-- Create escrow transactions table
CREATE TABLE escrow_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  stripe_connect_account_id text,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR',
  transaction_type text CHECK (transaction_type IN ('work', 'business_sale', 'partnership', 'service', 'consulting', 'investment', 'other')),
  status text CHECK (status IN ('pending', 'paid_in_escrow', 'work_completed', 'approved', 'revision_requested', 'disputed', 'released', 'refunded')),
  payer_id uuid REFERENCES profiles(id),
  payee_id uuid REFERENCES profiles(id),
  completion_deadline_days integer DEFAULT 30,
  review_period_days integer DEFAULT 7,
  completion_deadline_date timestamp with time zone,
  auto_release_date timestamp with time zone,
  completion_submitted_at timestamp with time zone,
  completion_approved_at timestamp with time zone,
  funds_released_at timestamp with time zone,
  dispute_reason text,
  transaction_description text,
  completion_proof jsonb DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create dispute resolution table
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

-- Create Stripe Connect accounts table
CREATE TABLE stripe_connect_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_account_id text NOT NULL UNIQUE,
  account_status text CHECK (account_status IN ('pending', 'active', 'restricted', 'disabled')),
  onboarding_completed boolean DEFAULT false,
  payouts_enabled boolean DEFAULT false,
  charges_enabled boolean DEFAULT false,
  user_type text CHECK (user_type IN ('Founder', 'Investor', 'Expert', 'Freelancer', 'Consultant')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add escrow-specific fields to invoices table
ALTER TABLE invoices ADD COLUMN escrow_transaction_id uuid REFERENCES escrow_transactions(id);
ALTER TABLE invoices ADD COLUMN completion_submitted boolean DEFAULT false;
ALTER TABLE invoices ADD COLUMN completion_approved boolean DEFAULT false;
ALTER TABLE invoices ADD COLUMN completion_deadline_days integer DEFAULT 30;
ALTER TABLE invoices ADD COLUMN review_period_days integer DEFAULT 7;
ALTER TABLE invoices ADD COLUMN auto_release_date timestamp with time zone;
ALTER TABLE invoices ADD COLUMN transaction_type text CHECK (transaction_type IN ('work', 'business_sale', 'partnership', 'service', 'consulting', 'investment', 'other'));

-- Create indexes for performance
CREATE INDEX idx_escrow_transactions_invoice_id ON escrow_transactions(invoice_id);
CREATE INDEX idx_escrow_transactions_payer_id ON escrow_transactions(payer_id);
CREATE INDEX idx_escrow_transactions_payee_id ON escrow_transactions(payee_id);
CREATE INDEX idx_escrow_transactions_status ON escrow_transactions(status);
CREATE INDEX idx_escrow_disputes_transaction_id ON escrow_disputes(escrow_transaction_id);
CREATE INDEX idx_stripe_connect_accounts_user_id ON stripe_connect_accounts(user_id);
CREATE INDEX idx_invoices_escrow_transaction_id ON invoices(escrow_transaction_id);

-- Add RLS policies for escrow_transactions
ALTER TABLE escrow_transactions ENABLE ROW LEVEL SECURITY;

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

-- Add RLS policies for escrow_disputes
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

-- Add RLS policies for stripe_connect_accounts
ALTER TABLE stripe_connect_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own connect accounts" ON stripe_connect_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own connect accounts" ON stripe_connect_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connect accounts" ON stripe_connect_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update escrow transaction timestamps
CREATE OR REPLACE FUNCTION update_escrow_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  -- Set completion deadline date when payment is made
  IF NEW.status = 'paid_in_escrow' AND OLD.status != 'paid_in_escrow' THEN
    NEW.completion_deadline_date = now() + (NEW.completion_deadline_days || ' days')::interval;
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
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for escrow transaction timestamps
CREATE TRIGGER update_escrow_timestamps_trigger
  BEFORE UPDATE ON escrow_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_escrow_timestamps();

-- Add comments for documentation
COMMENT ON TABLE escrow_transactions IS 'Stores escrow transaction details and status';
COMMENT ON TABLE escrow_disputes IS 'Stores dispute information for escrow transactions';
COMMENT ON TABLE stripe_connect_accounts IS 'Stores Stripe Connect account information for users';
COMMENT ON COLUMN escrow_transactions.completion_proof IS 'JSON object containing uploaded files, links, and completion notes';
COMMENT ON COLUMN escrow_transactions.auto_release_date IS 'Date when funds will be automatically released if no action taken'; 