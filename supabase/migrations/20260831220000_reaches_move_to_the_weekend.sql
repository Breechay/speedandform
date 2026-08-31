-- The race-pace reaches become the weekend long run, and the ladder caps at ten.
--
-- A twelve-mile race-pace run IS a long run. Prescribing both in one week is a
-- twenty-six-mile quality week that only exists on paper: one of the two gets run
-- badly and it will be the one that mattered. Midweek is also the wrong container --
-- no time, Miami heat, and Thursday's quality forty-eight hours behind it.
--
-- So on a reach week the weekend session is the long run. There is no second easy
-- one, and Tuesday drops to four miles: frequency of exposure rather than dose. They
-- touch race pace twice a week all block without paying for it twice.
--
-- And the ladder caps at ten, not twelve. The filed cost right now is RPE 9 at four
-- miles. A twelve-mile reach at that cost is a race they would run badly and lose
-- the taper to. Ten owned at 6:45 against a 6:52 goal banks two minutes with 3.1
-- exposed -- a sound sub-1:30, honest about where they are starting.
--
--    7 out    7 mi continuous     (was the weekend long run)
--    5 out    9 mi continuous
--    3 out   10 mi continuous
--
-- One consequence worth naming rather than burying: 7 out was an authored down week.
-- Moving a reach onto its weekend ends that. The Kick stays once at 4 out and its
-- Thursday is untouched, so the week keeps an easy midweek -- but it is no longer a
-- recovery week, and that is a real cost of putting the reaches where they belong.

do $$
declare
  s record; latest record; new_version uuid; target_mi numeric; n integer := 0;
begin
  -- The weekend reaches. The long run becomes the race-pace session.
  for s in
    select ps.id, ps.athlete_id, ((b.race_on - ps.scheduled_on) / 7) as out_weeks
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by version_number desc limit 1) v on true
     where a.slug in ('hope','jose','marcus') and ps.state <> 'cancelled'
       and v.title ilike '%long%'
       and ((b.race_on - ps.scheduled_on) / 7) in (7, 5, 3)
  loop
    target_mi := case s.out_weeks when 7 then 7.0 when 5 then 9.0 else 10.0 end;

    select * into latest from public.planned_session_versions
     where planned_session_id = s.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by, pace_low, pace_high, coach_note)
    values (s.athlete_id, s.id, latest.version_number + 1,
            trim(to_char(target_mi, 'FM999')) || ' mi continuous at race pace',
            target_mi, 'mi', latest.intent,
            'The whole thing in band. This is the long run this week — there is no second one.',
            'The reach moved onto the weekend and replaced the easy long run. A race-pace run of this length IS a long run, and prescribing both in one week produces a quality week that only exists on paper.',
            latest.authored_by, '6:30', '6:45',
            'This is the week''s long run. Nothing easy on top of it.')
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, distance, distance_unit,
       pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
    values (s.athlete_id, new_version, 1, 'work', 'continuous', target_mi, 'mi',
            '6:30', '6:45', 390, 405, 'authored');
    n := n + 1;
  end loop;
  raise notice 'authored % weekend reaches', n;

  -- Tuesdays: seven miles at ten out to clear the rung it outran, four on the reach
  -- weeks, six in the taper. Exposure, not dose.
  for s in
    select ps.id, ps.athlete_id, ((b.race_on - ps.scheduled_on) / 7) as out_weeks
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
     where a.slug in ('hope','jose','marcus') and ps.state <> 'cancelled'
       and k.shape = 'continuous' and k.pace_low_seconds = 390
       and v.title like '%mi at race pace'
       and ((b.race_on - ps.scheduled_on) / 7) in (10, 6, 4, 3, 2)
  loop
    target_mi := case s.out_weeks when 10 then 7.0 when 2 then 6.0 else 4.0 end;

    select * into latest from public.planned_session_versions
     where planned_session_id = s.id order by version_number desc limit 1;
    continue when latest.prescribed_distance = target_mi;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by, pace_low, pace_high)
    values (s.athlete_id, s.id, latest.version_number + 1,
            trim(to_char(target_mi, 'FM999')) || ' mi at race pace',
            target_mi, 'mi', latest.intent,
            'Continuous, in band. Short on purpose.',
            'Reduced because the reach moved to the weekend. Touching race pace twice a week matters more than paying for it twice.',
            latest.authored_by, '6:30', '6:45')
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, distance, distance_unit,
       pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
    values (s.athlete_id, new_version, 1, 'work', 'continuous', target_mi, 'mi',
            '6:30', '6:45', 390, 405, 'authored');
  end loop;
end $$;
