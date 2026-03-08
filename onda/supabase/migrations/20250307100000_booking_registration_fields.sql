-- Room types per retreat (accommodation options)
CREATE TABLE IF NOT EXISTS public.retreat_room_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id uuid NOT NULL REFERENCES public.retreats(id) ON DELETE CASCADE,
  name text NOT NULL,
  capacity int NOT NULL DEFAULT 1,
  booked_count int NOT NULL DEFAULT 0,
  price_cents bigint NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retreat_room_types_retreat_id_idx ON public.retreat_room_types(retreat_id);
ALTER TABLE public.retreat_room_types ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "retreat_room_types_public_read" ON public.retreat_room_types;
CREATE POLICY "retreat_room_types_public_read" ON public.retreat_room_types
  FOR SELECT USING (
    retreat_id IN (SELECT id FROM public.retreats WHERE status = 'published')
  );
DROP POLICY IF EXISTS "retreat_room_types_host_all" ON public.retreat_room_types;
CREATE POLICY "retreat_room_types_host_all" ON public.retreat_room_types
  FOR ALL USING (
    retreat_id IN (SELECT id FROM public.retreats WHERE host_id = auth.uid())
  ) WITH CHECK (
    retreat_id IN (SELECT id FROM public.retreats WHERE host_id = auth.uid())
  );

-- Activity options per retreat
CREATE TABLE IF NOT EXISTS public.retreat_activity_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id uuid NOT NULL REFERENCES public.retreats(id) ON DELETE CASCADE,
  label text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retreat_activity_options_retreat_id_idx ON public.retreat_activity_options(retreat_id);
ALTER TABLE public.retreat_activity_options ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "retreat_activity_options_public_read" ON public.retreat_activity_options;
CREATE POLICY "retreat_activity_options_public_read" ON public.retreat_activity_options
  FOR SELECT USING (
    retreat_id IN (SELECT id FROM public.retreats WHERE status = 'published')
  );
DROP POLICY IF EXISTS "retreat_activity_options_host_all" ON public.retreat_activity_options;
CREATE POLICY "retreat_activity_options_host_all" ON public.retreat_activity_options
  FOR ALL USING (
    retreat_id IN (SELECT id FROM public.retreats WHERE host_id = auth.uid())
  ) WITH CHECK (
    retreat_id IN (SELECT id FROM public.retreats WHERE host_id = auth.uid())
  );

-- Extend bookings with guest registration fields
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS room_type_id uuid REFERENCES public.retreat_room_types(id) ON DELETE SET NULL;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS selected_activities text[] DEFAULT '{}';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dietary_requirements text[] DEFAULT '{}';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS dietary_notes text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS emergency_contact_name text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS emergency_contact_phone text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS roommate_request text;

-- Allow guests to create bookings for published retreats (no auth required for public booking)
DROP POLICY IF EXISTS "bookings_guest_insert" ON public.bookings;
CREATE POLICY "bookings_guest_insert" ON public.bookings
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.retreats WHERE id = retreat_id AND status = 'published')
  );
