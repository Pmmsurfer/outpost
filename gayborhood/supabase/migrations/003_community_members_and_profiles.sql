-- Profiles: add optional avatar and one-line bio for member directory
alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text;

-- Community members: opt-in directory and join tracking
create table if not exists public.community_members (
  id uuid primary key default gen_random_uuid(),
  place_slug text not null,
  community_slug text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz default now() not null,
  show_in_directory boolean default false not null,
  unique(place_slug, community_slug, user_id)
);

-- FK to communities (ensure place_slug, community_slug exists)
alter table public.community_members
  add constraint fk_cm_community
  foreign key (place_slug, community_slug)
  references communities(place_slug, slug) on delete cascade;

create index if not exists idx_community_members_place_community
  on community_members(place_slug, community_slug);
create index if not exists idx_community_members_show_in_directory
  on community_members(place_slug, community_slug, show_in_directory) where show_in_directory = true;

-- RLS
alter table community_members enable row level security;

-- Anyone can see members who opted in (for directory)
create policy "read directory opt-in"
  on community_members for select to anon, authenticated
  using (show_in_directory = true);

-- Authenticated can read own row and update own show_in_directory
create policy "read own membership"
  on community_members for select to authenticated
  using (auth.uid() = user_id);

create policy "update own show_in_directory"
  on community_members for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Authenticated can insert own membership (join)
create policy "insert own membership"
  on community_members for insert to authenticated
  with check (auth.uid() = user_id);

-- Service role can do anything (for admin/power-user reads and member_count sync)
-- No policy needed; service role bypasses RLS.

-- Optional: keep communities.member_count in sync
create or replace function update_community_member_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'INSERT' then
    update communities
    set member_count = (
      select count(*) from community_members
      where place_slug = NEW.place_slug and community_slug = NEW.community_slug
    )
    where place_slug = NEW.place_slug and slug = NEW.community_slug;
  elsif TG_OP = 'DELETE' then
    update communities
    set member_count = (
      select count(*) from community_members
      where place_slug = OLD.place_slug and community_slug = OLD.community_slug
    )
    where place_slug = OLD.place_slug and slug = OLD.community_slug;
  end if;
  return coalesce(NEW, OLD);
end;
$$;

create trigger on_community_member_change
  after insert or delete on community_members
  for each row execute function update_community_member_count();

-- Backfill member_count for existing communities (in case we add members manually)
update communities c
set member_count = (select count(*) from community_members m where m.place_slug = c.place_slug and m.community_slug = c.slug);
