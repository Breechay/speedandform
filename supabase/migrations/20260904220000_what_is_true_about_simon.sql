-- What is true about Simon.
--
-- The first standing facts in the system, and they are the argument for the
-- table existing. None of this is derivable from his record: his block is eight
-- weeks of HYROX threshold work, he has filed nothing, and the surfaces would
-- have shown an athlete with no history at all. The history is that Brice took
-- him from floating around 1:33, and stuck under 1:30, to 1:26 in the half.
--
-- That fact changes how his next block is read and it was living in one person's
-- memory. Sourced as coach_observed because it is Brice's, dated today because
-- that is when it entered the record rather than when it happened, and
-- supersedable rather than editable, the same as a judgment.
--
-- The 1:33 is carried as approximate, in his words, because he said "I think".
-- A standing fact that overstates its own certainty is worse than a vaguer one.

do $$
declare
  simon uuid := (select id from public.athletes where slug = 'simon');
  brice uuid := '79d1520c-7c7c-4cd2-bd31-229a3cc56158';
begin
  insert into public.athlete_observations
    (athlete_id, facet, source, observation, direction, observed_on, authored_by)
  values
    (simon, 'capacity', 'coach_observed',
     'Half marathon: came in floating around 1:33 and stuck under 1:30, and ran 1:26. That is the athlete underneath the HYROX cycle.',
     'toward_intent', current_date, brice),
    (simon, 'aspiration', 'coach_observed',
     'HYROX in Nashville is the near thing. He goes back to the half after it.',
     null, current_date, brice);
end $$;
