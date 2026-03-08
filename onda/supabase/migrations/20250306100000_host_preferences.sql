-- Host notification preferences (dashboard settings)
-- Run in Supabase SQL editor or via supabase db push.

-- 1. host_preferences table: one row per host
CREATE TABLE IF NOT EXISTS host_preferences (
  host_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_new_booking boolean NOT NULL DEFAULT true,
  notification_cancellation boolean NOT NULL DEFAULT true,
  notification_new_message boolean NOT NULL DEFAULT true,
  notification_waiver_signed boolean NOT NULL DEFAULT false,
  notification_retreat_reminder boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS: authenticated read/write own row
ALTER TABLE host_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "host_preferences_own_select" ON host_preferences;
CREATE POLICY "host_preferences_own_select" ON host_preferences
  FOR SELECT TO authenticated
  USING (auth.uid() = host_id);

DROP POLICY IF EXISTS "host_preferences_own_insert" ON host_preferences;
CREATE POLICY "host_preferences_own_insert" ON host_preferences
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = host_id);

DROP POLICY IF EXISTS "host_preferences_own_update" ON host_preferences;
CREATE POLICY "host_preferences_own_update" ON host_preferences
  FOR UPDATE TO authenticated
  USING (auth.uid() = host_id)
  WITH CHECK (auth.uid() = host_id);
