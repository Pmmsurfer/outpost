-- Host plan for platform fee calculation (free: 10%, pro: 5%, studio: 3%)
CREATE TABLE IF NOT EXISTS public.host_subscriptions (
  host_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'studio')),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.host_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "host_subscriptions_own" ON public.host_subscriptions;
CREATE POLICY "host_subscriptions_own" ON public.host_subscriptions
  FOR ALL USING (auth.uid() = host_id) WITH CHECK (auth.uid() = host_id);

-- Stripe-related fields on bookings (for financials)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_fee_cents bigint;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS stripe_payment_id text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'deposit' CHECK (payment_type IN ('deposit', 'balance', 'refund'));
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('paid', 'pending', 'refunded'));

COMMENT ON COLUMN public.bookings.stripe_fee_cents IS 'Stripe fee (2.9% + $0.30) at time of payment';
COMMENT ON COLUMN public.bookings.stripe_payment_id IS 'Stripe payment intent or charge ID for dashboard link';
