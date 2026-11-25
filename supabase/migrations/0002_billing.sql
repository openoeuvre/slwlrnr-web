-- SLWLRNR — billing additions for Stripe.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run.

-- The bundle is its own plan; it grants both Learn and Studio.
alter table public.subscriptions
  drop constraint if exists subscriptions_product_check;
alter table public.subscriptions
  add constraint subscriptions_product_check
  check (product in ('learn', 'studio', 'bundle'));

-- Fields the webhook keeps in sync with Stripe.
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists stripe_price_id   text;
alter table public.subscriptions add column if not exists trial_end         timestamptz;

create index if not exists subscriptions_customer_idx
  on public.subscriptions (stripe_customer_id);
