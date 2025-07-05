-- Add original PDF dimensions to signature_positions table
ALTER TABLE signature_positions 
ADD COLUMN original_pdf_width DECIMAL(10,2),
ADD COLUMN original_pdf_height DECIMAL(10,2);

-- Add comments to explain the new columns
COMMENT ON COLUMN signature_positions.original_pdf_width IS 'The original width of the PDF page in points';
COMMENT ON COLUMN signature_positions.original_pdf_height IS 'The original height of the PDF page in points'; 