-- The Threshold sessions, from the same library, arranged as an arc.
--
-- Seventeen slots carried a title and nothing else. They are not one workout
-- repeated: a threshold session thirteen weeks out is learning what half pace feels
-- like, and one five weeks out is finding out whether the durability took. Brice's
-- library already has a session for each of those and they are not the same session.
--
--   13 out  Clean Rhythm         learn HM pace cleanly, before any durability cost
--   10 out  The Wave             change gears without switching the engine off
--    9 out  The Blind Mile       calibrate effort so a dead watch cannot erase the race
--    8 out  Pressure to Pace     preserve HM after consequential non-threshold cost
--    5 out  Durability Read      the standardised late-HM read, at lower cost
--    5 out  Settle · maintenance keep LT2 live behind the week's durability Long
--
-- The two at five weeks out sit in the same week deliberately, and both are the
-- moderate options. A read and a maintenance dose oscillate; two high-burden
-- threshold sessions in one week would just be a hard week wearing an arc's clothes.

do $$
declare
  s record; latest record; new_version uuid; pick text; n integer := 0;
  outdoor_note text := 'Outside for this one. Track or road, not the treadmill. Afternoon if you can — the heat is part of the session.';
begin
  for s in
    select ps.id, ps.athlete_id, a.slug, ((b.race_on - ps.scheduled_on) / 7) as out_weeks,
           to_char(ps.scheduled_on, 'Dy') as dow
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by version_number desc limit 1) v on true
      left join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
     where a.slug in ('hope','jose','marcus') and ps.state <> 'cancelled'
       and v.title = 'Threshold' and k.id is null
     order by ps.scheduled_on
  loop
    pick := case
      when s.out_weeks >= 12 then 'cleanRhythm'
      when s.out_weeks >= 10 then 'wave'
      when s.out_weeks >= 9  then 'blindMile'
      when s.out_weeks >= 6  then 'pressure'
      when s.dow = 'Tue'     then 'durabilityRead'
      else 'settle' end;

    select * into latest from public.planned_session_versions
     where planned_session_id = s.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by, rpe_low, rpe_high, coach_note)
    values (s.athlete_id, s.id, latest.version_number + 1,
            case pick
              when 'cleanRhythm'    then 'Clean Rhythm'
              when 'wave'           then 'The Wave'
              when 'blindMile'      then 'The Blind Mile'
              when 'pressure'       then 'Pressure to Pace'
              when 'durabilityRead' then 'Durability Read'
              else 'Settle · maintenance' end,
            latest.prescribed_distance, latest.distance_unit,
            case pick
              when 'cleanRhythm'    then 'Learn half pace cleanly. Fresh recognition and control before any durability cost.'
              when 'wave'           then 'Build threshold clearance and pace control by changing gears without switching the engine off.'
              when 'blindMile'      then 'Calibrate internal half effort so a dead watch or an obscured display does not erase race execution.'
              when 'pressure'       then 'Preserve half pace after consequential non-threshold cost.'
              when 'durabilityRead' then 'A standardised late-half read. Reveal whether the durability is present, at lower cost than the session that built it.'
              else 'Keep the threshold relationship live at a fraction of the cost, behind the week''s durability long run.' end,
            case pick
              when 'cleanRhythm'    then '4 × 6 min at half pace with 2 min jog between. Easy either side.'
              when 'wave'           then '4 × [5 min threshold, then 2 min steady float]. No stopping between. Easy either side.'
              when 'blindMile'      then '2 miles at half effort with the pace display covered. Easy either side.'
              when 'pressure'       then '30 min steady, then 3 × 8 min at half pace with 2 min float. Easy either side.'
              when 'durabilityRead' then '20 min steady, then 2 × 8 min at half pace with 2 min jog. Easy either side.'
              else '2 × 8 min at threshold with 90s jog between. Easy either side.' end,
            'Authored from the V3 library and placed by weeks to race. The slot carried a title and no work.',
            latest.authored_by, 7, 8,
            case
              when s.slug = 'marcus' and pick = 'blindMile'
                then outdoor_note || ' Cover the watch — that is the whole session.'
              when s.slug = 'marcus' then outdoor_note
              when pick = 'blindMile'
                then 'Cover the watch face or put it up your sleeve. Run the two miles on feel alone. Checking afterwards is fine; checking during is the one thing that ruins it.'
              else null end)
    returning id into new_version;

    if pick = 'cleanRhythm' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'repetitions', 4, 3, 4, 4, 360, 120, 'jog',
              '6:30', '6:45', 390, 405, 'authored');

    elsif pick = 'wave' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'repetitions', 4, 3, 4, 4, 300, 120, 'float',
              '6:25', '6:30', 385, 390, 'authored');

    elsif pick = 'blindMile' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, distance, distance_unit, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'continuous', 2.0, 'mi', 'authored');

    elsif pick = 'pressure' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, duration_seconds, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'continuous', 1800, 'authored');
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
      values (s.athlete_id, new_version, 2, 'work', 'repetitions', 3, 2, 3, 3, 480, 120, 'float',
              '6:30', '6:45', 390, 405, 'authored');

    elsif pick = 'durabilityRead' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, duration_seconds, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'continuous', 1200, 'authored');
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
      values (s.athlete_id, new_version, 2, 'work', 'repetitions', 2, 2, 2, 2, 480, 120, 'jog',
              '6:30', '6:45', 390, 405, 'authored');

    else
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'repetitions', 2, 2, 2, 2, 480, 90, 'jog',
              '6:25', '6:30', 385, 390, 'authored');
    end if;

    n := n + 1;
  end loop;
  raise notice 'authored % Threshold sessions', n;
end $$;

do $$
declare bare integer;
begin
  select count(*) into bare from public.sessions_without_anatomy('hope')
   union all select count(*) from public.sessions_without_anatomy('jose')
   limit 1;
  if bare > 0 then raise exception '% sessions still carry no work', bare; end if;
end $$;
