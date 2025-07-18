-- Batch User Deletion Script
-- Step 1: Check impact for all users first

-- Impact analysis for all users
SELECT 'User: d7c8ceef-a1ab-41f8-b91e-0ad2f69d87f9' as user_info, * FROM check_user_deletion_impact('d7c8ceef-a1ab-41f8-b91e-0ad2f69d87f9');
SELECT 'User: 51c3d0d5-832e-4396-83fb-607bc4be8c08' as user_info, * FROM check_user_deletion_impact('51c3d0d5-832e-4396-83fb-607bc4be8c08');
SELECT 'User: 8faae9f5-63d4-42a6-a0ee-0d95fd0610c6' as user_info, * FROM check_user_deletion_impact('8faae9f5-63d4-42a6-a0ee-0d95fd0610c6');
SELECT 'User: ccececf7-9915-46c5-9a4b-31a8f132682a' as user_info, * FROM check_user_deletion_impact('ccececf7-9915-46c5-9a4b-31a8f132682a');
SELECT 'User: 0eed837e-78e8-4437-a796-54c1391de55b' as user_info, * FROM check_user_deletion_impact('0eed837e-78e8-4437-a796-54c1391de55b');
SELECT 'User: 286cb17d-43c5-4376-ac9d-c9a4ca6da828' as user_info, * FROM check_user_deletion_impact('286cb17d-43c5-4376-ac9d-c9a4ca6da828');
SELECT 'User: 833e7aef-dae0-4a22-8e47-fdf7acc36098' as user_info, * FROM check_user_deletion_impact('833e7aef-dae0-4a22-8e47-fdf7acc36098');
SELECT 'User: 895ca5aa-83e1-4ef8-b2cd-fe17eef5601d' as user_info, * FROM check_user_deletion_impact('895ca5aa-83e1-4ef8-b2cd-fe17eef5601d');
SELECT 'User: 1283b60b-2ebf-4924-9e37-e594c73b62ac' as user_info, * FROM check_user_deletion_impact('1283b60b-2ebf-4924-9e37-e594c73b62ac');

-- Step 2: DANGER ZONE - Actual deletion commands (UNCOMMENT ONLY AFTER REVIEWING IMPACT)
-- WARNING: These will permanently delete users and all their data!

/*
SELECT delete_user_safely('d7c8ceef-a1ab-41f8-b91e-0ad2f69d87f9') as user_1_deleted;
SELECT delete_user_safely('51c3d0d5-832e-4396-83fb-607bc4be8c08') as user_2_deleted;
SELECT delete_user_safely('8faae9f5-63d4-42a6-a0ee-0d95fd0610c6') as user_3_deleted;
SELECT delete_user_safely('ccececf7-9915-46c5-9a4b-31a8f132682a') as user_4_deleted;
SELECT delete_user_safely('0eed837e-78e8-4437-a796-54c1391de55b') as user_5_deleted;
SELECT delete_user_safely('286cb17d-43c5-4376-ac9d-c9a4ca6da828') as user_6_deleted;
SELECT delete_user_safely('833e7aef-dae0-4a22-8e47-fdf7acc36098') as user_7_deleted;
SELECT delete_user_safely('895ca5aa-83e1-4ef8-b2cd-fe17eef5601d') as user_8_deleted;
SELECT delete_user_safely('1283b60b-2ebf-4924-9e37-e594c73b62ac') as user_9_deleted;
*/ 