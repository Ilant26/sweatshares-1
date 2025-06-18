-- Add company column to profiles table
-- This migration adds the company column (skills column already exists)

ALTER TABLE public.profiles 
ADD COLUMN company text;

-- Add comment to document the column
COMMENT ON COLUMN public.profiles.company IS 'User company or organization name'; 