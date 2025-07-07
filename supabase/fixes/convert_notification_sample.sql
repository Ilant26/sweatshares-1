-- Convert the sample notification data to the new schema format
-- Original format: content, sender_id
-- New format: title, description, data (with sender_id in JSON)

-- Example of converting the provided sample data:
-- Original: 'sent you a connection request', sender_id as column
-- New: title, description, and sender_id in data JSON

INSERT INTO "public"."notifications" (
  "id", 
  "created_at", 
  "user_id", 
  "type", 
  "title",
  "description",
  "data",
  "read",
  "connection_id"
) VALUES (
  '0a2729d1-427b-4d06-8853-c666cfc78b35', 
  '2025-06-14 18:30:02.531325+00', 
  '1283b60b-2ebf-4924-9e37-e594c73b62ac', 
  'connection_request', 
  'New connection request',
  'Someone sent you a connection request',
  jsonb_build_object('sender_id', 'b605fac4-dc41-4faf-865d-79bc6ff5619f'),
  'false',
  null -- You would need to find the actual connection_id if available
);

-- If you have the old format data and want to convert it:
-- UPDATE notifications 
-- SET 
--   title = CASE 
--     WHEN type = 'connection_request' THEN 'New connection request'
--     WHEN type = 'connection_accepted' THEN 'Connection accepted'
--     ELSE 'Notification'
--   END,
--   description = content,
--   data = jsonb_build_object('sender_id', sender_id)
-- WHERE title IS NULL; 