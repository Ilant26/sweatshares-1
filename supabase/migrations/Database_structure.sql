-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.connections (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid,
  receiver_id uuid,
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'rejected'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT connections_pkey PRIMARY KEY (id),
  CONSTRAINT connections_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id),
  CONSTRAINT connections_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.external_clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  company_name text,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  tax_id text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT external_clients_pkey PRIMARY KEY (id),
  CONSTRAINT external_clients_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.invoices (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_number text NOT NULL,
  sender_id uuid NOT NULL,
  receiver_id uuid,
  issue_date date NOT NULL,
  due_date date NOT NULL,
  amount numeric NOT NULL,
  currency text DEFAULT 'EUR'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'paid'::text, 'cancelled'::text])),
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  notes text,
  external_client_id uuid,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id),
  CONSTRAINT invoices_external_client_id_fkey FOREIGN KEY (external_client_id) REFERENCES public.external_clients(id)
);
CREATE TABLE public.listings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  profile_type text,
  listing_type text,
  funding_stage text,
  skills text,
  location_country text,
  location_city text,
  compensation_type text,
  compensation_value jsonb,
  amount text,
  sector text,
  end_date date,
  title text,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active'::text,
  CONSTRAINT listings_pkey PRIMARY KEY (id),
  CONSTRAINT listings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  sender_id uuid,
  receiver_id uuid,
  content text NOT NULL,
  read boolean DEFAULT false,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  type text CHECK (type = ANY (ARRAY['connection_request'::text, 'connection_response'::text, 'message'::text])),
  content text NOT NULL,
  sender_id uuid,
  read boolean DEFAULT false,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT notifications_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  username text NOT NULL UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  professional_role text,
  country text,
  languages ARRAY,
  phone_number text,
  email_notifications boolean DEFAULT true,
  two_factor_enabled boolean DEFAULT false,
  onboarding_completed boolean DEFAULT false,
  is_online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  profile_type character varying CHECK (profile_type::text = ANY (ARRAY['Founder'::character varying, 'Investor'::character varying, 'Expert'::character varying, 'Freelancer'::character varying, 'Consultant'::character varying]::text[])),
  is_external boolean DEFAULT false,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.vault_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  filename text NOT NULL,
  filepath text NOT NULL,
  description text,
  is_encrypted boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  type text,
  CONSTRAINT vault_documents_pkey PRIMARY KEY (id),
  CONSTRAINT vault_documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.vault_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  shared_with_id uuid NOT NULL,
  shared_at timestamp with time zone DEFAULT now(),
  shared_by_id uuid,
  CONSTRAINT vault_shares_pkey PRIMARY KEY (id),
  CONSTRAINT vault_shares_shared_by_id_fkey FOREIGN KEY (shared_by_id) REFERENCES auth.users(id),
  CONSTRAINT vault_shares_shared_with_id_fkey FOREIGN KEY (shared_with_id) REFERENCES public.profiles(id),
  CONSTRAINT vault_shares_document_id_fkey FOREIGN KEY (document_id) REFERENCES public.vault_documents(id)
);