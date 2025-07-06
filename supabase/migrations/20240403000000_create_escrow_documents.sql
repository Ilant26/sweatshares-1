-- Create escrow_documents table for document management in escrow transactions
CREATE TABLE public.escrow_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  escrow_transaction_id uuid NOT NULL,
  uploaded_by_id uuid NOT NULL,
  filename text NOT NULL,
  filepath text NOT NULL,
  description text,
  type text,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT escrow_documents_pkey PRIMARY KEY (id),
  CONSTRAINT escrow_documents_escrow_transaction_id_fkey FOREIGN KEY (escrow_transaction_id) REFERENCES public.escrow_transactions(id) ON DELETE CASCADE,
  CONSTRAINT escrow_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES public.profiles(id)
);

-- Add indexes for better performance
CREATE INDEX idx_escrow_documents_transaction_id ON public.escrow_documents(escrow_transaction_id);
CREATE INDEX idx_escrow_documents_uploaded_by ON public.escrow_documents(uploaded_by_id);
CREATE INDEX idx_escrow_documents_created_at ON public.escrow_documents(created_at);

-- Add RLS policies for escrow documents
ALTER TABLE public.escrow_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view documents for escrow transactions they're involved in
CREATE POLICY "Users can view escrow documents they're involved in"
ON public.escrow_documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.escrow_transactions et
    WHERE et.id = escrow_documents.escrow_transaction_id
    AND (et.payer_id = auth.uid() OR et.payee_id = auth.uid())
  )
);

-- Policy: Users can insert documents for escrow transactions they're involved in
CREATE POLICY "Users can upload documents to escrow transactions they're involved in"
ON public.escrow_documents FOR INSERT
TO authenticated
WITH CHECK (
  uploaded_by_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.escrow_transactions et
    WHERE et.id = escrow_documents.escrow_transaction_id
    AND (et.payer_id = auth.uid() OR et.payee_id = auth.uid())
  )
);

-- Policy: Users can update documents they uploaded
CREATE POLICY "Users can update documents they uploaded"
ON public.escrow_documents FOR UPDATE
TO authenticated
USING (uploaded_by_id = auth.uid())
WITH CHECK (uploaded_by_id = auth.uid());

-- Policy: Users can delete documents they uploaded
CREATE POLICY "Users can delete documents they uploaded"
ON public.escrow_documents FOR DELETE
TO authenticated
USING (uploaded_by_id = auth.uid());

-- Add storage policies for escrow documents bucket
-- Create the escrow-documents bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('escrow-documents', 'escrow-documents', false, 10485760, ARRAY['application/pdf', 'image/*', 'text/*', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/zip', 'application/x-zip-compressed'])
ON CONFLICT (id) DO NOTHING;

-- Policy for SELECT (Download) - Users can download files for escrow transactions they're involved in
CREATE POLICY "Users can download escrow document files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'escrow-documents' AND
  EXISTS (
    SELECT 1 FROM public.escrow_documents ed
    JOIN public.escrow_transactions et ON ed.escrow_transaction_id = et.id
    WHERE ed.filepath = storage.objects.name
    AND (et.payer_id = auth.uid() OR et.payee_id = auth.uid())
  )
);

-- Policy for INSERT (Upload) - Users can upload files for escrow transactions they're involved in
CREATE POLICY "Users can upload escrow document files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'escrow-documents' AND
  EXISTS (
    SELECT 1 FROM public.escrow_transactions et
    WHERE et.id = (
      SELECT escrow_transaction_id FROM public.escrow_documents 
      WHERE filepath = storage.objects.name
    )
    AND (et.payer_id = auth.uid() OR et.payee_id = auth.uid())
  )
);

-- Policy for UPDATE - Users can update files they uploaded
CREATE POLICY "Users can update escrow document files they uploaded"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'escrow-documents' AND
  EXISTS (
    SELECT 1 FROM public.escrow_documents ed
    WHERE ed.filepath = storage.objects.name
    AND ed.uploaded_by_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'escrow-documents' AND
  EXISTS (
    SELECT 1 FROM public.escrow_documents ed
    WHERE ed.filepath = storage.objects.name
    AND ed.uploaded_by_id = auth.uid()
  )
);

-- Policy for DELETE - Users can delete files they uploaded
CREATE POLICY "Users can delete escrow document files they uploaded"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'escrow-documents' AND
  EXISTS (
    SELECT 1 FROM public.escrow_documents ed
    WHERE ed.filepath = storage.objects.name
    AND ed.uploaded_by_id = auth.uid()
  )
);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_escrow_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_escrow_documents_updated_at
  BEFORE UPDATE ON public.escrow_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_escrow_documents_updated_at(); 