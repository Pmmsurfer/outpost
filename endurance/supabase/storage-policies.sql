-- Run this in Supabase → SQL Editor to fix "new row violates row-level security policy"
-- when uploading to the retreats or avatars bucket.
--
-- These policies allow authenticated users to upload (INSERT), read (SELECT),
-- and overwrite (UPDATE) files in the retreats and avatars buckets.

-- Retreats bucket: cover + gallery uploads
DROP POLICY IF EXISTS "Authenticated upload to retreats" ON storage.objects;
CREATE POLICY "Authenticated upload to retreats"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'retreats');

DROP POLICY IF EXISTS "Authenticated read retreats" ON storage.objects;
CREATE POLICY "Authenticated read retreats"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'retreats');

DROP POLICY IF EXISTS "Authenticated update retreats" ON storage.objects;
CREATE POLICY "Authenticated update retreats"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'retreats');

-- Public read for retreats (so cover images work on public pages)
DROP POLICY IF EXISTS "Public read retreats" ON storage.objects;
CREATE POLICY "Public read retreats"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'retreats');

-- Avatars bucket: profile photo uploads
DROP POLICY IF EXISTS "Authenticated upload to avatars" ON storage.objects;
CREATE POLICY "Authenticated upload to avatars"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated read avatars" ON storage.objects;
CREATE POLICY "Authenticated read avatars"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated update avatars" ON storage.objects;
CREATE POLICY "Authenticated update avatars"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars');

-- Public read for avatars (so profile photos show on host pages)
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
