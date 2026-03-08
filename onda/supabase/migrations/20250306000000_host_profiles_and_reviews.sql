-- Host profile page + reviews
-- Run this in Supabase SQL editor or via supabase db push if you use Supabase CLI.
--
-- Prerequisites:
-- - profiles table (often created by Supabase Auth; ensure it has id uuid PRIMARY KEY referencing auth.users)
-- - Create storage bucket "avatars" in Dashboard (Storage) and set it public if you want profile photos

-- 1. Extend profiles table (add columns if not present)
-- If your profiles table was created by auth, add these columns:
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS short_bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS long_bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url text;

-- Ensure full_name exists (common in auth.profiles)
-- ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name text;

-- 2. Generate slug from full_name on insert/update
-- Assumes profiles has a full_name column (or add it). Adjust trigger if your table uses different column names.
CREATE OR REPLACE FUNCTION profiles_slug_from_name()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_name IS NOT NULL AND trim(NEW.full_name) != '' THEN
    NEW.slug := lower(regexp_replace(trim(NEW.full_name), '\s+', '-', 'g'));
    NEW.slug := regexp_replace(NEW.slug, '[^a-z0-9-]', '', 'g');
    NEW.slug := regexp_replace(NEW.slug, '-+', '-', 'g');
    NEW.slug := trim(both '-' from NEW.slug);
  END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := 'host-' || coalesce(substring(NEW.id::text from 1 for 8), gen_random_uuid()::text);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_slug ON profiles;
CREATE TRIGGER set_profiles_slug
  BEFORE INSERT OR UPDATE OF full_name ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION profiles_slug_from_name();

-- 3. Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  retreat_id uuid NOT NULL,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text NOT NULL,
  is_public boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reviews_host_id_idx ON reviews(host_id);
CREATE INDEX IF NOT EXISTS reviews_retreat_id_idx ON reviews(retreat_id);

-- 4. RLS: profiles — public read, authenticated write own row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. RLS: reviews — public read where is_public, authenticated insert
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews
  FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "reviews_authenticated_insert" ON reviews;
CREATE POLICY "reviews_authenticated_insert" ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = guest_id);

-- Optional: allow host to read all their reviews (including non-public)
DROP POLICY IF EXISTS "reviews_host_read_own" ON reviews;
CREATE POLICY "reviews_host_read_own" ON reviews
  FOR SELECT
  USING (auth.uid() = host_id);
