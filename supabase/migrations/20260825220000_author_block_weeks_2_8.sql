-- Weeks 2-8 of Natalie's block, from Brice's own progression:
--
--   Wk | Tue  | Thu | Sun | Total
--    2 | 5    | 3   | 3   | 11
--    3 | 6    | 3.5 | 3.5 | 13
--    4 | 4    | 3   | 3   | 10   (down week)
--    5 | 7.5  | 3.5 | 3.5 | 14.5
--    6 | 9    | 4   | 3.5 | 16.5
--    7 | 10.5 | 4   | 3.5 | 18
--    8 | 13.1 | -   | shakeout
--
-- Three touches every week; the volume drift happens inside Tuesday only.
--
-- Distances, days and structure are his. Week intents are left NULL except where
-- he stated the reasoning himself (weeks 4 and 8) — a week with nothing authored
-- renders as nothing, which VOICE_LAW §1 says is correct. The rest are one
-- sentence each away from him.

-- A session with no authored intent is a real state: it renders as its title and
-- distance, and Brice adds the line when he has one. Requiring a value here is
-- what forces invented prose into the record.
alter table public.planned_session_versions alter column intent drop not null;

do $$
declare
  a_id uuid;
  b_id uuid;
  w_id uuid;
  p_id uuid;
  wk record;
  sn record;
begin
  select id into a_id from public.athletes where slug = 'natalie';
  select id into b_id from public.training_blocks where athlete_id = a_id and status = 'active';

  for wk in
    select * from (values
      (2, date '2026-08-30', 5.0,  3.0, 3.0, null::text),
      (3, date '2026-09-06', 6.0,  3.5, 3.5, null),
      (4, date '2026-09-13', 4.0,  3.0, 3.0, 'The same four miles as week one.'),
      (5, date '2026-09-20', 7.5,  3.5, 3.5, null),
      (6, date '2026-09-27', 9.0,  4.0, 3.5, null),
      (7, date '2026-10-04', 10.5, 4.0, 3.5, null),
      (8, date '2026-10-11', 13.1, 0.0, 2.0, 'Walk breaks from mile one. No clock.')
    ) as t(num, starts, tue, thu, sun, intent)
  loop
    insert into public.training_weeks (athlete_id, block_id, week_number, starts_on, ends_on, intent, state)
    values (a_id, b_id, wk.num, wk.starts, wk.starts + 6, wk.intent, 'planned')
    on conflict (block_id, week_number) do nothing
    returning id into w_id;

    if w_id is null then continue; end if;

    for sn in
      select * from (values
        (1, 'SUN', 0, wk.sun, case when wk.num = 8 then 'Shakeout' else 'Track' end),
        (2, 'TUE', 2, wk.tue, case when wk.num = 8 then '13.1 together' else 'Easy' end),
        (3, 'THU', 4, wk.thu, 'Support + stairs')
      ) as t(pos, day_label, day_offset, distance, title)
    loop
      continue when sn.distance = 0;

      insert into public.planned_sessions (athlete_id, week_id, scheduled_on, day_label, position, state)
      values (a_id, w_id, wk.starts + sn.day_offset, sn.day_label, sn.pos, 'published')
      returning id into p_id;

      insert into public.planned_session_versions
        (athlete_id, planned_session_id, version_number, title, prescribed_distance, distance_unit)
      values (a_id, p_id, 1, sn.title, sn.distance, 'mi');
    end loop;
  end loop;
end $$;
