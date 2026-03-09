# Supabase setup guide (Onda)

Step-by-step setup so the Onda app can use Supabase for auth, profiles, retreats, notifications, and storage.

---

## Quick path (minimal steps)

1. **Create project** at [supabase.com](https://supabase.com) → New project → wait for it to be ready.
2. **Run the one-time SQL**  
   In the dashboard: **SQL Editor** → **New query** → open `supabase/run-once-setup.sql` from this repo, paste the whole file → **Run**.  
   That creates and configures `profiles`, `retreats`, `host_preferences`, `reviews`, and RLS.
3. **Create storage buckets**  
   **Storage** → **New bucket** → name `avatars`, set **Public** On → Create.  
   Again → **New bucket** → name `retreats`, **Public** On → Create.
4. **Env vars**  
   **Project Settings** → **API** → copy **Project URL** and **anon public** key.  
   In the repo: copy `.env.example` to `.env.local` and paste your URL and anon key. Restart the dev server.
5. **Create a user**  
   **Authentication** → **Users** → **Add user** (email + password) so you can sign in.

Done. For more detail (Auth settings, storage policies, messages table), see the full steps below.

---

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in.
2. **New project** → pick org, name (e.g. `onda`), database password, region.
3. Wait for the project to finish provisioning.

---

## 2. Get your API keys and URL

1. In the project: **Project Settings** (gear) → **API**.
2. Copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

In your app (e.g. `onda/.env.local`):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Restart the Next.js dev server after changing env.

---

## 3. Enable Auth (Email)

1. **Authentication** → **Providers**.
2. Ensure **Email** is enabled (default).
3. (Optional) Turn off **Confirm email** if you don’t want confirmations in dev.

You’ll create users either in the dashboard (**Authentication** → **Users** → **Add user**) or via your own sign-up flow. The app expects `auth.getUser()` to return a user with `id` and `email`.

---

## 4. Ensure `profiles` exists

Supabase sometimes creates a `profiles` table linked to Auth; if not, create it and optionally add a trigger so new users get a row.

In **SQL Editor** → **New query**, run:

```sql
-- Only if profiles doesn't already exist (e.g. from Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  updated_at timestamptz default now()
);

-- Optional: auto-create profile on signup
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
```

Then run the **profiles extension** migration (Step 5).

---

## 5. Run SQL migrations (in order)

In **SQL Editor**, run each of these in order. You can paste the full block and run once if you prefer.

### 5a. Extend `profiles` + RLS (host profile page)

From `supabase/migrations/20250306000000_host_profiles_and_reviews.sql`:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slug text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS short_bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS long_bio text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS certifications text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_handle text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS website_url text;

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

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_public_read" ON profiles;
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "profiles_own_update" ON profiles;
CREATE POLICY "profiles_own_update" ON profiles FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "reviews_public_read" ON reviews;
CREATE POLICY "reviews_public_read" ON reviews FOR SELECT USING (is_public = true);
DROP POLICY IF EXISTS "reviews_authenticated_insert" ON reviews;
CREATE POLICY "reviews_authenticated_insert" ON reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = guest_id);
DROP POLICY IF EXISTS "reviews_host_read_own" ON reviews;
CREATE POLICY "reviews_host_read_own" ON reviews FOR SELECT USING (auth.uid() = host_id);
```

### 5b. Create `retreats` table + RLS

From `supabase-retreats-schema.sql` plus RLS:

```sql
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
CREATE POLICY "retreats_host_all" ON public.retreats
  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);
-- Allow public to read published retreats (e.g. for discover/host pages)
DROP POLICY IF EXISTS "retreats_public_read_published" ON public.retreats;
CREATE POLICY "retreats_public_read_published" ON public.retreats
  FOR SELECT USING (status = 'published');
```

### 5c. Create `host_preferences` table + RLS

From `supabase/migrations/20250306100000_host_preferences.sql`:

```sql
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
```

---

## 6. Create storage buckets

1. Go to **Storage** in the Supabase dashboard.
2. **New bucket**:
   - Name: `avatars`
   - Public bucket: **On** (so profile photo URLs work).
   - Create.
3. **New bucket** again:
   - Name: `retreats`
   - Public bucket: **On** (so cover/gallery URLs work).
   - Create.

(Optional) Under **Policies** for each bucket, add a policy so authenticated users can upload, e.g.:

- **avatars**: `INSERT` and `UPDATE` for `auth.role() = 'authenticated'`, with a path rule like `public/*` if you use a `public/` prefix.
- **retreats**: same for authenticated users, path like `*` or your retreat path pattern.

If the bucket is public, “Allow public read” is already in effect; you mainly need upload policy for the app.

---

## 7. (Optional) Messages table

If you use the Messages broadcast feature that inserts into `messages`:

1. **SQL Editor** → create a `messages` table with columns: `id`, `sender_id` (references auth.users), `recipient_id`, `retreat_id`, `subject`, `body`, `created_at`.
2. Enable RLS and add policies so senders can insert and sender/recipient can read.

The app currently inserts with `sender_id`, `recipient_id`, `retreat_id`, `subject`, `body`. Add an `id` (uuid, default gen_random_uuid()) and `created_at` (timestamptz, default now()) if you want.

---

## 8. Set `host_id` for retreat creation

The retreat form sends `host_id` from the client. Ensure the logged-in user’s id is available when creating retreats. For example, in your dashboard layout or a provider that has access to `user.id` after `getUser()`, set:

```ts
window.__hostId = user.id;
```

(or pass `host_id` into the form another way). The RetreatForm uses this when inserting new retreats.

---

## 9. Quick checklist

- [ ] Project created; env vars `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`
- [ ] Email auth enabled; at least one user created (or sign up flow works)
- [ ] `profiles` table exists and is extended (Step 4 + 5a)
- [ ] `retreats` table created with RLS (Step 5b)
- [ ] `host_preferences` table created with RLS (Step 5c)
- [ ] Storage buckets `avatars` and `retreats` created and public
- [ ] `window.__hostId` (or equivalent) set when user is logged in so retreat create works

After this, the app can use Supabase for profile, settings, notifications, retreats, and file uploads. For a full list of every Supabase read/write, see `docs/SUPABASE_INPUTS.md`.
