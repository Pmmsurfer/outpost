# Supabase inputs reference

All Supabase usage in the Onda app: auth, table reads/writes, and storage. Use this to wire env vars, create tables, and configure RLS.

---

## 1. Auth

| Method | Where | Purpose |
|--------|--------|--------|
| `supabase.auth.getUser()` | DashboardTopBar, AccountSettings, HostProfileSettings, NotificationSettings, Messages page | Get current user `id`, `email`, `user_metadata` |
| `supabase.auth.updateUser({ password })` | AccountSettings | Change password |
| `supabase.auth.signOut()` | DashboardTopBar | Log out, then redirect to `/` |

**Env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 2. Table: `profiles`

**Used in:** DashboardTopBar (read), HostProfileSettings (read + upsert).

**Assumption:** Table exists (e.g. from Supabase Auth). Extend with migration `20250306000000_host_profiles_and_reviews.sql`.

### Read (select)

| Columns | Where |
|--------|--------|
| `avatar_url, full_name, slug` | DashboardTopBar — `.eq("id", user.id).maybeSingle()` |
| `*` | HostProfileSettings — `.eq("id", user.id).single()` then map to form: `full_name`, `short_bio`, `long_bio`, `avatar_url`, `specialties`, `certifications`, `instagram_handle`, `website_url`, `slug` |

### Write (upsert)

**HostProfileSettings** — `.upsert(..., { onConflict: "id" })`

| Column | Source |
|--------|--------|
| `id` | `user.id` |
| `full_name` | form |
| `short_bio` | form (max 160 chars) |
| `long_bio` | form |
| `avatar_url` | form (from Storage `avatars`) |
| `specialties` | form (array) |
| `certifications` | form (array) |
| `instagram_handle` | form (no leading @) |
| `website_url` | form |
| `slug` | `nameToSlug(full_name)` or existing `slug` or `host-${user.id.slice(0,8)}` |

---

## 3. Table: `retreats`

**Used in:** DashboardTopBar (read count), RetreatForm (insert/update).

**Schema:** `supabase-retreats-schema.sql` (and migrations as needed).

### Read

| Query | Where |
|-------|--------|
| `.select("id", { count: "exact", head: true }).eq("host_id", user.id).eq("status", "published").limit(1)` | DashboardTopBar — to show “View my profile” only if host has ≥1 published retreat |

### Write (insert / update)

**RetreatForm** — `.insert({ ...payload, status })` or `.update({ ...payload, status }).eq("id", retreatId)`.

Payload columns (from form `data`):

| Column | Type / source |
|--------|----------------|
| `id` | only on update |
| `host_id` | from `window.__hostId` (set by app from auth) |
| `name` | string |
| `activity_type` | string |
| `location_city` | string |
| `location_country` | string |
| `start_date` | date |
| `end_date` | date |
| `capacity` | int |
| `contact_email` | string |
| `short_description` | string |
| `full_description` | string |
| `included` | string[] |
| `not_included` | string[] |
| `skill_level` | string |
| `typical_day` | string |
| `accommodation_notes` | string |
| `highlights` | string[] |
| `faqs` | jsonb |
| `price` | number |
| `currency` | string |
| `deposit_amount` | number |
| `deposit_type` | string |
| `balance_due_days` | int |
| `cancellation_policy` | string |
| `covid_policy` | null |
| `policy_liability_waiver` | boolean |
| `policy_travel_insurance` | boolean |
| `policy_age_requirement` | boolean |
| `policy_age_min` | int |
| `policy_custom` | boolean |
| `policy_custom_text` | string |
| `waiver_required` | boolean |
| `waiver_text` | string |
| `cover_image_url` | string (from Storage `retreats`) |
| `gallery_urls` | string[] |
| `status` | `"draft"` or `"published"` |

---

## 4. Table: `host_preferences`

**Used in:** NotificationSettings (read + upsert).

**Schema:** `supabase/migrations/20250306100000_host_preferences.sql`.

### Read

| Query | Where |
|-------|--------|
| `.select("*").eq("host_id", user.id).maybeSingle()` | NotificationSettings — load toggles |

### Write (upsert)

**NotificationSettings** — `.upsert({ host_id, ...prefs }, { onConflict: "host_id" })`

| Column | Source |
|--------|--------|
| `host_id` | `user.id` |
| `notification_new_booking` | boolean |
| `notification_cancellation` | boolean |
| `notification_new_message` | boolean |
| `notification_waiver_signed` | boolean |
| `notification_retreat_reminder` | boolean |

---

## 5. Table: `messages`

**Used in:** Messages page (insert only in current code).

### Write (insert)

**Messages page** — `.insert(inserts)` where each row:

| Column | Source |
|--------|--------|
| `sender_id` | `user.id` |
| `recipient_id` | profile id looked up from guest email |
| `retreat_id` | from booking |
| `subject` | broadcast subject or null |
| `body` | broadcast body |

**Note:** Recipients are resolved from `profiles` by guest email (see messages page). You’ll need a `messages` table and RLS if you enable this in production.

---

## 6. Storage

### Bucket: `avatars`

**Used in:** HostProfileSettings (AvatarUpload).

- **Upload:** `.storage.from("avatars").upload(path, file, { upsert: true })`  
  Path: `public/${Date.now()}.${ext}`
- **URL:** `.storage.from("avatars").getPublicUrl(data.path).publicUrl`  
  Stored in `profiles.avatar_url`.

**Dashboard:** Create bucket `avatars`, set public if profile photos should be public.

### Bucket: `retreats`

**Used in:** PhotoUpload (RetreatForm).

- **Upload:** `.storage.from("retreats").upload(path, file, { upsert: true })`  
  Path: `${retreatId}/${prefix}-${Date.now()}.${ext}` with prefix `cover` or `gallery`.
- **URL:** `.storage.from("retreats").getPublicUrl(data.path).publicUrl`  
  Stored in retreat `cover_image_url` or `gallery_urls`.

**Dashboard:** Create bucket `retreats`, set public for cover/gallery images.

---

## 7. Quick checklist

- [ ] Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Auth: sign up/sign in flow sets `user.id` and `user.email`
- [ ] Table `profiles`: extended with migration (slug, short_bio, long_bio, avatar_url, specialties, certifications, instagram_handle, website_url); RLS for own row
- [ ] Table `retreats`: schema + RLS (e.g. host can CRUD own)
- [ ] Table `host_preferences`: migration + RLS (own row)
- [ ] Table `messages`: create if using broadcast; RLS for sender/recipient
- [ ] Storage bucket `avatars` (public)
- [ ] Storage bucket `retreats` (public)
- [ ] App sets `window.__hostId = user.id` (or equivalent) so RetreatForm can set `host_id` on insert
