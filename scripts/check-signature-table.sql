-- Check signature_requests table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'signature_requests' 
ORDER BY ordinal_position;

-- Check signature_positions table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'signature_positions' 
ORDER BY ordinal_position;

-- Check what data exists in signature_requests
SELECT * FROM signature_requests LIMIT 5;

-- Check what data exists in signature_positions
SELECT * FROM signature_positions LIMIT 5; 