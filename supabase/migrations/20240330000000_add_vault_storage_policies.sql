-- Add storage policies for vault bucket
-- These policies allow users to upload and download files in their own folder

-- Policy for SELECT (Download) - Users can download files in their own folder
CREATE POLICY "Users can download their own vault files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for INSERT (Upload) - Users can upload files to their own folder
CREATE POLICY "Users can upload to their own vault folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for UPDATE - Users can update files in their own folder
CREATE POLICY "Users can update their own vault files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy for DELETE - Users can delete files in their own folder
CREATE POLICY "Users can delete their own vault files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'vault' AND
    (storage.foldername(name))[1] = auth.uid()::text
); 