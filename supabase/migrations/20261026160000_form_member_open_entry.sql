-- FORM self-service entrance, account scoped rather than athlete/coach scoped.
-- Draft migration: do not apply to production until native auth + negative RLS QA.
-- Keeps Curated-only members out of the coached athletes/athlete_memberships roster.

create table if not exists public.form_member_journeys (
  account_id uuid primary key references auth.users(id) on delete cascade,
  entry_path text not null default 'curated'
    check (entry_path in ('make_plan','bring_plan','curated')),
  preferred_name text null check (preferred_name is null or (length(trim(preferred_name)) between 1 and 80)),
  unit_preference text not null default 'mi' check (unit_preference in ('mi','km')),
  training_city text null check (training_city is null or length(trim(training_city)) between 1 and 80),
  training_area text null check (training_area is null or length(trim(training_area)) between 1 and 80),
  -- ISO weekday: Monday 1 through Sunday 7. Lists are the person's own preference,
  -- not geolocation, published workout schedules or permission to match people.
  available_run_days smallint[] not null default '{}'::smallint[],
  protected_days smallint[] not null default '{}'::smallint[],
  preferred_hard_days smallint[] not null default '{}'::smallint[],
  goal_kind text null check (goal_kind is null or goal_kind in
    ('consistency','5k','10k','half_marathon','marathon','other')),
  race_name text null check (race_name is null or length(trim(race_name)) between 1 and 120),
  race_on date null,
  recent_weekly_distance numeric(7,2) null
    check (recent_weekly_distance is null or recent_weekly_distance between 0 and 300),
  recent_long_run_minutes smallint null
    check (recent_long_run_minutes is null or recent_long_run_minutes between 0 and 600),
  coaching_interest boolean not null default false,
  onboarding_finished_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint form_member_available_days_valid check (
    available_run_days <@ array[1,2,3,4,5,6,7]::smallint[] and
    cardinality(available_run_days) <= 7
  ),
  constraint form_member_protected_days_valid check (
    protected_days <@ array[1,2,3,4,5,6,7]::smallint[] and
    cardinality(protected_days) <= 7
  ),
  constraint form_member_hard_days_valid check (
    preferred_hard_days <@ array[1,2,3,4,5,6,7]::smallint[] and
    cardinality(preferred_hard_days) <= 7
  ),
  constraint form_member_no_protected_runs check (
    not (available_run_days && protected_days)
  ),
  constraint form_member_hard_days_available check (
    preferred_hard_days <@ available_run_days
  )
);

create index if not exists form_member_journeys_entry_path_idx
  on public.form_member_journeys(entry_path);

alter table public.form_member_journeys enable row level security;

-- Every member owns exactly their own preferences. No coach-wide public SELECT,
-- no name-based or email-based join, and no service_role credential in the app.
revoke all on public.form_member_journeys from public, anon, authenticated;
grant select, insert, update, delete on public.form_member_journeys to authenticated;

create policy form_member_journeys_select_self on public.form_member_journeys
  for select to authenticated using ((select auth.uid()) = account_id);
create policy form_member_journeys_insert_self on public.form_member_journeys
  for insert to authenticated with check ((select auth.uid()) = account_id);
create policy form_member_journeys_update_self on public.form_member_journeys
  for update to authenticated using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);
create policy form_member_journeys_delete_self on public.form_member_journeys
  for delete to authenticated using ((select auth.uid()) = account_id);

comment on table public.form_member_journeys is
  'Private account-level FORM entry, preferences and opt-in coaching interest; not a coached athlete assignment, public profile, training plan, event RSVP or matchmaking consent.';

-- Do not automatically create athlete memberships, collective public person rows,
-- match profiles or plan assignments on first login. Each has an independent
-- verified claim/consent/activation process.
