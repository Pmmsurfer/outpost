# Testing Supabase (after setup)

Quick way to confirm the app is talking to Supabase.

---

## 1. Create a test user in Supabase

1. Supabase dashboard → **Authentication** → **Users**
2. **Add user** → **Create new user**
3. Enter an **email** and **password** (e.g. `you@example.com` / `testpassword123`)
4. Create user (no email confirmation needed if you turned it off)

---

## 2. Sign in via the app

1. Start the app: from the `onda` folder run `npm run dev`
2. Open **http://localhost:3000/login** (or 3001 if 3000 is in use)
3. Enter the same email and password → **Sign in**
4. You should be redirected to **/dashboard**

If you get “Invalid login credentials”, double-check the user exists in Supabase and the password is correct.

---

## 3. Check that Supabase is used

| What to do | What to check |
|------------|----------------|
| **Top bar** | Avatar (or initials) and name/email in the dropdown. If you see your email/initials, `profiles` + auth are working. |
| **Settings → Host Profile** | Load the page. If you see “Loading profile…” then your name/bio fields, profile is loading. Edit and **Save profile** — no error means `profiles` write works. |
| **Settings → Account** | Your email and “Change password” — email comes from auth. Try **Change password** (current + new) — success means `auth.updateUser` works. |
| **Settings → Notifications** | Toggle a switch. If it doesn’t error, `host_preferences` read/write works. |
| **Host Profile → Profile photo** | Click **Upload photo**, pick an image. If it uploads and shows in the circle, Storage bucket `avatars` works. |
| **My Retreats → Create** | Go to **My Retreats** → **New retreat** (or `/dashboard/retreats/new`). Fill required fields and **Publish** (or save draft). If the retreat appears in the list (or in Supabase → Table Editor → `retreats`), `retreats` insert works and `host_id` is set. |
| **Retreat cover photo** | On create/edit retreat, add a cover image. If it uploads and shows, Storage bucket `retreats` works. |

---

## 4. Optional: check in Supabase

- **Table Editor → profiles** — after saving Host Profile, you should see your row (same `id` as the user).
- **Table Editor → retreats** — after creating a retreat, you should see a row with your `host_id`.
- **Table Editor → host_preferences** — after toggling notifications, you should see one row per host.
- **Storage → avatars** — after uploading a profile photo, you should see files under `public/`.
- **Storage → retreats** — after adding a retreat cover, you should see files under `{retreat_id}/`.

---

## 5. Log out

Click the avatar (top right) → **Log out**. You should be sent to the home page. Go to **/dashboard** again — you’ll have no session until you sign in at **/login** again.

---

**Summary:** Create a user in Supabase → sign in at `/login` → open dashboard and use Settings (profile, account, notifications) and create a retreat. If those work without errors, Supabase is wired correctly.
