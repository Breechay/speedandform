-- What a session actually is, stored rather than written in a sentence.
--
-- The console was reducing training to mileage. "6 mi" cannot distinguish six
-- continuous miles at race pace from three doubles with floats between from a
-- six mile total containing a warm up, some repetitions and a cool down. All
-- three read as six and none of them establishes the same proof.
--
-- FORM-iOS already models this: FORMV3WorkSection carries ordered pieces, a
-- recovery kind and a construct. This mirrors that shape. Ordered child rows,
-- because a session is a sequence, and a flat column per idea would be wrong by
-- the second session that needed a third component.
--
-- Prose is not a source. title and shape stay for reading; nothing reads dose out
-- of them at runtime, and the key sessions are backfilled explicitly below.

create table public.planned_session_components (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  version_id uuid not null references public.planned_session_versions(id) on delete cascade,
  -- The order the athlete meets them in.
  position smallint not null check (position > 0),
  role text not null check (role in ('warm_up', 'work', 'recovery', 'cool_down')),
  -- The distinction the whole table exists for.
  shape text not null check (shape in ('continuous', 'repetitions')),
  repeat_count smallint check (repeat_count is null or repeat_count > 0),
  -- Per repetition when the shape is repetitions, otherwise the whole component.
  distance numeric(6,2) check (distance is null or distance > 0),
  distance_unit text check (distance_unit in ('mi', 'km')),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  -- Between repetitions. A float is not a rest, and the difference decides
  -- whether the session can answer anything.
  recovery_seconds integer check (recovery_seconds is null or recovery_seconds >= 0),
  recovery_kind text check (recovery_kind in ('float', 'easy', 'jog', 'standing')),
  pace_low text,
  pace_high text,
  rpe_low smallint check (rpe_low is null or rpe_low between 1 and 10),
  rpe_high smallint check (rpe_high is null or rpe_high between 1 and 10),
  created_at timestamptz not null default now(),
  unique (version_id, position),
  constraint components_repeat_matches_shape check (
    (shape = 'repetitions' and repeat_count is not null)
    or (shape = 'continuous' and repeat_count is null)),
  constraint components_measured check (distance is not null or duration_seconds is not null),
  constraint components_distance_unit check (distance is null or distance_unit is not null),
  -- Recovery sits between repetitions, so it cannot belong to a continuous one.
  constraint components_recovery_needs_repetitions check (
    recovery_seconds is null or shape = 'repetitions'),
  constraint components_recovery_is_named check (
    (recovery_seconds is null and recovery_kind is null)
    or (recovery_seconds is not null and recovery_kind is not null))
);

create index planned_session_components_version_idx
  on public.planned_session_components (version_id, position);

alter table public.planned_session_components enable row level security;

-- A version is immutable, so its components are too. A revision writes a new
-- version with its own components; nothing edits a prescription in place.
create policy components_member_read on public.planned_session_components
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy components_coach_insert on public.planned_session_components
  for insert to authenticated with check (public.is_coach_member(athlete_id));

comment on table public.planned_session_components is
  'The ordered anatomy of a prescription: warm up, work, cool down. Repetitions and continuous work are different objects and must never be collapsed into a total distance. Never derived from title or shape at runtime.';
comment on column public.planned_session_components.recovery_kind is
  'float means keep running under control; easy, jog and standing are different instructions. Recorded because a recovery run slow enough to be rest buys faster repetitions and destroys the sessions ability to answer anything.';

-- ── Explicit backfill of the authored key sessions ──────────────────────────
--
-- Race pace only. These are the sessions the ladder is testing, they are the ones
-- the runway shows, and each one is authored here by hand from the block that
-- created it. Threshold, speed, easy and long runs keep prose for now and are
-- honestly shown without a structured dose rather than guessed at.
--
-- Warm up and cool down follow the FORM-iOS authoring, which is the authority for
-- what a session is: 20 to 30 minutes easy in, ten easy out.

do $$
declare
  r record;
  v_id uuid;
  a_id uuid;
