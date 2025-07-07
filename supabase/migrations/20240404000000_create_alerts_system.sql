-- Create alerts system tables

-- Alerts table to store user alert configurations
CREATE TABLE public.alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    name text NOT NULL,
    alert_type text NOT NULL CHECK (alert_type IN ('profile', 'listing')),
    criteria jsonb NOT NULL,
    frequency text NOT NULL DEFAULT 'instant' CHECK (frequency IN ('instant', 'daily', 'weekly')),
    is_active boolean NOT NULL DEFAULT true,
    last_checked_at timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT alerts_pkey PRIMARY KEY (id),
    CONSTRAINT alerts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Alert matches table to store matched profiles/listings for each alert
CREATE TABLE public.alert_matches (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    alert_id uuid NOT NULL,
    matched_entity_id uuid NOT NULL,
    matched_entity_type text NOT NULL CHECK (matched_entity_type IN ('profile', 'listing')),
    match_score integer DEFAULT 100,
    notified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT alert_matches_pkey PRIMARY KEY (id),
    CONSTRAINT alert_matches_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE,
    CONSTRAINT alert_matches_unique UNIQUE (alert_id, matched_entity_id, matched_entity_type)
);

-- Alert notifications table to track notification history
CREATE TABLE public.alert_notifications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    alert_id uuid NOT NULL,
    user_id uuid NOT NULL,
    notification_type text NOT NULL CHECK (notification_type IN ('new_matches', 'no_matches', 'alert_created')),
    matches_count integer DEFAULT 0,
    email_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT alert_notifications_pkey PRIMARY KEY (id),
    CONSTRAINT alert_notifications_alert_id_fkey FOREIGN KEY (alert_id) REFERENCES public.alerts(id) ON DELETE CASCADE,
    CONSTRAINT alert_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes for better performance
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_active ON public.alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_alert_matches_alert_id ON public.alert_matches(alert_id);
CREATE INDEX idx_alert_matches_entity ON public.alert_matches(matched_entity_id, matched_entity_type);
CREATE INDEX idx_alert_notifications_user_id ON public.alert_notifications(user_id);
CREATE INDEX idx_alert_notifications_alert_id ON public.alert_notifications(alert_id);

-- RLS policies for alerts
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts" ON public.alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts" ON public.alerts
    FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for alert_matches
ALTER TABLE public.alert_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view matches for their alerts" ON public.alert_matches
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.alerts 
            WHERE alerts.id = alert_matches.alert_id 
            AND alerts.user_id = auth.uid()
        )
    );

-- RLS policies for alert_notifications
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alert notifications" ON public.alert_notifications
    FOR SELECT USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to match profiles against alerts
CREATE OR REPLACE FUNCTION public.match_profile_against_alerts(profile_id uuid)
RETURNS void AS $$
DECLARE
    alert_record RECORD;
    profile_record RECORD;
    criteria_match boolean;
    professional_role_criteria text[];
    skills_criteria text[];
    location_criteria text[];
BEGIN
    -- Get the profile data
    SELECT * INTO profile_record FROM public.profiles WHERE id = profile_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Loop through all active profile alerts
    FOR alert_record IN 
        SELECT * FROM public.alerts 
        WHERE alert_type = 'profile' AND is_active = true
    LOOP
        criteria_match := true;
        
        -- Check professional role criteria
        IF alert_record.criteria ? 'professional_roles' THEN
            professional_role_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'professional_roles'));
            IF profile_record.professional_role IS NULL OR 
               NOT (profile_record.professional_role = ANY(professional_role_criteria)) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- Check skills criteria
        IF criteria_match AND alert_record.criteria ? 'skills' THEN
            skills_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'skills'));
            IF profile_record.skills IS NULL OR 
               NOT (profile_record.skills && skills_criteria) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- Check location criteria
        IF criteria_match AND alert_record.criteria ? 'countries' THEN
            location_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'countries'));
            IF profile_record.country IS NULL OR 
               NOT (profile_record.country = ANY(location_criteria)) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- If all criteria match, create a match record
        IF criteria_match THEN
            INSERT INTO public.alert_matches (alert_id, matched_entity_id, matched_entity_type)
            VALUES (alert_record.id, profile_id, 'profile')
            ON CONFLICT (alert_id, matched_entity_id, matched_entity_type) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to match listings against alerts
