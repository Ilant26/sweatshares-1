-- Verify that the 3 users have been deleted
SELECT 
    id,
    full_name,
    professional_role,
    CASE 
        WHEN id IS NOT NULL THEN 'STILL EXISTS'
        ELSE 'DELETED'
    END as status
FROM profiles 
WHERE id IN (
    '92052d4f-30bc-489d-94d5-8b90c9e2770c',
    '9ea51711-0df3-4b6a-91aa-10d31e4d6965',
    '23c6de3d-dcfa-4570-afe9-5e0c11ffb5ab'
);

-- Also check total user count
SELECT COUNT(*) as total_users FROM profiles; 