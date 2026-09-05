-- Two Tuesdays that are off on purpose.
--
-- W7 and W11 lost their Tuesdays on 3 September and nothing replaced them. A
-- blank cell cannot tell an athlete — or a coach six weeks later — whether that
-- was a decision or an omission, and the plan should never make anyone guess.
--
-- Both are decisions, and they are the same decision for different reasons.
--
-- W7 is the major cutback. The week's job is to absorb six weeks of work, and
-- with Monday, Wednesday and Friday easy, Thursday's Pressure to Pace and a
-- seven-mile Saturday, a fifth running day would be arguing with the point of
-- the week. Two full days off is what a cutback actually is.
--
-- W11 carries the twelve-mile continuous at race pace — the hardest single
-- session in the block — and The Kick on Thursday. At forty-eight miles the week
-- is already near peak; an easy Tuesday would spend on rhythm what Saturday
-- needs. The Tuesday is off so the Saturday can be what it is.
--
-- Authored as sessions rather than left blank, so the plan says "off" where it
-- means off. An unauthored hole and a rest day should never look alike.

do $$
declare
  brice uuid := '79d1520c-7c7c-4cd2-bd31-229a3cc56158';
  w7 record;
begin
  perform set_config('request.jwt.claims', format('{"sub":"%s"}', brice), true);

  for w7 in
    select a.id athlete_id, tw.id week_id, tw.week_number, (tw.starts_on + 1)::date on_date
      from public.athletes a
      join public.training_weeks tw on tw.athlete_id = a.id
     where a.slug in ('jose', 'hope') and tw.week_number in (7, 11)
  loop
    perform public.author_session(
      w7.athlete_id, w7.week_id, 'TUE', 'Off',
      case when w7.week_number = 7
        then 'The cutback is the session. Six weeks of work is absorbed by not adding a seventh.'
        else 'Saturday is twelve continuous miles at race pace. Tuesday is off so that can be what it is.'
      end,
      w7.on_date, null, null, null, null, null, null, null, null);
  end loop;
end $$;
