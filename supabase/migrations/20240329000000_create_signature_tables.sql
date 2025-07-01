-- Create signature requests table
CREATE TABLE signature_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES vault_documents(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined', 'expired')),
  message TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  signature_data JSONB, -- Store signature coordinates, image data, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create signature positions table to store where signatures should be placed
CREATE TABLE signature_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  signature_request_id UUID NOT NULL REFERENCES signature_requests(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  x_position DECIMAL NOT NULL,
  y_position DECIMAL NOT NULL,
  width DECIMAL NOT NULL,
  height DECIMAL NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'signature' CHECK (field_type IN ('signature', 'date', 'text', 'checkbox')),
  field_label TEXT,
  required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_signature_requests_sender_id ON signature_requests(sender_id);
CREATE INDEX idx_signature_requests_receiver_id ON signature_requests(receiver_id);
CREATE INDEX idx_signature_requests_document_id ON signature_requests(document_id);
CREATE INDEX idx_signature_requests_status ON signature_requests(status);
CREATE INDEX idx_signature_positions_request_id ON signature_positions(signature_request_id);

-- Enable RLS
ALTER TABLE signature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE signature_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for signature_requests
CREATE POLICY "Users can view signature requests they sent or received" ON signature_requests
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

CREATE POLICY "Users can create signature requests" ON signature_requests
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id
  );

CREATE POLICY "Users can update signature requests they received" ON signature_requests
  FOR UPDATE USING (
    auth.uid() = receiver_id
  );

-- RLS Policies for signature_positions
CREATE POLICY "Users can view signature positions for requests they have access to" ON signature_positions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_positions.signature_request_id
      AND (sr.sender_id = auth.uid() OR sr.receiver_id = auth.uid())
    )
  );

CREATE POLICY "Users can create signature positions for their requests" ON signature_positions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_positions.signature_request_id
      AND sr.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can update signature positions for requests they received" ON signature_positions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM signature_requests sr
      WHERE sr.id = signature_positions.signature_request_id
      AND sr.receiver_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_signature_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_signature_requests_updated_at
  BEFORE UPDATE ON signature_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_signature_requests_updated_at(); 