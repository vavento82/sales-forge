-- Stripe subscription state on users_profile. Run allowance is counted from
-- the runs table by timestamp (no counter column to drift); these columns
-- only track plan + billing window.

alter table public.users_profile
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'starter', 'pro')),
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz;

create index if not exists users_profile_stripe_customer_idx
  on public.users_profile (stripe_customer_id);
