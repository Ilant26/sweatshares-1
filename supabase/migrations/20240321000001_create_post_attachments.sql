-- Create an enum for attachment types
CREATE TYPE public.attachment_type AS ENUM ('image', 'video', 'document');

-- Create post_attachments table
CREATE TABLE public.post_attachments (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    post_id uuid NOT NULL,
    file_path text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    content_type text NOT NULL,
    type attachment_type NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT post_attachments_pkey PRIMARY KEY (id),
    CONSTRAINT post_attachments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

-- Post attachments policies
CREATE POLICY "Users can view all post attachments" ON public.post_attachments
    FOR SELECT USING (true);

CREATE POLICY "Users can create attachments for their posts" ON public.post_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_attachments.post_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete attachments from their posts" ON public.post_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.posts
            WHERE id = post_attachments.post_id
            AND user_id = auth.uid()
        )
    );

-- Create storage buckets for different file types
-- Note: This needs to be run with appropriate permissions
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-attachments', 'post-attachments', true);

-- Storage policies will be managed through the Supabase dashboard 