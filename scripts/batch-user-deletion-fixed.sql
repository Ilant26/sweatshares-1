-- Batch User Deletion Script - CORRECTED VERSION
-- Use this AFTER running the corrected safe-user-deletion-fixed.sql script

-- Step 1: Check impact for all users first
SELECT 'User: 6faa0c0e-b972-4d24-bfbc-abe10c16a77a' as user_info, * FROM check_user_deletion_impact('6faa0c0e-b972-4d24-bfbc-abe10c16a77a');
SELECT 'User: 59828abb-2e61-45d7-87df-fa3620966dbb' as user_info, * FROM check_user_deletion_impact('59828abb-2e61-45d7-87df-fa3620966dbb');
SELECT 'User: a0b09755-e7d9-46d4-97ea-67c53d728b3b' as user_info, * FROM check_user_deletion_impact('a0b09755-e7d9-46d4-97ea-67c53d728b3b');
SELECT 'User: 23c6de3d-dcfa-4570-afe9-5e0c11ffb5ab' as user_info, * FROM check_user_deletion_impact('23c6de3d-dcfa-4570-afe9-5e0c11ffb5ab');
SELECT 'User: 9ea51711-0df3-4b6a-91aa-10d31e4d6965' as user_info, * FROM check_user_deletion_impact('9ea51711-0df3-4b6a-91aa-10d31e4d6965');

-- Step 2: DANGER ZONE - Actual deletion commands (UNCOMMENT ONLY AFTER REVIEWING IMPACT)
-- WARNING: These will permanently delete users and all their data!

SELECT delete_user_safely('6faa0c0e-b972-4d24-bfbc-abe10c16a77a') as user_1_deleted;
SELECT delete_user_safely('59828abb-2e61-45d7-87df-fa3620966dbb') as user_2_deleted;
SELECT delete_user_safely('a0b09755-e7d9-46d4-97ea-67c53d728b3b') as user_3_deleted;
SELECT delete_user_safely('23c6de3d-dcfa-4570-afe9-5e0c11ffb5ab') as user_4_deleted;
SELECT delete_user_safely('9ea51711-0df3-4b6a-91aa-10d31e4d6965') as user_5_deleted; 