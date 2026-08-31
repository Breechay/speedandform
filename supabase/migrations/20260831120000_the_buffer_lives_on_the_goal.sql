-- The band was right. The buffer belongs on the goal, and the goal was one field.
--
-- Brice coaches two numbers and the system stored one: what the athlete races for,
-- and what he is actually training them to. With only the stated goal on record the
-- buffer had nowhere to live, so it ended up smuggled into the band -- and then an
-- arithmetic argument about a band collision talked it back out again. Both moves
-- were treating a missing field as a pace problem.
--
--   statedGoal      sub-1:30   what they signed up for
--   trainingTarget  1:28       what he coaches to      -> 6:45/mi
--   prescribedBand  6:30-6:45  AS AUTHORED. 6:45 is the target, 6:30 is margin.
--
-- Ownership measures against the target, the slow end: a mile held at 6:45 or
-- faster counts. The band stops being a second opinion about the goal.
--
-- The 6:45-6:52 re-derivation is withdrawn in full. Append-only means that is
-- another version, not an undo -- what was published stays published.

alter table public.athletes
  add column if not exists training_target_seconds integer,
  add column if not exists target_pace_seconds integer;

comment on column public.athletes.goal_seconds is
  'The stated goal: what the athlete is racing for.';
comment on column public.athletes.training_target_seconds is
  'What the coach is training to, authored per athlete. Never derived and never defaulted -- the buffer is a coaching decision, and a default would make it the system''s opinion. Absent means it equals the stated goal.';
comment on column public.athletes.target_pace_seconds is
  'Derived from training_target_seconds over the target distance. This is what ownership measures against.';

update public.athletes
   set training_target_seconds = 88 * 60
 where slug in ('hope', 'jose', 'marcus');

update public.athletes
   set target_pace_seconds = round(coalesce(training_target_seconds, goal_seconds) / 13.1094)
 where coalesce(training_target_seconds, goal_seconds) is not null
   and target_event ~* 'half';

-- Back to 6:30-6:45, as authored, through versions.
do $$
declare target record; latest record; new_version uuid; n integer := 0;
begin
  for target in
    select ps.id, ps.athlete_id
      from public.planned_sessions ps
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
     where k.pace_low_seconds = 405 and k.pace_high_seconds = 412
  loop
    select * into latest from public.planned_session_versions
     where planned_session_id = target.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, prescribed_duration_minutes, intent, details, change_reason,
       authored_by, pace_low, pace_high)
    values (target.athlete_id, target.id, latest.version_number + 1, latest.title,
            latest.prescribed_distance, latest.distance_unit,
            latest.prescribed_duration_minutes, latest.intent, latest.details,
            'Restored to the authored band 6:30-6:45. The previous re-derivation to 6:45-6:52 was wrong: the buffer belongs on the training target, not on the band. 6:45 is the target and 6:30 is margin the athlete is allowed to find.',
            latest.authored_by, '6:30', '6:45')
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, repeat_count, distance, distance_unit,
       duration_seconds, recovery_seconds, recovery_kind,
       pace_low, pace_high, pace_low_seconds, pace_high_seconds,
       rpe_low, rpe_high, rpe_source, rpe_default_version,
       repeat_minimum, repeat_target, repeat_progression, repeat_ceiling)
    select athlete_id, new_version, position, role, shape, repeat_count, distance, distance_unit,
           duration_seconds, recovery_seconds, recovery_kind,
           case when pace_low_seconds = 405 then '6:30' else pace_low end,
           case when pace_high_seconds = 412 then '6:45' else pace_high end,
           case when pace_low_seconds = 405 then 390 else pace_low_seconds end,
           case when pace_high_seconds = 412 then 405 else pace_high_seconds end,
           rpe_low, rpe_high, rpe_source, rpe_default_version,
           repeat_minimum, repeat_target, repeat_progression, repeat_ceiling
      from public.planned_session_components where version_id = latest.id;
    n := n + 1;
  end loop;
  raise notice 'restored % sessions to the authored band', n;
end $$;

-- The collision guard was answering the wrong question and is retired.
drop function if exists public.band_collisions();

-- What replaces it. Threshold should sit 30 s/mi under the TRAINING TARGET, not
-- under the band and not under the stated goal. Reports; never repairs -- where a
-- campaign disagrees, that is an authoring call.
create or replace function public.threshold_derivation()
returns table (slug text, target_pace integer, implied_threshold integer,
               authored_threshold text, delta_seconds integer)
language sql stable as $$
  with authored as (
    select distinct a.slug, a.target_pace_seconds,
           k.pace_low, k.pace_high, k.pace_low_seconds
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by pv.version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id
     where k.pace_low_seconds is not null and a.target_pace_seconds is not null
       and k.pace_low_seconds < a.target_pace_seconds
  )
  select slug, target_pace_seconds, target_pace_seconds - 30,
         pace_low || '-' || pace_high,
         pace_low_seconds - (target_pace_seconds - 30)
    from authored;
$$;

comment on function public.threshold_derivation is
  'Threshold should sit 30 s/mi under the training target. Reports the delta per athlete and never repairs: where a campaign disagrees, the authored session may still be the right one and only Brice can say.';

do $$
declare bad integer; hope_volume numeric;
begin
  select count(*) into bad from public.athletes
   where slug in ('hope','jose','marcus') and target_pace_seconds is distinct from 403;
  if bad > 0 then
    -- 88 minutes over 13.1094 is 402.8, which rounds to 403. The authored 6:45 is
    -- 405; two seconds apart, and the authored number is the one that counts.
    raise notice '% athletes derive a target pace other than 403 s/mi', bad;
  end if;

  -- Hope's 27 August, counted against a 6:45 ceiling.
  select count(*) * 0.621371 into hope_volume
    from public.session_pieces
   where completion_id = '1201fdf0-7ae8-458f-84ae-7b82a1f15114'
     and kind = 'rep' and pace_seconds <= 405;
  raise notice 'Hope 27 August in-band volume: % mi', round(hope_volume, 2);
end $$;
