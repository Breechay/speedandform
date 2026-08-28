-- Brice authors an effort target for quality work, and it was never written down.
--
-- Interval, threshold and race-pace sessions are designed to cost RPE 7 to 8. That
-- has been true of every session he built by hand — his own 4 × 1 mi prescriptions
-- carry 7–8 — and it was simply absent from the two 1 km sessions, which is why
-- Hope's Thursday rendered "effort not prescribed" beside an RPE of 7.
--
-- A default is not a UI string. If it lived in the renderer, a session evaluated
-- today and the same session re-evaluated next year would disagree the moment the
-- default changed, and nothing in the record would say why. So it is versioned,
-- carries who authored it and when, and is RESOLVED AND SNAPSHOT into each
-- prescription. The snapshot is what evaluation reads; the default only decides
-- what a new prescription inherits.
--
-- An explicitly authored effort always wins. The default fills a silence; it never
-- overrides a decision.

create table public.effort_defaults (
  id uuid primary key default gen_random_uuid(),
  -- Which work this speaks for. Easy, recovery and long runs keep their own
  -- authored targets and are deliberately not covered here.
  session_family text not null check (session_family in ('interval', 'threshold', 'race_pace')),
  rpe_low smallint not null check (rpe_low between 1 and 10),
  rpe_high smallint not null check (rpe_high between 1 and 10),
  version text not null,
  note text not null check (length(btrim(note)) > 0),
  authored_by uuid references auth.users(id) on delete set null,
  authored_at timestamptz not null default now(),
  constraint effort_default_reads_forwards check (rpe_low <= rpe_high),
  unique (session_family, version)
);

alter table public.effort_defaults enable row level security;
create policy effort_defaults_read on public.effort_defaults
  for select to authenticated using (true);

create trigger effort_defaults_immutable
  before update or delete on public.effort_defaults
  for each row execute function public.prevent_immutable_change();

insert into public.effort_defaults (session_family, rpe_low, rpe_high, version, note)
values
  ('interval',   7, 8, 'v1', 'Quality work is designed to cost 7 to 8. A 6 is outstanding — the session was achieved with headroom — and repeated 6s are a signal the paces have gone stale, never an instruction to accelerate the plan.'),
  ('threshold',  7, 8, 'v1', 'Quality work is designed to cost 7 to 8.'),
  ('race_pace',  7, 8, 'v1', 'Quality work is designed to cost 7 to 8.');

-- Where a prescription's effort came from. Without this, an inherited 7–8 and an
-- authored 7–8 are the same two numbers, and the difference decides whether editing
-- the default should ever have touched this session.
alter table public.planned_session_components
  add column if not exists rpe_source text
    check (rpe_source is null or rpe_source in ('authored', 'inherited'));
alter table public.planned_session_components
  add column if not exists rpe_default_version text;

comment on column public.planned_session_components.rpe_source is
  'authored: Brice set this effort on this session. inherited: it was resolved from the effort default at publication and snapshot here, so the evaluation stays reproducible after the default moves.';

update public.planned_session_components
   set rpe_source = 'authored'
 where rpe_low is not null and rpe_source is null;

-- The two sessions the target was missing from, corrected as NEW VERSIONS.
--
-- Hope 2026-08-27 and José's second 2026-08-25, both "3 to 6 × 1 km". The earlier
-- version is not touched: it is what was actually published, and a record that
-- quietly becomes correct is worth less than one that shows the correction.
do $$
declare
  target uuid;
  latest record;
  new_version uuid;
begin
  foreach target in array array[
    '4cb82dc9-70d6-4216-a1f7-dc7616c01450'::uuid,  -- Hope, 27 August
    'e95b8765-54ef-44d9-aaaa-7a0cf1341fae'::uuid   -- José, 25 August, the double
  ] loop
    select * into latest from public.planned_session_versions
     where planned_session_id = target order by version_number desc limit 1;
    if latest.id is null then raise exception 'no version to correct on session %', target; end if;

    if exists (select 1 from public.planned_session_components
                where version_id = latest.id and role = 'work' and rpe_low is not null) then
      raise notice 'session % already carries an effort target; leaving it alone', target;
      continue;
    end if;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, prescribed_duration_minutes, intent, details, change_reason, authored_by)
    values (latest.athlete_id, target, latest.version_number + 1, latest.title,
            latest.prescribed_distance, latest.distance_unit, latest.prescribed_duration_minutes,
            latest.intent, latest.details,
            'The quality-session effort target of RPE 7 to 8 was omitted from structured entry. Resolved from effort_defaults v1 and snapshot onto the work.',
            latest.authored_by)
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, repeat_count, distance, distance_unit,
       duration_seconds, recovery_seconds, recovery_kind, pace_low, pace_high,
       rpe_low, rpe_high, rpe_source, rpe_default_version,
       repeat_minimum, repeat_target, repeat_progression, repeat_ceiling)
    select athlete_id, new_version, position, role, shape, repeat_count, distance, distance_unit,
           duration_seconds, recovery_seconds, recovery_kind, pace_low, pace_high,
           case when role = 'work' then 7 else rpe_low end,
           case when role = 'work' then 8 else rpe_high end,
           case when role = 'work' then 'inherited' else rpe_source end,
           case when role = 'work' then 'v1' else rpe_default_version end,
           repeat_minimum, repeat_target, repeat_progression, repeat_ceiling
      from public.planned_session_components
     where version_id = latest.id;

    raise notice 'session % corrected to version %', target, latest.version_number + 1;
  end loop;
end $$;

do $$
declare missing integer;
begin
  select count(*) into missing
    from public.planned_sessions ps
    join lateral (select id from public.planned_session_versions v
                   where v.planned_session_id = ps.id
                   order by version_number desc limit 1) v on true
    join public.planned_session_components k on k.version_id = v.id
   where ps.id in ('4cb82dc9-70d6-4216-a1f7-dc7616c01450', 'e95b8765-54ef-44d9-aaaa-7a0cf1341fae')
     and k.role = 'work' and k.rpe_low is null;
  if missing > 0 then raise exception '% corrected sessions still carry no effort target', missing; end if;
end $$;