CREATE OR REPLACE FUNCTION public.match_listing_against_alerts(listing_id uuid)
RETURNS void AS $$
DECLARE
    alert_record RECORD;
    listing_record RECORD;
    criteria_match boolean;
    listing_types_criteria text[];
    profile_types_criteria text[];
    skills_criteria text[];
    location_criteria text[];
    sectors_criteria text[];
BEGIN
    -- Get the listing data
    SELECT * INTO listing_record FROM public.listings WHERE id = listing_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- Loop through all active listing alerts
    FOR alert_record IN 
        SELECT * FROM public.alerts 
        WHERE alert_type = 'listing' AND is_active = true
    LOOP
        criteria_match := true;
        
        -- Check listing type criteria
        IF alert_record.criteria ? 'listing_types' THEN
            listing_types_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'listing_types'));
            IF listing_record.listing_type IS NULL OR 
               NOT (listing_record.listing_type = ANY(listing_types_criteria)) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- Check profile type criteria
        IF criteria_match AND alert_record.criteria ? 'profile_types' THEN
            profile_types_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'profile_types'));
            IF listing_record.profile_type IS NULL OR 
               NOT (listing_record.profile_type = ANY(profile_types_criteria)) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- Check skills criteria
        IF criteria_match AND alert_record.criteria ? 'skills' THEN
            skills_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'skills'));
            IF listing_record.skills IS NULL OR 
               NOT (listing_record.skills && skills_criteria) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- Check location criteria
        IF criteria_match AND alert_record.criteria ? 'countries' THEN
            location_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'countries'));
            IF listing_record.location_country IS NULL OR 
               NOT (listing_record.location_country = ANY(location_criteria)) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- Check sector criteria
        IF criteria_match AND alert_record.criteria ? 'sectors' THEN
            sectors_criteria := ARRAY(SELECT jsonb_array_elements_text(alert_record.criteria->'sectors'));
            IF listing_record.sector IS NULL OR 
               NOT (listing_record.sector = ANY(sectors_criteria)) THEN
                criteria_match := false;
            END IF;
        END IF;
        
        -- If all criteria match, create a match record
        IF criteria_match THEN
            INSERT INTO public.alert_matches (alert_id, matched_entity_id, matched_entity_type)
            VALUES (alert_record.id, listing_id, 'listing')
            ON CONFLICT (alert_id, matched_entity_id, matched_entity_type) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically check for matches when profiles or listings are updated
CREATE OR REPLACE FUNCTION public.trigger_profile_alert_matching()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger matching if relevant fields changed
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND (
           OLD.professional_role IS DISTINCT FROM NEW.professional_role OR
           OLD.skills IS DISTINCT FROM NEW.skills OR
           OLD.country IS DISTINCT FROM NEW.country
       )) THEN
        PERFORM public.match_profile_against_alerts(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.trigger_listing_alert_matching()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger matching if relevant fields changed
    IF TG_OP = 'INSERT' OR 
       (TG_OP = 'UPDATE' AND (
           OLD.listing_type IS DISTINCT FROM NEW.listing_type OR
           OLD.profile_type IS DISTINCT FROM NEW.profile_type OR
           OLD.skills IS DISTINCT FROM NEW.skills OR
           OLD.location_country IS DISTINCT FROM NEW.location_country OR
           OLD.sector IS DISTINCT FROM NEW.sector
       )) THEN
        PERFORM public.match_listing_against_alerts(NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER profile_alert_matching_trigger
    AFTER INSERT OR UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.trigger_profile_alert_matching();

CREATE TRIGGER listing_alert_matching_trigger
    AFTER INSERT OR UPDATE ON public.listings
    FOR EACH ROW EXECUTE FUNCTION public.trigger_listing_alert_matching(); 