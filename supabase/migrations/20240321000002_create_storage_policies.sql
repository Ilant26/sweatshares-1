-- Policy for SELECT (Download)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-attachments');

-- Policy for INSERT (Upload)
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'post-attachments' AND
    (storage.foldername(name))[1] IN ('images', 'videos', 'documents')
);

-- Policy for DELETE
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'post-attachments' AND
    auth.uid() = owner::uuid
);