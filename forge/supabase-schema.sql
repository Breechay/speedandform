-- ============================================================
-- FORGE COACH INTERFACE — SUPABASE SCHEMA
-- Run this in your Supabase SQL editor (project: zlhxvzgublgtuxplcjjl)
-- ============================================================

-- ── Coach profiles ──────────────────────────────────────────
-- Coaches are Supabase auth.users with role = 'coach'
-- This table extends auth.users with coach-specific fields.

create table if not exists coach_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  created_at  timestamptz default now()
);

alter table coach_profiles enable row level security;

create policy "Coach can read own profile"
  on coach_profiles for select
  using (auth.uid() = id);

create policy "Coach can update own profile"
  on coach_profiles for update
  using (auth.uid() = id);

-- ── Athletes ─────────────────────────────────────────────────
-- Athletes are also auth.users with role = 'athlete'
-- coach_athletes links coaches to the athletes they manage.

create table if not exists athletes (
  id          uuid primary key references auth.users(id) on delete cascade,
  first_name  text not null,
  last_name   text not null,
  email       text not null unique,
  created_at  timestamptz default now()
);

alter table athletes enable row level security;

create table if not exists coach_athletes (
  id         uuid primary key default gen_random_uuid(),
  coach_id   uuid not null references coach_profiles(id) on delete cascade,
  athlete_id uuid not null references athletes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(coach_id, athlete_id)
);

alter table coach_athletes enable row level security;

create policy "Coach can read own athlete relationships"
  on coach_athletes for select
  using (auth.uid() = coach_id);

create policy "Coach can insert athlete relationships"
  on coach_athletes for insert
  with check (auth.uid() = coach_id);

-- ── Program Templates ────────────────────────────────────────

create table if not exists program_templates (
  id               uuid primary key default gen_random_uuid(),
  coach_id         uuid not null references coach_profiles(id) on delete cascade,
  name             text not null,
  source_label     text,
  target_weeks     int check (target_weeks between 4 and 6),
  days_per_week    int check (days_per_week between 3 and 5),
  default_rest_seconds int,
  notes            text,
  status           text not null default 'Draft'
                     check (status in ('Draft', 'Published', 'Archived')),
  is_template      boolean not null default false,
  structure        jsonb not null default '{"blocks":[]}'::jsonb,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table program_templates enable row level security;

create policy "Coach can CRUD own programs"
  on program_templates for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

-- auto-update updated_at
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger program_templates_updated_at
  before update on program_templates
  for each row execute function touch_updated_at();

-- ── Program Assignments ──────────────────────────────────────

create table if not exists program_assignments (
  id                  uuid primary key default gen_random_uuid(),
  program_template_id uuid not null references program_templates(id) on delete restrict,
  athlete_id          uuid not null references athletes(id) on delete cascade,
  coach_id            uuid not null references coach_profiles(id),
  start_date          date not null,
  status              text not null default 'active'
                        check (status in ('active', 'paused', 'completed')),
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table program_assignments enable row level security;

create policy "Coach can manage assignments"
  on program_assignments for all
  using (auth.uid() = coach_id)
  with check (auth.uid() = coach_id);

create trigger program_assignments_updated_at
  before update on program_assignments
  for each row execute function touch_updated_at();

-- ── Session Instances ────────────────────────────────────────

create table if not exists session_instances (
  id                  uuid primary key default gen_random_uuid(),
  assignment_id       uuid not null references program_assignments(id) on delete cascade,
  athlete_id          uuid not null references athletes(id),
  session_template_id text not null,  -- references session.id within program structure
  session_name        text not null,
  scheduled_date      date not null,
  status              text not null default 'planned'
                        check (status in ('planned', 'completed', 'skipped')),
  completed_at        timestamptz,
  duration_seconds    int,
  exercise_logs       jsonb default '[]'::jsonb,
  created_at          timestamptz default now()
);

alter table session_instances enable row level security;

create policy "Coach can read sessions for their athletes"
  on session_instances for select
  using (
    exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
      and ca.athlete_id = session_instances.athlete_id
    )
  );

-- ── Useful views ─────────────────────────────────────────────

-- Roster view: one row per athlete with current program info
create or replace view coach_roster as
select
  ca.coach_id,
  a.id as athlete_id,
  a.first_name,
  a.last_name,
  a.email,
  pa.id as assignment_id,
  pa.program_template_id,
  pt.name as program_name,
  pa.start_date,
  pa.status as assignment_status,
  (
    select max(si.completed_at)
    from session_instances si
    where si.athlete_id = a.id
    and si.status = 'completed'
  ) as last_session_at,
  (
    select count(*)
    from session_instances si
    where si.assignment_id = pa.id
    and si.status = 'completed'
  ) as sessions_completed,
  (
    select count(*)
    from session_instances si
    where si.assignment_id = pa.id
  ) as sessions_total
from coach_athletes ca
join athletes a on a.id = ca.athlete_id
left join program_assignments pa on pa.athlete_id = a.id and pa.status = 'active'
left join program_templates pt on pt.id = pa.program_template_id;
