-- Add the missing type column to escrow_documents table
ALTER TABLE public.escrow_documents 
ADD COLUMN IF NOT EXISTS type text;

-- Add the missing file_type column if it doesn't exist
ALTER TABLE public.escrow_documents 
ADD COLUMN IF NOT EXISTS file_type text;

-- Add the missing file_size column if it doesn't exist
ALTER TABLE public.escrow_documents 
ADD COLUMN IF NOT EXISTS file_size bigint;

-- Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'escrow_documents' 
AND table_schema = 'public'
ORDER BY ordinal_position; 