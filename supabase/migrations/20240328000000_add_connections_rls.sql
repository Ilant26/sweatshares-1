-- Enable RLS on connections table
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Policy for connections: Users can view connections they are part of
CREATE POLICY "Users can view their connections" ON public.connections
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Policy for connections: Users can create connection requests
CREATE POLICY "Users can create connections" ON public.connections
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy for connections: Users can update connections they are part of
CREATE POLICY "Users can update their connections" ON public.connections
    FOR UPDATE USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Policy for connections: Users can delete connections they are part of
CREATE POLICY "Users can delete their connections" ON public.connections
    FOR DELETE USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    ); 