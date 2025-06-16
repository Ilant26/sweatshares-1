-- Create the update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create external_clients table
CREATE TABLE external_clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT,
    contact_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    tax_id TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add external_client_id to invoices table
ALTER TABLE invoices 
ADD COLUMN external_client_id UUID REFERENCES external_clients(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE external_clients ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own external clients"
    ON external_clients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own external clients"
    ON external_clients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own external clients"
    ON external_clients FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own external clients"
    ON external_clients FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON external_clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 