-- Generic athlete measurements. A measurement is raw evidence; interpretation
-- remains in coaching notes, reads and decisions.

create table public.athlete_measurements (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  measurement_type text not null check (btrim(measurement_type) <> ''),
  value numeric not null,
  unit text not null check (btrim(unit) <> ''),
  measured_at date not null,
  method text,
  source text not null check (btrim(source) <> ''),
  metadata jsonb not null default '{}'::jsonb,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (athlete_id, measurement_type, measured_at, value, unit)
);

comment on table public.athlete_measurements is
  'Raw, dated athlete measurements. Values are evidence and carry no automatic coaching interpretation.';

create index athlete_measurements_athlete_type_date_idx
  on public.athlete_measurements (athlete_id, measurement_type, measured_at desc, created_at desc);

alter table public.athlete_measurements enable row level security;

create policy athlete_measurements_member_read on public.athlete_measurements
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy athlete_measurements_coach_insert on public.athlete_measurements
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and authored_by = auth.uid());
create policy athlete_measurements_coach_update on public.athlete_measurements
  for update to authenticated
  using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));
create policy athlete_measurements_coach_delete on public.athlete_measurements
  for delete to authenticated using (public.is_coach_member(athlete_id));

grant select, insert, update, delete on public.athlete_measurements to authenticated;

-- The only settled historical reading supplied by the Console study.
insert into public.athlete_measurements
  (athlete_id, measurement_type, value, unit, measured_at, method, source, authored_by)
select a.id, 'body_fat', 13.9, '%', date '2026-08-21', 'Smart scale estimate', 'supplied', admin.user_id
  from public.athletes a
  cross join lateral (
    select user_id from public.coaching_administrators
     where status = 'active' order by created_at limit 1
  ) admin
 where a.slug = 'rod'
on conflict (athlete_id, measurement_type, measured_at, value, unit) do nothing;