begin
  for r in
    select * from (values
      -- date, warm up sec, shape, reps, distance, recovery sec, cool down sec
      (date '2026-08-25', 1200, 'repetitions',  4, 1.0,  180, 600),
      (date '2026-09-01', 1200, 'repetitions',  3, 2.0,  180, 600),
      (date '2026-09-08', 1200, 'continuous',  null, 5.0,  null, 600),
      (date '2026-09-22', 1200, 'continuous',  null, 6.0,  null, 600),
      (date '2026-10-06', 1200, 'continuous',  null, 6.0,  null, 600),
      (date '2026-10-20', 1800, 'continuous',  null, 8.0,  null, 600),
      (date '2026-11-03', 1800, 'continuous',  null, 8.0,  null, 600),
      (date '2026-11-10', 1800, 'continuous',  null, 10.0, null, 600),
      (date '2026-11-17', 1200, 'continuous',  null, 6.0,  null, 600),
      (date '2026-11-24',  900, 'continuous',  null, 4.0,  null, 600)
    ) as t(on_date, wu, shp, reps, dist, rec, cd)
  loop
    for v_id, a_id in
      select v.id, v.athlete_id
        from public.planned_session_versions v
        join public.planned_sessions ps on ps.id = v.planned_session_id
        join public.athletes a on a.id = ps.athlete_id
       where a.slug in ('hope', 'jose', 'marcus')
         and ps.scheduled_on = r.on_date
         and v.title ilike '%race pace%'
         and not exists (select 1 from public.planned_session_components c where c.version_id = v.id)
    loop
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count,
         distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
         pace_low, pace_high, rpe_low, rpe_high)
      values
        (a_id, v_id, 1, 'warm_up',  'continuous', null,
         null, null, r.wu, null, null, null, null, 4, 5),
        (a_id, v_id, 2, 'work', r.shp, r.reps,
         r.dist, 'mi', null, r.rec, case when r.rec is null then null else 'float' end,
         '6:30', '6:45', 7, 8),
        (a_id, v_id, 3, 'cool_down', 'continuous', null,
         null, null, r.cd, null, null, null, null, 4, 5);
    end loop;
  end loop;
end $$;

-- ── Validation ──────────────────────────────────────────────────────────────

do $$
declare bad integer; detail text;
begin
  -- Every race pace session in scope now carries a structured dose.
  select count(*) into bad
    from public.planned_session_versions v
    join public.planned_sessions ps on ps.id = v.planned_session_id
    join public.athletes a on a.id = ps.athlete_id
   where a.slug in ('hope', 'jose', 'marcus')
     and v.title ilike '%race pace%'
     and not exists (select 1 from public.planned_session_components c where c.version_id = v.id);
  if bad > 0 then raise exception '% race pace versions have no structured dose', bad; end if;

  -- The work component's total must equal the authored prescribed distance, or
  -- the structure disagrees with the plan it came from.
  select count(*) into bad
    from public.planned_session_components c
    join public.planned_session_versions v on v.id = c.version_id
   where c.role = 'work' and v.prescribed_distance is not null
     and (c.distance * coalesce(c.repeat_count, 1)) <> v.prescribed_distance;
  if bad > 0 then raise exception '% work components disagree with prescribed_distance', bad; end if;

  -- Every repetition set names its recovery, and names it as a float.
  select count(*) into bad
    from public.planned_session_components
   where shape = 'repetitions' and (recovery_seconds is null or recovery_kind is null);
  if bad > 0 then raise exception '% repetition sets do not name their recovery', bad; end if;

  select string_agg(format('%s %s%s', ps.scheduled_on,
           case when c.shape = 'repetitions' then c.repeat_count || ' x ' else '' end,
           c.distance || 'mi'), '  ' order by ps.scheduled_on)
    into detail
    from public.planned_session_components c
    join public.planned_session_versions v on v.id = c.version_id
    join public.planned_sessions ps on ps.id = v.planned_session_id
    join public.athletes a on a.id = ps.athlete_id
   where a.slug = 'marcus' and c.role = 'work';
  raise notice 'marcus race pace doses: %', detail;
end $$;
