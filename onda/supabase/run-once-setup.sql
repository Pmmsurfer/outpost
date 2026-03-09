-- =============================================================================
-- Onda: run this ONCE in Supabase → SQL Editor → New query → paste → Run
-- =============================================================================
-- Does: profiles table (if missing), extend profiles, retreats, host_preferences,
--       reviews, and all RLS. After this, create Storage buckets "avatars" and
--       "retreats" in the dashboard (Storage → New bucket, public).
-- =============================================================================

-- 1. Profiles (if not already created by Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Extend profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS short_bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS long_bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS philosophy text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_hosting int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS retreat_count int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url text;

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
  FOR EACH ROW EXECUTE FUNCTION profiles_slug_from_name();

-- 3. Reviews
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

-- 4. Profiles RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. Reviews RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON reviews;
CREATE POLICY "reviews_authenticated_insert" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = guest_id);
DROP POLICY IF EXISTS "reviews_host_read_own" ON reviews;
CREATE POLICY "reviews_host_read_own" ON reviews FOR SELECT USING (auth.uid() = host_id);

-- 6. Retreats
CREATE TABLE IF NOT EXISTS public.retreats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES auth.users(id),
  name text NOT NULL,
  activity_type text NOT NULL DEFAULT 'yoga',
  location_city text,
  location_country text,
  start_date date,
  end_date date,
  capacity int,
  contact_email text,
  short_description text,
  full_description text,
  included text[] DEFAULT '{}',
  not_included text[] DEFAULT '{}',
  skill_level text NOT NULL DEFAULT 'all-levels',
  typical_day text,
  accommodation_notes text,
  highlights text[] DEFAULT '{}',
  faqs jsonb DEFAULT '[]',
  price numeric,
  currency text DEFAULT 'USD',
  deposit_amount numeric,
  deposit_type text DEFAULT 'flat',
  balance_due_days int,
  cancellation_policy text NOT NULL DEFAULT 'moderate',
  covid_policy text,
  policy_liability_waiver boolean DEFAULT false,
  policy_travel_insurance boolean DEFAULT false,
  policy_age_requirement boolean DEFAULT false,
  policy_age_min int,
  policy_custom boolean DEFAULT false,
  policy_custom_text text,
  waiver_required boolean DEFAULT false,
  waiver_text text,
  cover_image_url text,
  gallery_urls text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.retreats ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "retreats_host_all" ON public.retreats;
CREATE POLICY "retreats_host_all" ON public.retreats FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "retreats_public_read_published" ON public.retreats;
CREATE POLICY "retreats_public_read_published" ON public.retreats FOR SELECT USING (status = 'published');

-- 7. Host preferences
CREATE TABLE IF NOT EXISTS host_preferences (
  host_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_new_booking boolean NOT NULL DEFAULT true,
  notification_cancellation boolean NOT NULL DEFAULT true,
  notification_new_message boolean NOT NULL DEFAULT true,
  notification_waiver_signed boolean NOT NULL DEFAULT false,
  notification_retreat_reminder boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE host_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "host_preferences_own_select" ON host_preferences;
CREATE POLICY "host_preferences_own_select" ON host_preferences FOR SELECT TO authenticated USING (auth.uid() = host_id);
DROP POLICY IF EXISTS "host_preferences_own_insert" ON host_preferences;
CREATE POLICY "host_preferences_own_insert" ON host_preferences FOR INSERT TO authenticated WITH CHECK (auth.uid() = host_id);
DROP POLICY IF EXISTS "host_preferences_own_update" ON host_preferences;
CREATE POLICY "host_preferences_own_update" ON host_preferences FOR UPDATE TO authenticated USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
