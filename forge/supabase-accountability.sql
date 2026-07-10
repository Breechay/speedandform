-- ============================================================
-- ROD ACCOUNTABILITY SYNC TABLES
-- Run in Supabase SQL Editor after supabase-sessions.sql
-- ============================================================

-- Intake logs (protein anchors, alcohol) — synced from iOS ForgeSessionLogStore
create table if not exists intake_logs (
  id            uuid primary key,
  athlete_id    uuid not null references auth.users(id) on delete cascade,
  program_id    text not null,
  eaten_at      timestamptz not null,
  text          text,
  anchor        text check (anchor in ('BREAKFAST', 'LUNCH', 'DINNER', 'BACKUP')),
  had_protein   boolean,
  alcohol       boolean not null default false,
  recorded_at   timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

create index if not exists intake_logs_athlete_eaten_idx
  on intake_logs (athlete_id, eaten_at desc);

alter table intake_logs enable row level security;

drop policy if exists "Athlete reads own intake logs" on intake_logs;
create policy "Athlete reads own intake logs"
  on intake_logs for select using (auth.uid() = athlete_id);

drop policy if exists "Athlete upserts own intake logs" on intake_logs;
create policy "Athlete upserts own intake logs"
  on intake_logs for insert with check (auth.uid() = athlete_id);

drop policy if exists "Athlete updates own intake logs" on intake_logs;
create policy "Athlete updates own intake logs"
  on intake_logs for update using (auth.uid() = athlete_id);

drop policy if exists "Coach reads athlete intake logs" on intake_logs;
create policy "Coach reads athlete intake logs"
  on intake_logs for select
  using (
    exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_auth_id = intake_logs.athlete_id
    )
  );


-- Waist check-ins — coach-entered at gym or athlete (iOS)
create table if not exists waist_check_ins (
  id            uuid primary key,
  athlete_id    uuid not null references auth.users(id) on delete cascade,
  program_id    text not null,
  recorded_at   timestamptz not null,
  waist_inches  real not null check (waist_inches > 0 and waist_inches < 100),
  entered_by    text not null check (entered_by in ('coach', 'athlete')),
  created_at    timestamptz not null default now()
);

create index if not exists waist_check_ins_athlete_recorded_idx
  on waist_check_ins (athlete_id, recorded_at desc);

alter table waist_check_ins enable row level security;

drop policy if exists "Athlete reads own waist check-ins" on waist_check_ins;
create policy "Athlete reads own waist check-ins"
  on waist_check_ins for select using (auth.uid() = athlete_id);

drop policy if exists "Athlete upserts own waist check-ins" on waist_check_ins;
create policy "Athlete upserts own waist check-ins"
  on waist_check_ins for insert with check (auth.uid() = athlete_id);

drop policy if exists "Athlete updates own waist check-ins" on waist_check_ins;
create policy "Athlete updates own waist check-ins"
  on waist_check_ins for update using (auth.uid() = athlete_id);

drop policy if exists "Coach reads athlete waist check-ins" on waist_check_ins;
create policy "Coach reads athlete waist check-ins"
  on waist_check_ins for select
  using (
    exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_auth_id = waist_check_ins.athlete_id
    )
  );

drop policy if exists "Coach inserts waist for linked athletes" on waist_check_ins;
create policy "Coach inserts waist for linked athletes"
  on waist_check_ins for insert
  with check (
    entered_by = 'coach'
    and exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_auth_id = waist_check_ins.athlete_id
    )
  );


-- App open heartbeat — silence detection for coach dashboard
create table if not exists athlete_app_state (
  athlete_id    uuid primary key references auth.users(id) on delete cascade,
  last_open_at  timestamptz not null,
  updated_at    timestamptz not null default now()
);

alter table athlete_app_state enable row level security;

drop policy if exists "Athlete reads own app state" on athlete_app_state;
create policy "Athlete reads own app state"
  on athlete_app_state for select using (auth.uid() = athlete_id);

drop policy if exists "Athlete upserts own app state" on athlete_app_state;
create policy "Athlete upserts own app state"
  on athlete_app_state for insert with check (auth.uid() = athlete_id);

drop policy if exists "Athlete updates own app state" on athlete_app_state;
create policy "Athlete updates own app state"
  on athlete_app_state for update using (auth.uid() = athlete_id);

drop policy if exists "Coach reads athlete app state" on athlete_app_state;
create policy "Coach reads athlete app state"
  on athlete_app_state for select
  using (
    exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_auth_id = athlete_app_state.athlete_id
    )
  );


-- Strength session upsert fix (iOS sync uses upsert, not insert-only)
drop policy if exists "Athlete updates own strength sessions" on strength_sessions;
create policy "Athlete updates own strength sessions"
  on strength_sessions for update using (auth.uid() = athlete_id);

drop policy if exists "Athlete updates own set logs" on set_logs;
create policy "Athlete updates own set logs"
  on set_logs for update
  using (
    session_id in (select id from strength_sessions where athlete_id = auth.uid())
  );
