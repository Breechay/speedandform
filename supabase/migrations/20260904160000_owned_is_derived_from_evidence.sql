-- Owned is derived from evidence, never typed.
--
-- `athlete_marks.current_value` was keyed in by hand three times in one
-- afternoon and was wrong all three: 1, then 6.1, then 1, while the filed
-- evidence said 2 throughout. A number a person types drifts from the evidence
-- the moment anything is filed, and this one drifted far enough to argue with
-- the plan.
--
-- The two quantities that kept getting confused, frozen here:
--
--   RACE-PACE VOLUME       the sum of qualifying work. 3 × 2 mi is 6.
--   CONTINUOUS DISTANCE    the longest SINGLE uninterrupted qualifying
--   OWNED                  segment. 3 × 2 mi is 2, and can never be 6.
--
-- A segment qualifies when it is one filed piece, carrying a distance, whose
-- own pace falls inside the band its prescription asked for. Per segment, never
-- per workout average: Hope's third rep came back at 6:59 against a 6:30–6:45
-- band, and she still owns two miles because her first two reps qualify on
-- their own. Averaging the workout would have failed her for a rep the other
-- two already answered.

create or replace view public.athlete_continuous_owned
with (security_invoker = true) as
select
  sc.athlete_id,
  max(p.distance) filter (where p.distance_unit = 'mi')                as owned_mi,
  max(sc.filed_at) filter (where p.distance_unit = 'mi')               as established_at,
  count(*)                                                             as qualifying_segments
from public.session_pieces p
join public.session_completions sc on sc.id = p.completion_id
join public.planned_sessions s on s.id = sc.planned_session_id
join lateral (
  select v.* from public.planned_session_versions v
   where v.planned_session_id = s.id
   order by v.version_number desc limit 1) v on true
join public.planned_session_components c
  on c.version_id = v.id and c.role = 'work' and c.pace_low_seconds is not null
where p.distance is not null
  and p.pace_seconds is not null
  -- The segment's own pace, inside the band its prescription asked for.
  and p.pace_seconds >= c.pace_low_seconds
  and p.pace_seconds <= coalesce(c.pace_high_seconds, 2147483647)
group by sc.athlete_id;

grant select on public.athlete_continuous_owned to authenticated;

comment on view public.athlete_continuous_owned is
  'Continuous distance owned: the longest single filed segment whose own pace fell inside the band its prescription asked for. Evaluated per segment, never per workout average. This is the number, not athlete_marks.current_value, which is a stored copy that drifts.';
