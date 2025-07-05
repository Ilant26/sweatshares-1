-- Add scale column to signature_positions table
ALTER TABLE signature_positions 
ADD COLUMN scale DECIMAL(5,2) NOT NULL DEFAULT 1.5;

-- Add comment to explain the scale column
COMMENT ON COLUMN signature_positions.scale IS 'The scale factor used when positioning the signature box in the frontend PDF viewer';

-- Update existing records to have the default scale
UPDATE signature_positions SET scale = 1.5 WHERE scale IS NULL; 