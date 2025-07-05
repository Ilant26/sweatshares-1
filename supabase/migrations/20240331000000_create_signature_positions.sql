-- Create signature_positions table
CREATE TABLE IF NOT EXISTS signature_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_request_id UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  x_position INTEGER NOT NULL,
  y_position INTEGER NOT NULL,
  width INTEGER NOT NULL DEFAULT 150,
  height INTEGER NOT NULL DEFAULT 50,
  field_type TEXT NOT NULL CHECK (field_type IN ('signature', 'date', 'text', 'checkbox')),
  field_label TEXT,
  required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_signature_positions_request_id ON signature_positions(signature_request_id);

-- Enable RLS
ALTER TABLE signature_positions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view signature positions for requests they sent or received" ON signature_positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_positions.signature_request_id
      AND (sr.sender_id = auth.uid() OR sr.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert signature positions for requests they sent" ON signature_positions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_positions.signature_request_id
      AND sr.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can update signature positions for requests they sent" ON signature_positions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_positions.signature_request_id
      AND sr.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete signature positions for requests they sent" ON signature_positions
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_positions.signature_request_id
      AND sr.sender_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_signature_positions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_signature_positions_updated_at
  BEFORE UPDATE ON signature_positions
  FOR EACH ROW
  EXECUTE FUNCTION update_signature_positions_updated_at(); 