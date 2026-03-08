-- Bookings table (if your project doesn't have it yet)
CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  retreat_id uuid NOT NULL REFERENCES public.retreats(id) ON DELETE CASCADE,
  guest_name text NOT NULL,
  guest_email text NOT NULL,
  retreat_name text NOT NULL,
  total_cents bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  waiver_signed boolean NOT NULL DEFAULT false,
  booked_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_retreat_id_idx ON public.bookings(retreat_id);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Hosts can manage bookings for their own retreats
DROP POLICY IF EXISTS "bookings_host_select" ON public.bookings;
CREATE POLICY "bookings_host_select" ON public.bookings
  FOR SELECT USING (
    retreat_id IN (SELECT id FROM public.retreats WHERE host_id = auth.uid())
  );
DROP POLICY IF EXISTS "bookings_host_insert" ON public.bookings;
CREATE POLICY "bookings_host_insert" ON public.bookings
  FOR INSERT WITH CHECK (
    retreat_id IN (SELECT id FROM public.retreats WHERE host_id = auth.uid())
  );
DROP POLICY IF EXISTS "bookings_host_update" ON public.bookings;
CREATE POLICY "bookings_host_update" ON public.bookings
  FOR UPDATE USING (
    retreat_id IN (SELECT id FROM public.retreats WHERE host_id = auth.uid())
  );

-- Google Sheet connection per host (stores OAuth refresh token and spreadsheet id)
CREATE TABLE IF NOT EXISTS public.google_sheet_connections (
  host_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  refresh_token text NOT NULL,
  spreadsheet_id text NOT NULL,
  spreadsheet_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_sheet_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "google_sheet_connections_own_all" ON public.google_sheet_connections;
CREATE POLICY "google_sheet_connections_own_all" ON public.google_sheet_connections
  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- Service role can read/write for API routes (callback stores token)
-- If you use only RLS, the callback must run as the user; we use API route with service role to insert.

COMMENT ON TABLE public.google_sheet_connections IS 'OAuth refresh token and linked spreadsheet for syncing bookings to Google Sheets';
