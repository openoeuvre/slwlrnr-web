-- SLWLRNR — table privileges.
--
-- Newer Supabase projects don't automatically give the API roles access to
-- tables created in SQL. Without these, every query fails with
-- "permission denied for table …" — before Row Level Security is even checked.
--
-- RLS still decides WHICH rows a signed-in user sees ("read own" policies in
-- 0001). These grants only allow the roles to reach the tables at all.
--
-- Safe to re-run.

grant usage on schema public to authenticated, service_role;

-- Signed-in visitors: read only (their own rows, via RLS).
grant select on public.profiles      to authenticated;
grant select on public.subscriptions to authenticated;
grant select on public.create_usage  to authenticated;

-- The server (secret key): full access. Used by the Stripe webhook and the
-- billing code; never reachable from the browser.
grant select, insert, update, delete on public.profiles      to service_role;
grant select, insert, update, delete on public.subscriptions to service_role;
grant select, insert, update, delete on public.create_usage  to service_role;

-- Visitors who aren't signed in get nothing.
revoke all on public.profiles, public.subscriptions, public.create_usage from anon;
