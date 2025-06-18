-- Create saved_profiles table
CREATE TABLE public.saved_profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT saved_profiles_pkey PRIMARY KEY (id),
    CONSTRAINT saved_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT saved_profiles_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT saved_profiles_unique UNIQUE (user_id, profile_id)
);

-- Create liked_listings table
CREATE TABLE public.liked_listings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    listing_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT liked_listings_pkey PRIMARY KEY (id),
    CONSTRAINT liked_listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT liked_listings_listing_id_fkey FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE,
    CONSTRAINT liked_listings_unique UNIQUE (user_id, listing_id)
);

-- Add RLS policies
ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.liked_listings ENABLE ROW LEVEL SECURITY;

-- Saved profiles policies
CREATE POLICY "Users can view their saved profiles" ON public.saved_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save profiles" ON public.saved_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave profiles" ON public.saved_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Liked listings policies
CREATE POLICY "Users can view their liked listings" ON public.liked_listings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can like listings" ON public.liked_listings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike listings" ON public.liked_listings
    FOR DELETE USING (auth.uid() = user_id); 