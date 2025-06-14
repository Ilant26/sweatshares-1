-- Update the description column to handle HTML content
ALTER TABLE listings 
ALTER COLUMN description TYPE TEXT; 