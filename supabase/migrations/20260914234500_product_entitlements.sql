-- Commerce entitlement ledger for one-time FORM products.
-- Payment does not create athlete membership, coaching access, or a plan assignment.

create table public.product_entitlements (
  id uuid primary key default gen_random_uuid(),
  product_slug text not null,
  product_version text not null,
  status text not null default 'paid' check (status in ('paid','refunded','disputed','revoked')),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text unique,
  stripe_customer_id text,
  purchaser_email text not null,
  amount_total integer not null check (amount_total >= 0),
  currency text not null,
  source jsonb not null default '{}'::jsonb,
  recent_race_distance_miles numeric(8,4),
  recent_race_seconds integer check (recent_race_seconds is null or recent_race_seconds > 0),
  goal_half_seconds integer check (goal_half_seconds is null or goal_half_seconds > 0),
  current_equivalent_seconds integer check (current_equivalent_seconds is null or current_equivalent_seconds > 0),
  band_low_seconds integer,
  band_high_seconds integer,
  band_source text check (band_source is null or band_source in ('goal','proposed')),
  auth_user_id uuid references auth.users(id) on delete set null,
  purchased_at timestamptz not null default now(),
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_entitlements_band_pair check (
    (band_low_seconds is null and band_high_seconds is null)
    or (band_low_seconds is not null and band_high_seconds = band_low_seconds + 15)
  )
);

create index product_entitlements_auth_user_idx
  on public.product_entitlements(auth_user_id)
  where auth_user_id is not null;

create index product_entitlements_product_idx
  on public.product_entitlements(product_slug, status);

alter table public.product_entitlements enable row level security;
revoke all on table public.product_entitlements from anon, authenticated;

drop trigger if exists product_entitlements_set_updated_at on public.product_entitlements;
create trigger product_entitlements_set_updated_at
before update on public.product_entitlements
for each row execute function public.set_updated_at();

comment on table public.product_entitlements is
  'Commerce entitlement ledger. Payment does not create athlete membership, coaching access, or plan assignment.';

comment on column public.product_entitlements.auth_user_id is
  'Optional FORM auth identity attached only after purchase; not an athlete or coach membership.';
