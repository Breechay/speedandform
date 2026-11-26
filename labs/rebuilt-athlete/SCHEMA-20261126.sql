-- Applied via Supabase migration 20261126184231 on November 26, 2026.
-- Do not rerun blindly against production. This is the recorded migration body.
create table public.rebuilt_athlete_public_snapshot (
  singleton boolean primary key default true check(singleton),
  schema_version smallint not null default 1 check(schema_version=1),
  checked_at timestamptz not null,
  through_date date not null,
  published boolean not null default false,
  payload jsonb not null check(jsonb_typeof(payload)='object' and octet_length(payload::text)<=262144
     and payload ?& array['blocks','weeks','strength_templates','recent_evidence','pace_exposure']
     and (payload - array['blocks','weeks','strength_templates','recent_evidence','pace_exposure']) = '{}'::jsonb)
);
alter table public.rebuilt_athlete_public_snapshot enable row level security;
revoke all on table public.rebuilt_athlete_public_snapshot from public, anon, authenticated;
grant select (singleton,schema_version,checked_at,through_date,payload) on table public.rebuilt_athlete_public_snapshot to anon,authenticated;
create policy rebuilt_athlete_snapshot_read on public.rebuilt_athlete_public_snapshot for select to anon,authenticated using (singleton and published);
comment on table public.rebuilt_athlete_public_snapshot is 'Study 002 curated public projection only. No athlete IDs, GPS, freeform private notes, credentials, or raw Garmin payloads. Admin publishes a reviewed snapshot; public clients cannot write or read underlying records.';
