-- Enable Row Level Security on the 3 remaining unrestricted tables.
-- These are all server-only tables (accessed exclusively via the service role key
-- in API routes). Enabling RLS here is defense-in-depth: if the anon key is ever
-- exposed or misused, no client-side code can read or write these tables directly.
--
-- The service role key bypasses RLS, so server-side API routes will continue to
-- work without any code changes.

-- =============================================================================
-- subscriptions
-- =============================================================================
-- Server-managed via Stripe webhooks and Apple IAP receipts. Users should be
-- able to read their own subscription via the API (which uses service role),
-- but should NOT be able to read/write directly using the anon key.

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies first so this script is idempotent
DROP POLICY IF EXISTS "Service role can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can read own subscription" ON public.subscriptions;

-- Allow service role full access (this is implicit, but explicit is better)
CREATE POLICY "Service role can manage subscriptions"
  ON public.subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own subscription only
-- (Useful if you ever query directly from the client)
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- =============================================================================
-- queue_metrics
-- =============================================================================
-- Internal monitoring table for QStash cron jobs. Server-only, no client access.

ALTER TABLE public.queue_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage queue metrics" ON public.queue_metrics;

CREATE POLICY "Service role can manage queue metrics"
  ON public.queue_metrics
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- No policies for anon/authenticated = no access from client


-- =============================================================================
-- suspicious_activity
-- =============================================================================
-- Admin/security table. Should never be readable from the client.

ALTER TABLE public.suspicious_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage suspicious activity" ON public.suspicious_activity;
DROP POLICY IF EXISTS "Admins can read suspicious activity" ON public.suspicious_activity;

CREATE POLICY "Service role can manage suspicious activity"
  ON public.suspicious_activity
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow admins to read (useful if you build an admin panel that uses Supabase auth)
CREATE POLICY "Admins can read suspicious activity"
  ON public.suspicious_activity
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
        AND users.is_admin = true
    )
  );
