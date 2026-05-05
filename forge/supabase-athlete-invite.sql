-- ============================================================
-- FORGE ATHLETE INVITE FLOW — SCHEMA ADDITIONS
-- Run in Supabase SQL Editor (project: zlhxvzgublgtuxplcjjl)
-- Safe to run multiple times — uses IF NOT EXISTS throughout
-- ============================================================

-- 1. Add auth_user_id to athletes table so we can link Supabase
--    auth users to existing athlete slugs
alter table athletes
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists email text;

create unique index if not exists athletes_auth_user_id
  on athletes (auth_user_id) where auth_user_id is not null;

-- 2. Invite codes table
--    Coach generates a code; athlete enters it on signup to link themselves
create table if not exists athlete_invites (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,          -- 6-char uppercase code, e.g. "FRG4K2"
  coach_id     uuid not null references coach_profiles(id) on delete cascade,
  athlete_slug text,                          -- optional: pre-assign to a specific slug
  label        text,                          -- optional: "Marcus W" so coach knows who it's for
  used_by      uuid references auth.users(id) on delete set null,
  used_at      timestamptz,
  expires_at   timestamptz not null default (now() + interval '7 days'),
  created_at   timestamptz not null default now()
);

alter table athlete_invites enable row level security;

-- Coach can create/read/delete their own invites
create policy "Coach manages own invites"
  on athlete_invites for all
  using (
    coach_id in (select id from coach_profiles where id = auth.uid())
  )
  with check (
    coach_id in (select id from coach_profiles where id = auth.uid())
  );

-- Anyone can read an invite by code (for the accept flow — anon read)
create policy "Anyone can read invite by code"
  on athlete_invites for select
  using (true);

-- 3. Athlete profiles table
--    Decoupled from the existing athletes table to avoid breaking iOS.
--    When an athlete signs up via web, we create a row here.
--    If they have an existing slug (invited with pre-assigned slug), we link.
create table if not exists athlete_profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  first_name   text not null,
  last_name    text not null,
  email        text not null,
  slug         text unique,                   -- links to athletes.slug if exists
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table athlete_profiles enable row level security;

create policy "Athlete can read/update own profile"
  on athlete_profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Coach can read athlete profiles for their roster
create policy "Coach can read linked athlete profiles"
  on athlete_profiles for select
  using (
    id in (
      select au.auth_user_id
      from coach_athletes ca
      join athletes au on au.slug = ca.athlete_id
      where ca.coach_id in (select id from coach_profiles where id = auth.uid())
    )
    or
    -- Also allow reading by coach_athletes.athlete_id directly
    slug in (
      select ca.athlete_id
      from coach_athletes ca
      where ca.coach_id in (select id from coach_profiles where id = auth.uid())
    )
  );

-- 4. Update coach_athletes to support auth_user_id linking
alter table coach_athletes
  add column if not exists athlete_auth_id uuid references auth.users(id) on delete set null;

-- 5. Update coach_roster view to include athlete profile data
create or replace view coach_roster as
select
  ca.coach_id,
  coalesce(a.slug, ap.slug, ca.athlete_id)    as athlete_id,
  coalesce(
    ap.first_name,
    split_part(a.name, ' ', 1),
    ca.athlete_id
  )                                             as first_name,
  coalesce(
    ap.last_name,
    nullif(trim(substring(a.name from position(' ' in a.name))), ''),
    ''
  )                                             as last_name,
  coalesce(ap.email, a.email, '')               as email,
  a.name                                        as full_name,
  pa.id                                         as assignment_id,
  pa.program_template_id,
  pt.name                                       as program_name,
  pa.start_date,
  pa.status                                     as assignment_status,
  (
    select max(si.completed_at)
    from session_instances si
    where si.athlete_id = coalesce(a.slug, ca.athlete_id)
      and si.status = 'completed'
  )                                             as last_session_at,
  (
    select count(*)::int
    from session_instances si
    where si.assignment_id = pa.id
      and si.status = 'completed'
  )                                             as sessions_completed,
  (
    select count(*)::int
    from session_instances si
    where si.assignment_id = pa.id
  )                                             as sessions_total
from coach_athletes ca
left join athletes a       on a.slug = ca.athlete_id
left join athlete_profiles ap on ap.slug = ca.athlete_id
                               or ap.id = ca.athlete_auth_id
left join program_assignments pa
  on pa.athlete_id = coalesce(a.slug, ca.athlete_id)
  and pa.status = 'active'
left join program_templates pt on pt.id = pa.program_template_id;
