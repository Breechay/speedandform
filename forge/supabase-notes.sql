create table if not exists coach_notes (
  id            uuid primary key default gen_random_uuid(),
  coach_id      uuid not null references coach_profiles(id) on delete cascade,
  athlete_id    text not null,
  content       text not null,
  is_shared     boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Backward-compat: some existing environments may have coach_notes without is_shared.
alter table coach_notes
  add column if not exists is_shared boolean not null default false;

alter table coach_notes enable row level security;

drop policy if exists "Coach manages own notes" on coach_notes;
create policy "Coach manages own notes"
  on coach_notes for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

drop policy if exists "Athlete reads shared notes" on coach_notes;
create policy "Athlete reads shared notes"
  on coach_notes for select
  using (
    is_shared = true
    and (
      athlete_id in (select slug from athlete_profiles where id = auth.uid())
      or athlete_id = auth.uid()::text
    )
  );
