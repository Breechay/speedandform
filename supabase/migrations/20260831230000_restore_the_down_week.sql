-- The down week comes back, and the reach moves one week later.
--
-- Putting a reach on 7 out's weekend ended the only recovery week in the back half.
-- Recovery is where the adaptation lands, so the reach moves to 6 out -- a week that
-- was carrying an easy twelve anyway -- and 7 out returns to a genuine down week:
-- four miles of race pace on Tuesday, an easy Thursday, an easy seven on the weekend.
--
-- Three real down weeks in the back half now instead of two.
--
-- The down week's long run stays entirely easy. It carries no banded finish, because
-- a recovery week with race-pace work in it is not a recovery week.

do $$
declare
  s record; latest record; new_version uuid; n integer := 0;
begin
  -- 7 out: back to an easy long run.
  for s in
    select ps.id, ps.athlete_id
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id order by version_number desc limit 1) v on true
     where a.slug in ('hope','jose','marcus') and ps.state <> 'cancelled'
       and ((b.race_on - ps.scheduled_on) / 7) = 7
       and v.title ilike '%continuous at race pace%'
  loop
    select * into latest from public.planned_session_versions
     where planned_session_id = s.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by)
    values (s.athlete_id, s.id, latest.version_number + 1, 'Long run', 7.0, 'mi',
            latest.intent, 'All easy. Nothing in band.',
            'The reach moved to 6 out so this week could be a down week again. Recovery is where the adaptation lands, and a recovery week carrying race-pace work is not one.',
            latest.authored_by)
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, distance, distance_unit, rpe_low, rpe_high, rpe_source)
    values (s.athlete_id, new_version, 1, 'work', 'continuous', 7.0, 'mi', 5, 6, 'authored');
    n := n + 1;
  end loop;

  -- 6 out: the easy twelve becomes the seven-mile reach.
  for s in
    select ps.id, ps.athlete_id
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id order by version_number desc limit 1) v on true
     where a.slug in ('hope','jose','marcus') and ps.state <> 'cancelled'
       and ((b.race_on - ps.scheduled_on) / 7) = 6
       and v.title ilike '%long%'
  loop
    select * into latest from public.planned_session_versions
     where planned_session_id = s.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by, pace_low, pace_high, coach_note)
    values (s.athlete_id, s.id, latest.version_number + 1,
            '7 mi continuous at race pace', 7.0, 'mi', latest.intent,
            'The whole thing in band. This is the long run this week — there is no second one.',
            'The reach moved here from 7 out so that week could stay a down week.',
            latest.authored_by, '6:30', '6:45',
            'This is the week''s long run. Nothing easy on top of it.')
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, distance, distance_unit,
       pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
    values (s.athlete_id, new_version, 1, 'work', 'continuous', 7.0, 'mi',
            '6:30', '6:45', 390, 405, 'authored');
    n := n + 1;
  end loop;
  raise notice 'swapped % sessions', n;
end $$;
