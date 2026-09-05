-- Three Saturdays were labelled Race pace, and they are long runs.
--
-- The labelling CASE tested `title like '%at race pace'` before it tested
-- `title like 'Long run%'`, and "Long run — last 6 at race pace" ends with the
-- former. So the three long runs that finish at the band were filed as the
-- Tuesday session type — which would have told a runner that an eighteen-mile
-- Saturday was a race-pace workout.
--
-- Caught by reading the distribution rather than the success message: Race pace
-- came back 18 where the plan has 15 Tuesdays, and the three extra were the
-- Saturdays.
--
-- Corrected by naming the sessions rather than by reordering the patterns. The
-- ordering bug is exactly what specificity avoids.

update public.training_plan_sessions
   set label = 'Long run · race pace finish'
 where title like 'Long run — last%';

do $$
declare n integer; dist text;
begin
  -- Every Saturday is a long run, a long run that finishes at the band, or the
  -- race. None of them is a Tuesday session type.
  select count(*) into n from public.training_plan_sessions
   where day_of_week = 'SAT'
     and label not in ('Long run', 'Long run · race pace finish', 'Race');
  if n <> 0 then raise exception '% Saturdays carry a label that is not a Saturday''s', n; end if;

  -- And every race-pace label is a Tuesday.
  select count(*) into n from public.training_plan_sessions
   where label = 'Race pace' and day_of_week <> 'TUE';
  if n <> 0 then raise exception '% race-pace labels are not on Tuesday', n; end if;

  select string_agg(label || ' × ' || c, ', ' order by c desc) into dist
    from (select label, count(*) c from public.training_plan_sessions group by label) t;
  raise notice '%', dist;
end $$;
