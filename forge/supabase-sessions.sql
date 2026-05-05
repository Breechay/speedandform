-- ============================================================
-- FORM SESSION SYNC TABLES
-- Run in Supabase SQL Editor after supabase-athlete-invite.sql
-- ============================================================

create table if not exists strength_sessions (
  id               uuid primary key default gen_random_uuid(),
  athlete_id       uuid not null references auth.users(id) on delete cascade,
  session_name     text not null,
  started_at       timestamptz not null,
  completed_at     timestamptz not null,
  duration_seconds integer,
  feedback         text check (feedback in ('easy', 'medium', 'hard')),
  note             text,
  created_at       timestamptz not null default now()
);

alter table strength_sessions enable row level security;

create policy "Athlete reads own strength sessions"
  on strength_sessions for select
  using (auth.uid() = athlete_id);

create policy "Coach reads athlete strength sessions"
  on strength_sessions for select
  using (
    athlete_id in (
      select ca.athlete_auth_id
      from coach_athletes ca
      where ca.coach_id = auth.uid()
    )
  );

-- iOS app writes sessions via service key (bypasses RLS)
create policy "Service role insert"
  on strength_sessions for insert
  with check (true);


create table if not exists set_logs (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references strength_sessions(id) on delete cascade,
  movement_id   text not null,
  movement_name text not null,
  set_index     integer not null,
  weight        real,
  reps          integer,
  is_pr         boolean not null default false,
  completed_at  timestamptz not null,
  created_at    timestamptz not null default now()
);

alter table set_logs enable row level security;

create policy "Athlete reads own set logs"
  on set_logs for select
  using (
    session_id in (
      select id from strength_sessions where athlete_id = auth.uid()
    )
  );

create policy "Coach reads athlete set logs"
  on set_logs for select
  using (
    session_id in (
      select ss.id from strength_sessions ss
      join coach_athletes ca on ca.athlete_auth_id = ss.athlete_id
      where ca.coach_id = auth.uid()
    )
  );

create policy "Service role insert set logs"
  on set_logs for insert
  with check (true);


create table if not exists running_sessions (
  id                        uuid primary key default gen_random_uuid(),
  athlete_id                uuid not null references auth.users(id) on delete cascade,
  session_type              text not null check (session_type in ('threshold', 'long_run', 'easy', 'speed')),
  started_at                timestamptz not null,
  completed_at              timestamptz,
  duration_seconds          integer,
  distance_meters           real,
  avg_pace_seconds_per_km   real,
  in_band                   boolean,
  note                      text,
  created_at                timestamptz not null default now()
);

alter table running_sessions enable row level security;

create policy "Athlete reads own running sessions"
  on running_sessions for select
  using (auth.uid() = athlete_id);

create policy "Coach reads athlete running sessions"
  on running_sessions for select
  using (
    athlete_id in (
      select ca.athlete_auth_id
      from coach_athletes ca
      where ca.coach_id = auth.uid()
    )
  );

create policy "Service role insert running sessions"
  on running_sessions for insert
  with check (true);
