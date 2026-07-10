-- ============================================================
-- STORED JUDGMENT — coach-entered Today line for athlete Forge
-- Run in Supabase SQL Editor after supabase-accountability.sql
-- ============================================================

create table if not exists coach_judgments (
  id                      uuid primary key default gen_random_uuid(),
  coach_id                uuid not null references coach_profiles(id) on delete cascade,
  athlete_auth_id         uuid not null references auth.users(id) on delete cascade,
  program_id              text not null,
  text                    text not null check (char_length(trim(text)) > 0),
  is_active               boolean not null default true,
  expires_at              timestamptz,
  clear_after_next_lift   boolean not null default false,
  cleared_at              timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index if not exists coach_judgments_athlete_program_active_idx
  on coach_judgments (athlete_auth_id, program_id, is_active, created_at desc);

alter table coach_judgments enable row level security;

drop policy if exists "Coach manages judgments for linked athletes" on coach_judgments;
create policy "Coach manages judgments for linked athletes"
  on coach_judgments for all
  using (
    coach_id = auth.uid()
    and exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_auth_id = coach_judgments.athlete_auth_id
    )
  )
  with check (
    coach_id = auth.uid()
    and exists (
      select 1 from coach_athletes ca
      where ca.coach_id = auth.uid()
        and ca.athlete_auth_id = coach_judgments.athlete_auth_id
    )
  );

drop policy if exists "Athlete reads active judgments" on coach_judgments;
create policy "Athlete reads active judgments"
  on coach_judgments for select
  using (
    auth.uid() = athlete_auth_id
    and is_active = true
    and cleared_at is null
    and (expires_at is null or expires_at > now())
  );

drop policy if exists "Athlete clears judgment after lift" on coach_judgments;
create policy "Athlete clears judgment after lift"
  on coach_judgments for update
  using (
    auth.uid() = athlete_auth_id
    and clear_after_next_lift = true
    and cleared_at is null
    and is_active = true
  )
  with check (
    auth.uid() = athlete_auth_id
  );
