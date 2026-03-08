-- Retreat creation form persists to the `retreats` table.
-- Run this in Supabase SQL editor (adjust types as needed for your project).

create table if not exists public.retreats (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references auth.users(id),
  name text not null,
  activity_type text not null default 'yoga',
  location_city text,
  location_country text,
  start_date date,
  end_date date,
  capacity int,
  contact_email text,
  short_description text,
  full_description text,
  included text[] default '{}',
  not_included text[] default '{}',
  skill_level text not null default 'all-levels',
  typical_day text,
  accommodation_notes text,
  highlights text[] default '{}',
  faqs jsonb default '[]',
  price numeric,
  currency text default 'USD',
  deposit_amount numeric,
  deposit_type text default 'flat',
  balance_due_days int,
  cancellation_policy text not null default 'moderate',
  covid_policy text,
  policy_liability_waiver boolean default false,
  policy_travel_insurance boolean default false,
  policy_age_requirement boolean default false,
  policy_age_min int,
  policy_custom boolean default false,
  policy_custom_text text,
  waiver_required boolean default false,
  waiver_text text,
  cover_image_url text,
  gallery_urls text[] default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Storage bucket for retreats (cover + gallery)
-- In Supabase Dashboard: Storage > New bucket > name: retreats, public: true

-- RLS (example: host can manage own retreats)
-- alter table public.retreats enable row level security;
-- create policy "Hosts can manage own retreats" on public.retreats
--   for all using (auth.uid() = host_id);
