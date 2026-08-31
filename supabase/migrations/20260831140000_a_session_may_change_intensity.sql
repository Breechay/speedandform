-- A long run that finishes at race pace is one session with two intensities.
--
-- The existing guard requires every work component to carry its version's band
-- exactly. It was written against a real defect -- a backfill spread 6:30-6:45
-- across a warm up and claimed twenty easy minutes were run at race pace -- and the
-- rule it settled on assumed one intensity per session.
--
-- Thirteen long runs per athlete are pace-open and nothing in any campaign teaches
-- a late finish, which is the job the race actually asks for at mile ten. Authoring
-- that means one run holding an open first portion and a banded final block, and
-- the guard as written refuses it.
--
-- The intent is kept and the assumption is dropped:
--
--   version carries a band  -> every work component must match it, exactly as now.
--                              A single-intensity session cannot have a component
--                              inventing a pace, which is the defect that mattered.
--   version carries none    -> the session is authored as mixed, and each work
--                              component carries its own band or none.
--
-- Non-work roles still carry no band at all. A warm up is authored against effort
-- and that has not changed.

create or replace function public.component_pace_follows_prescription()
returns trigger language plpgsql as $$
declare authored_low text; authored_high text; version_is_mixed boolean;
begin
  if new.role <> 'work' then
    if new.pace_low is not null or new.pace_high is not null then
      raise exception 'only the work component carries a pace band; % is authored against effort', new.role;
    end if;
    return new;
  end if;

  select v.pace_low, v.pace_high, (v.pace_low is null and v.pace_high is null)
    into authored_low, authored_high, version_is_mixed
    from public.planned_session_versions v where v.id = new.version_id;

  -- A version declaring no band is declaring a session that changes intensity.
  -- Its work components speak for themselves.
  if version_is_mixed then
    return new;
  end if;

  if new.pace_low is distinct from authored_low or new.pace_high is distinct from authored_high then
    raise exception 'the work component must carry its own version''s authored pace band';
  end if;
  return new;
end $$;

comment on function public.component_pace_follows_prescription() is
  'Where a version authors a band, every work component must carry it -- a single-intensity session cannot have a component inventing a pace. Where a version authors none, the session is mixed and each work component carries its own band or none. Warm up, recovery and cool down never carry a band; they are authored against effort.';

-- ── The finish blocks ───────────────────────────────────────────────────────
--
-- The run stays open. The last miles are a separate banded piece, so the log
-- resolves them per-piece and the ladder can read a continuous in-band segment run
-- under fatigue -- harder evidence than the same distance fresh.
--
-- No whole-run credit. Only the block counts.
do $$
declare
  run record;
  latest record;
  new_version uuid;
  finish numeric;
  n integer := 0;
begin
  for run in
    select ps.id, ps.athlete_id, w.week_number, k.distance as total
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
     where a.slug in ('hope','jose','marcus')
       and v.title ilike '%long%'
       and k.shape = 'continuous'
       and k.pace_low_seconds is null
       and w.week_number between 3 and 13
  loop
    finish := case
      when run.week_number between 3 and 6   then 2.0
      when run.week_number between 7 and 10  then 3.0
      else 4.0 end;

    -- A finish block only makes sense if there is a run in front of it.
    continue when run.total is null or run.total <= finish + 1;

    select * into latest from public.planned_session_versions
     where planned_session_id = run.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by)
    values (run.athlete_id, run.id, latest.version_number + 1, latest.title,
            run.total, 'mi', latest.intent,
            'Run the first part easy. The last ' || finish || ' miles at race pace, off tired legs.',
            'Added a banded finish block. Thirteen long runs carried no race-pace work and nothing in the campaign taught a late finish, which is the job the race asks for at mile ten. The run stays open; only the final block is banded, and only the block counts toward ownership.',
            latest.authored_by)
    returning id into new_version;

    -- The open portion.
    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, distance, distance_unit, rpe_low, rpe_high, rpe_source)
    values (run.athlete_id, new_version, 1, 'work', 'continuous', run.total - finish, 'mi', 5, 6, 'authored');

    -- The finish, banded, its own piece so the log can resolve it.
    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, distance, distance_unit,
       pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
    values (run.athlete_id, new_version, 2, 'work', 'continuous', finish, 'mi',
            '6:30', '6:45', 390, 405, 'authored');

    n := n + 1;
  end loop;
  raise notice 'authored % long runs with a banded finish block', n;
end $$;
