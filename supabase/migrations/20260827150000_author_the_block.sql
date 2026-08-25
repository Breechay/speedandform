-- The Tuesday key session across the block. Distances are race-pace volume;
-- the shape line says what the session actually is.
--
-- Race pace is not every week. Seven race-pace sessions in fifteen weeks, with
-- threshold and down weeks between, is enough stimulus without turning every
-- Tuesday into a test.
--
-- The repeats are the point rather than padding. Six miles at pace twice, the
-- second landing at RPE 7 instead of 8, is stronger evidence than reaching ten
-- once. Repeating a rung is a decision, not a miss.
--
-- Peak lands three weeks out: ten miles at race pace is about 65 minutes at
-- pace, and absorbing that during taper costs the taper. Marcus races a week
-- later, so his peak sits four weeks out and he gets the extra easy week.

do $$
declare
  r record; wk record;
  b_id uuid; w_id uuid; p_id uuid;
begin
  for r in select id, slug from public.athletes where slug in ('hope', 'jose', 'marcus')
  loop
    select id into b_id from public.training_blocks
     where athlete_id = r.id and status = 'active';

    for wk in
      select * from (values
        ( 2, '3 × 2 mi at race pace',    6.0, '20 min easy, then 3 × 2 mi with 3 min easy between. No stopping.', 7, 8),
        ( 3, '5 mi at race pace',        5.0, '20 min easy, then 5 mi straight at race pace. No stopping.',       7, 8),
        ( 4, 'Easy week',                6.0, 'All easy. Nothing at pace.',                                      4, 5),
        ( 5, '6 mi at race pace',        6.0, '20 min easy, then 6 mi straight at race pace. No stopping.',       7, 8),
        ( 6, 'Threshold',                5.0, '20 min easy, then 5 × 1 mi at threshold with 90 sec easy.',        7, 8),
        ( 7, '6 mi at race pace',        6.0, '20 min easy, then 6 mi straight at race pace. Should feel easier.', 7, 8),
        ( 8, 'Easy week',                6.0, 'All easy. Nothing at pace.',                                      4, 5),
        ( 9, '8 mi at race pace',        8.0, '30 min easy, then 8 mi straight at race pace. No stopping.',       7, 8),
        (10, 'Threshold',                6.0, '20 min easy, then 6 × 1 mi at threshold with 90 sec easy.',        7, 8),
        (11, '8 mi at race pace',        8.0, '30 min easy, then 8 mi straight at race pace. Should feel easier.', 7, 8),
        (12, '10 mi at race pace',      10.0, '30 min easy, then 10 mi straight at race pace. No stopping.',      7, 8),
        (13, '6 mi at race pace',        6.0, '20 min easy, then 6 mi straight at race pace.',                    7, 8),
        (14, '4 mi at race pace',        4.0, '15 min easy, then 4 mi at race pace. Nothing more.',               6, 7),
        (15, 'Race week',                3.0, 'Short and easy. A few strides.',                                   4, 5),
        (16, 'Race week',                3.0, 'Short and easy. A few strides.',                                   4, 5)
      ) as t(num, title, miles, shape, rlow, rhigh)
      where t.num <= case when r.slug = 'marcus' then 16 else 15 end
    loop
      -- Hope and Jose race in week 15; that week is the race itself.
      if r.slug <> 'marcus' and wk.num = 15 then
        continue;
      end if;

      insert into public.training_weeks (athlete_id, block_id, week_number, starts_on, ends_on, state)
      values (r.id, b_id, wk.num, date '2026-08-23' + ((wk.num - 1) * 7),
              date '2026-08-23' + ((wk.num - 1) * 7) + 6, 'planned')
      on conflict (block_id, week_number) do nothing
      returning id into w_id;

      if w_id is null then continue; end if;

      insert into public.planned_sessions (athlete_id, week_id, scheduled_on, day_label, position, state)
      values (r.id, w_id, date '2026-08-23' + ((wk.num - 1) * 7) + 2, 'TUE', 1, 'published')
      returning id into p_id;

      insert into public.planned_session_versions
        (athlete_id, planned_session_id, version_number, title, shape,
         prescribed_distance, distance_unit, pace_low, pace_high, rpe_low, rpe_high)
      values (r.id, p_id, 1, wk.title, wk.shape, wk.miles, 'mi',
              case when wk.title like '%race pace%' then '6:30' else null end,
              case when wk.title like '%race pace%' then '6:45' else null end,
              wk.rlow, wk.rhigh);
    end loop;
  end loop;
end $$;
