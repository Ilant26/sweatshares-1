-- Create deals table
CREATE TABLE public.deals (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    listing_id uuid NOT NULL,
    buyer_id uuid NOT NULL,
    seller_id uuid NOT NULL,
    amount numeric NOT NULL,
    currency text DEFAULT 'USD',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'counter_offered', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
    description text,
    terms text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    accepted_at timestamp with time zone,
    completed_at timestamp with time zone,
    stripe_payment_intent_id text,
    stripe_connect_account_id text,
    CONSTRAINT deals_pkey PRIMARY KEY (id),
    CONSTRAINT deals_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    CONSTRAINT deals_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES public.profiles(id),
    CONSTRAINT deals_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id)
);

-- Create deal_offers table for counter offers
CREATE TABLE public.deal_offers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL,
    offered_by_id uuid NOT NULL,
    amount numeric NOT NULL,
    message text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT deal_offers_pkey PRIMARY KEY (id),
    CONSTRAINT deal_offers_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE,
    CONSTRAINT deal_offers_offered_by_id_fkey FOREIGN KEY (offered_by_id) REFERENCES public.profiles(id)
);

-- Create deal_messages table for deal communication
CREATE TABLE public.deal_messages (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL,
    sender_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT deal_messages_pkey PRIMARY KEY (id),
    CONSTRAINT deal_messages_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE,
    CONSTRAINT deal_messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);

-- Create deal_deliverables table for tracking deliverables
CREATE TABLE public.deal_deliverables (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    deal_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'rejected')),
    file_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    completed_at timestamp with time zone,
    CONSTRAINT deal_deliverables_pkey PRIMARY KEY (id),
    CONSTRAINT deal_deliverables_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_deliverables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for deals
CREATE POLICY "Users can view deals they are involved in" ON public.deals
    FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Users can create deals" ON public.deals
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update deals they are involved in" ON public.deals
    FOR UPDATE USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- RLS Policies for deal_offers
CREATE POLICY "Users can view offers for deals they are involved in" ON public.deal_offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.deals 
            WHERE deals.id = deal_offers.deal_id 
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can create offers for deals they are involved in" ON public.deal_offers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.deals 
            WHERE deals.id = deal_offers.deal_id 
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

-- RLS Policies for deal_messages
CREATE POLICY "Users can view messages for deals they are involved in" ON public.deal_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.deals 
            WHERE deals.id = deal_messages.deal_id 
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can create messages for deals they are involved in" ON public.deal_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.deals 
            WHERE deals.id = deal_messages.deal_id 
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

-- RLS Policies for deal_deliverables
CREATE POLICY "Users can view deliverables for deals they are involved in" ON public.deal_deliverables
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.deals 
            WHERE deals.id = deal_deliverables.deal_id 
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can create deliverables for deals they are involved in" ON public.deal_deliverables
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.deals 
            WHERE deals.id = deal_deliverables.deal_id 
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

CREATE POLICY "Users can update deliverables for deals they are involved in" ON public.deal_deliverables
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.deals 
            WHERE deals.id = deal_deliverables.deal_id 
            AND (deals.buyer_id = auth.uid() OR deals.seller_id = auth.uid())
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_deals_buyer_id ON public.deals(buyer_id);
CREATE INDEX idx_deals_seller_id ON public.deals(seller_id);
CREATE INDEX idx_deals_listing_id ON public.deals(listing_id);
CREATE INDEX idx_deals_status ON public.deals(status);
CREATE INDEX idx_deal_offers_deal_id ON public.deal_offers(deal_id);
CREATE INDEX idx_deal_messages_deal_id ON public.deal_messages(deal_id);
CREATE INDEX idx_deal_deliverables_deal_id ON public.deal_deliverables(deal_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_deliverables_updated_at BEFORE UPDATE ON public.deal_deliverables
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 