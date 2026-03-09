-- Host profile enhancements: tagline, philosophy, cover image, location, languages, stats
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS philosophy text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_hosting int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS retreat_count int;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_url text;
