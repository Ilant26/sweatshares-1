-- Create listing_responses table
CREATE TABLE public.listing_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  responder_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_escrow', 'completed', 'disputed', 'cancelled')),
  type text NOT NULL,
  message text NOT NULL,
  proposed_amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  terms text,
  attachments jsonb DEFAULT '[]',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT listing_responses_pkey PRIMARY KEY (id),
  CONSTRAINT listing_responses_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
  CONSTRAINT listing_responses_responder_id_fkey FOREIGN KEY (responder_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create escrow_transactions table
CREATE TABLE public.escrow_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'USD',
  stripe_payment_intent_id text,
  stripe_connect_account_id text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'funded', 'released', 'refunded', 'disputed')),
  platform_fee numeric NOT NULL,
  seller_amount numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT escrow_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT escrow_transactions_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.listing_responses(id) ON DELETE CASCADE,
  CONSTRAINT escrow_transactions_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id),
  CONSTRAINT escrow_transactions_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id)
);

-- Create escrow_releases table for tracking release history
CREATE TABLE public.escrow_releases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid NOT NULL,
  released_by_id uuid NOT NULL,
  release_type text NOT NULL CHECK (release_type IN ('full', 'partial', 'refund')),
  amount numeric NOT NULL,
  reason text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT escrow_releases_pkey PRIMARY KEY (id),
  CONSTRAINT escrow_releases_escrow_transaction_id_fkey FOREIGN KEY (escrow_transaction_id) REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  CONSTRAINT escrow_releases_released_by_id_fkey FOREIGN KEY (released_by_id) REFERENCES public.profiles(id)
);

-- Create response_messages table for communication
CREATE TABLE public.response_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT response_messages_pkey PRIMARY KEY (id),
  CONSTRAINT response_messages_response_id_fkey FOREIGN KEY (response_id) REFERENCES public.listing_responses(id) ON DELETE CASCADE,
  CONSTRAINT response_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);

-- Add indexes for better performance
CREATE INDEX idx_listing_responses_listing_id ON public.listing_responses(listing_id);
CREATE INDEX idx_listing_responses_responder_id ON public.listing_responses(responder_id);
CREATE INDEX idx_listing_responses_status ON public.listing_responses(status);
CREATE INDEX idx_escrow_transactions_response_id ON public.escrow_transactions(response_id);
CREATE INDEX idx_escrow_transactions_buyer_id ON public.escrow_transactions(buyer_id);
CREATE INDEX idx_escrow_transactions_seller_id ON public.escrow_transactions(seller_id);
CREATE INDEX idx_escrow_transactions_status ON public.escrow_transactions(status);
CREATE INDEX idx_response_messages_response_id ON public.response_messages(response_id);

-- Enable Row Level Security
ALTER TABLE public.listing_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_releases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.response_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for listing_responses
CREATE POLICY "Users can view responses to their own listings" ON public.listing_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE listings.id = listing_responses.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own responses" ON public.listing_responses
  FOR SELECT USING (responder_id = auth.uid());

CREATE POLICY "Users can create responses" ON public.listing_responses
  FOR INSERT WITH CHECK (responder_id = auth.uid());

CREATE POLICY "Listing owners can update response status" ON public.listing_responses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.listings 
      WHERE listings.id = listing_responses.listing_id 
      AND listings.user_id = auth.uid()
    )
  );

-- RLS Policies for escrow_transactions
CREATE POLICY "Users can view their escrow transactions" ON public.escrow_transactions
  FOR SELECT USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Users can create escrow transactions" ON public.escrow_transactions
  FOR INSERT WITH CHECK (buyer_id = auth.uid());

-- RLS Policies for escrow_releases
CREATE POLICY "Users can view releases for their transactions" ON public.escrow_releases
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.escrow_transactions 
      WHERE escrow_transactions.id = escrow_releases.escrow_transaction_id 
      AND (escrow_transactions.buyer_id = auth.uid() OR escrow_transactions.seller_id = auth.uid())
    )
  );

CREATE POLICY "Authorized users can create releases" ON public.escrow_releases
  FOR INSERT WITH CHECK (released_by_id = auth.uid());

-- RLS Policies for response_messages
CREATE POLICY "Users can view messages for responses they're involved in" ON public.response_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.listing_responses 
      WHERE listing_responses.id = response_messages.response_id 
      AND (
        listing_responses.responder_id = auth.uid() 
        OR EXISTS (
          SELECT 1 FROM public.listings 
          WHERE listings.id = listing_responses.listing_id 
          AND listings.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can send messages to responses they're involved in" ON public.response_messages
  FOR INSERT WITH CHECK (sender_id = auth.uid());

-- Add updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_listing_responses_updated_at BEFORE UPDATE ON public.listing_responses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_escrow_transactions_updated_at BEFORE UPDATE ON public.escrow_transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 