-- Two corrections.
--
-- 1. Hope's claim is working, not unclear. Brice can tell — he has her threshold
--    history. "Can't tell" was the state of one session, and I had let it stand
--    in for the state of the claim. Those are different questions: the claim is
--    supported by prior evidence, and this particular session simply did not add
--    to it. The session keeps its own record of why.
--
-- 2. No em dashes anywhere that renders. Full stops or commas instead.

update public.athlete_marks m
   set claim_state = 'working',
       claim_note = 'She has this. Previous sessions already showed it. Tuesday needed tighter guardrails from me, not more fitness from her.'
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug = 'hope';

insert into public.planned_session_versions
  (athlete_id, planned_session_id, version_number, title, intent, shape,
   prescribed_distance, distance_unit, pace_low, pace_high, rpe_low, rpe_high)
select v.athlete_id, v.planned_session_id, v.version_number + 1, v.title,
       'Stairs 10 to 15 minutes after the run. Up only, ride back down.',
       v.shape, v.prescribed_distance, v.distance_unit, v.pace_low, v.pace_high,
       v.rpe_low, v.rpe_high
from public.planned_session_versions v
where v.intent like '%—%'
  and v.version_number = (
    select max(v2.version_number) from public.planned_session_versions v2
    where v2.planned_session_id = v.planned_session_id
  );
