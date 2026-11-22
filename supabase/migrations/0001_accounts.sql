-- SLWLRNR — accounts, memberships, Create usage.
--
-- Run once in the Supabase dashboard: SQL Editor → New query → paste → Run.
-- Safe to re-run: every statement is idempotent.
--
-- Security model:
--   * Row Level Security is ON for every table.
--   * Signed-in users can READ their own rows. Nobody writes through the
--     public API, except via consume_free_blend(), which only ever touches
--     the caller's own row and enforces the cap itself.
--   * subscriptions is written only by the Stripe webhook (server, secret key).

-- ---------------------------------------------------------------- profiles
create table if not exists public.profiles (
  id                 uuid primary key references auth.users (id) on delete cascade,
  email              text,
  display_name       text,
  stripe_customer_id text unique,
  created_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

-- One profile per new user, created automatically on sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------ subscriptions
-- Learn ($10) and Studio ($30) are separate memberships on one account.
-- Mirrors Stripe; the webhook upserts by stripe_subscription_id.
create table if not exists public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references auth.users (id) on delete cascade,
  product                text not null check (product in ('learn', 'studio')),
  status                 text not null,   -- Stripe status: active, trialing, past_due, canceled, …
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  stripe_subscription_id text unique,
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_user_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions: read own" on public.subscriptions;
create policy "subscriptions: read own" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- ------------------------------------------------------------- create usage
-- Free-tier daily cap for Create. One row per user per UTC day.
create table if not exists public.create_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day     date not null default (now() at time zone 'utc')::date,
  count   integer not null default 0,
  primary key (user_id, day)
);

alter table public.create_usage enable row level security;

drop policy if exists "create_usage: read own" on public.create_usage;
create policy "create_usage: read own" on public.create_usage
  for select to authenticated using ((select auth.uid()) = user_id);

-- Records one free blend for the CALLER and returns today's new count.
-- Refuses (raises) once the cap is reached, so the cap holds even if the app
-- is bypassed. Callable by signed-in users only; touches only their own row.
create or replace function public.consume_free_blend(p_cap integer)
returns integer
language plpgsql
security definer set search_path = ''
as $$
declare
  uid   uuid := auth.uid();
  today date := (now() at time zone 'utc')::date;
  n     integer;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  insert into public.create_usage (user_id, day, count)
  values (uid, today, 1)
  on conflict (user_id, day)
    do update set count = public.create_usage.count + 1
    where public.create_usage.count < p_cap
  returning count into n;

  if n is null then
    raise exception 'daily limit reached';
  end if;
  return n;
end;
$$;

revoke all on function public.consume_free_blend(integer) from public, anon;
grant execute on function public.consume_free_blend(integer) to authenticated;
