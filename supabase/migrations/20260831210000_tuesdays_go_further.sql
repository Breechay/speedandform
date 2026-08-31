-- The Tuesdays go further than the ladder needs, because that is the point.
--
-- The ladder asks what distance has been held. The coaching asks something harder:
-- make race pace feel like nothing. Those are not the same target, and a Tuesday
-- sized to clear a rung is sized to the instrument rather than to the athlete.
--
-- If twelve miles is supposed to feel like a six, they have to run twelve.
--
--   10 out   6 -> 8 mi
--    6 out   8 -> 9 mi
--    3 out  10 -> 12 mi
--    2 out   6 -> 8 mi
--
-- Thursday is untouched. Nothing faster than race pace on Tuesday, everything
-- faster on Thursday, and the contrast between them is the mechanism.

alter table public.athletes
  add column if not exists rpe_ceiling smallint check (rpe_ceiling is null or rpe_ceiling between 1 and 10);

comment on column public.athletes.rpe_ceiling is
  'The reported effort at or below which a race-pace session counts as inhabited rather than merely covered. Applies to race-pace work ONLY. Thursday sessions are meant to cost a lot and are never scored against it -- a ceiling on the hard day would be measuring the wrong thing and would punish the session for working.';

update public.athletes set rpe_ceiling = 7 where slug in ('hope','jose','marcus');

do $$
declare
  s record; latest record; new_version uuid; target_mi numeric; n integer := 0;
begin
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
       and k.shape = 'continuous' and k.pace_low_seconds = 390 and k.pace_high_seconds = 405
       and v.title like '%mi at race pace'
       and ((b.race_on - ps.scheduled_on) / 7) in (10, 6, 3, 2)
  loop
    target_mi := case s.out_weeks
      when 10 then 8.0 when 6 then 9.0 when 3 then 12.0 else 8.0 end;

    select * into latest from public.planned_session_versions
     where planned_session_id = s.id order by version_number desc limit 1;

    continue when latest.prescribed_distance = target_mi;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, intent, details, change_reason, authored_by, pace_low, pace_high)
    values (s.athlete_id, s.id, latest.version_number + 1,
            trim(to_char(target_mi, 'FM999')) || ' mi at race pace',
            target_mi, 'mi', latest.intent,
            'Continuous, in band, the whole way. Nothing quicker.',
            'Extended beyond what the ladder requires. The rung asks what distance has been held; the coaching asks that race pace stop feeling like an event, and that needs more time in band than a rung needs.',
            latest.authored_by, '6:30', '6:45')
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, distance, distance_unit,
       pace_low, pace_high, pace_low_seconds, pace_high_seconds, rpe_source)
    values (s.athlete_id, new_version, 1, 'work', 'continuous', target_mi, 'mi',
            '6:30', '6:45', 390, 405, 'authored');

    n := n + 1;
  end loop;
  raise notice 'extended % race-pace Tuesdays', n;
end $$;
