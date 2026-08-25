-- Race pace anchors at 6:30-6:45. At 6:45 the half is 1:28, so the slow end of
-- the band still clears sub-1:30 with room, and the long continuous efforts stay
-- sustainable. 6:25-6:30 was a 1:25 pace attached to a 1:30 goal.
--
-- The mark becomes longest continuous run AT RACE PACE. Their 4x1 mi was four
-- miles of race pace broken by recoveries, so the longest they have actually
-- held is one mile. That is the honest starting rung.
--
--   1 -> 2 -> 5 -> 6 -> 8 -> 10 -> 13.1
--
-- 2 is the bridge (3x2 mi): rep length grows before the reps disappear. 13.1 is
-- race day, so the ladder ends where the question is answered.

update public.athlete_marks m
   set label = 'Longest continuous run at race pace',
       current_value = 1, target_value = 13.1, unit = 'mi'
  from public.athletes a
 where a.id = m.athlete_id and m.is_primary and a.slug in ('hope', 'jose', 'marcus');

insert into public.mark_checkpoints (athlete_id, mark_id, value, label, position, state)
select m.athlete_id, m.id, v.value, v.label, v.pos,
       case when v.value <= 1 then 'reached' else 'proposed' end
from public.athlete_marks m
join public.athletes a on a.id = m.athlete_id
cross join (values
  (1.0, '1', 1), (2.0, '2', 2), (5.0, '5', 3),
  (6.0, '6', 4), (8.0, '8', 5), (10.0, '10', 6), (13.1, '13.1', 7)
) as v(value, label, pos)
where m.is_primary and a.slug in ('hope', 'jose', 'marcus');

update public.training_blocks b
   set goal_statement = case a.slug
         when 'marcus' then 'Run under 1:30 at West Palm Beach'
         else 'Run under 1:30 at Orlando' end
  from public.athletes a
 where a.id = b.athlete_id and a.slug in ('hope', 'jose', 'marcus');
