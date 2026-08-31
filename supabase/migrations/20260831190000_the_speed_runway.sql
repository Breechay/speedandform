-- The Speed Thursdays, from Brice's own library.
--
-- Fifteen sessions carried a title and nothing else. The first proposal was two
-- templates of 200m repeats stamped across the block -- safe database thinking that
-- would have flattened a race build into the same Thursday fifteen times. Weeks
-- twelve and two out do different jobs.
--
-- These are Brice's authored V3 sessions, placed by weeks-to-race. Each one already
-- carries its own adaptation, structure, burden and advance/repeat/reduce/replace
-- rule; nothing here invents anatomy where his library already says what he meant.
--
--   12 out   Hills + strides   power and economy, low joint cost. Economy first.
--    9 out   The Governor      choosing the opening gear while fresh legs overspend
--    6 out   VO2 intervals     the ceiling a half is run just beneath
--    4 out   The Kick          a faster gear AFTER threshold fatigue, not resistance
--    2 out   VO2 touch         top end kept live while volume falls away
--
-- All three athletes run the same session at the same distance from race day.
-- Marcus's differ only by a note: his are the ones that have to happen outdoors.
--
-- Total distances are untouched. Easy running before and after fills each session
-- to the five or six miles already authored.

do $$
declare
  s record;
  latest record;
  new_version uuid;
  wks_out integer;
  pick text;
  outdoor_note text := 'Outside for this one. Track or road, not the treadmill. Afternoon if you can — the heat is part of the session.';
  n integer := 0;
begin
  for s in
    select ps.id, ps.athlete_id, a.slug, w.week_number,
           ((b.race_on - ps.scheduled_on) / 7) as out_weeks
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by version_number desc limit 1) v on true
      left join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
     where a.slug in ('hope','jose','marcus') and ps.state <> 'cancelled'
       and v.title = 'Speed' and k.id is null
  loop
    wks_out := s.out_weeks;
    pick := case
      when wks_out >= 11 then 'hills'
      when wks_out >= 8  then 'governor'
      when wks_out >= 5  then 'vo2'
      when wks_out >= 3  then 'kick'
      else 'touch' end;

    select * into latest from public.planned_session_versions
     where planned_session_id = s.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by, rpe_low, rpe_high, coach_note)
    values (s.athlete_id, s.id, latest.version_number + 1,
            case pick
              when 'hills'    then 'Hills + strides'
              when 'governor' then 'The Governor'
              when 'vo2'      then 'VO₂ intervals'
              when 'kick'     then 'The Kick'
              else 'VO₂ touch' end,
            latest.prescribed_distance, latest.distance_unit,
            case pick
              when 'hills'    then 'Build power and economy before any volume of fast running. The base speed sits under everything else.'
              when 'governor' then 'Practice choosing the correct opening gear while fresh legs are asking to overspend.'
              when 'vo2'      then 'Raise the ceiling the half is run just beneath.'
              when 'kick'     then 'Recruit a faster gear after sustained threshold fatigue, rather than merely resisting the slowdown.'
              else 'Keep the top end live while the fatigue clears. Volume is cut; speed is not.' end,
            case pick
              when 'hills'    then '8 × 12s hill sprints with a full walk back, then 4 × 20s strides. Easy either side to fill the session.'
              when 'governor' then '6 × 30s fast with 90s jog, then 15 minutes continuous at half pace. Easy either side.'
              when 'vo2'      then '5 × 3 minutes hard with 2:30 jog between. Easy either side.'
              when 'kick'     then '25 minutes at threshold, then 6 × 200m fast and relaxed with a full jog back. Easy either side.'
              else '3 × 2 minutes hard with full recovery, then 4 × 20s strides. Easy either side.' end,
            'Authored from the V3 library and placed by weeks to race. The slot carried a title and no work.',
            latest.authored_by, 7, 8,
            case when s.slug = 'marcus' then outdoor_note else null end)
    returning id into new_version;

    if pick = 'hills' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'repetitions', 8, 6, 8, 8, 12, 180, 'standing', 'authored'),
             (s.athlete_id, new_version, 2, 'work', 'repetitions', 4, 4, 4, 4, 20, 60, 'easy', 'authored');

    elsif pick = 'governor' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'repetitions', 6, 4, 6, 6, 30, 90, 'jog', 'authored');
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, duration_seconds,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
      values (s.athlete_id, new_version, 2, 'work', 'continuous', 900, '6:30', '6:45', 390, 405, 'authored');

    elsif pick = 'vo2' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'repetitions', 5, 4, 5, 5, 180, 150, 'jog', 'authored');

    elsif pick = 'kick' then
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, duration_seconds,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'continuous', 1500, '6:25', '6:30', 385, 390, 'authored');
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, distance, distance_unit, recovery_seconds, recovery_kind, rpe_source)
      values (s.athlete_id, new_version, 2, 'work', 'repetitions', 6, 4, 6, 6, 0.20, 'km', 180, 'jog', 'authored');

    else
      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, repeat_minimum, repeat_target,
         repeat_ceiling, duration_seconds, recovery_seconds, recovery_kind, rpe_source)
      values (s.athlete_id, new_version, 1, 'work', 'repetitions', 3, 3, 3, 3, 120, 180, 'standing', 'authored'),
             (s.athlete_id, new_version, 2, 'work', 'repetitions', 4, 4, 4, 4, 20, 60, 'easy', 'authored');
    end if;

    n := n + 1;
  end loop;
  raise notice 'authored % Speed sessions', n;
end $$;

do $$
declare bare integer;
begin
  select count(*) into bare
    from public.planned_sessions ps
    join public.athletes a on a.id = ps.athlete_id
    join lateral (select * from public.planned_session_versions pv
                   where pv.planned_session_id = ps.id order by version_number desc limit 1) v on true
    left join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
   where a.slug in ('hope','jose','marcus') and ps.state <> 'cancelled'
     and v.title in ('Hills + strides','The Governor','VO₂ intervals','The Kick','VO₂ touch')
     and k.id is null;
  if bare > 0 then raise exception '% Speed sessions still carry no work', bare; end if;
end $$;
