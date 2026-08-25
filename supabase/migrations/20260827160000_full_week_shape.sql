-- The whole week, not just Tuesday. Three quality days, because that is what
-- these athletes train. The "hard-day budget is TWO" line in the app was
-- generated and is not Brice's; it does not govern here.
--
--   TUE  the race-pace ladder, already authored
--   THU  threshold or speed, alternating with the Tuesday load
--   SUN  the long run, climbing to 14 miles and coming down for the race
--
-- Long runs are mine to review, not his: the shape follows from the block, but
-- the numbers have not been through him. Distances are easy pace unless the
-- shape line says otherwise.

do $$
declare
  r record; wk record; w_id uuid; p_id uuid;
begin
  for r in select id, slug from public.athletes where slug in ('hope', 'jose', 'marcus')
  loop
    for wk in
      select * from (values
        -- num, thu title, thu mi, thu shape, sun title, sun mi, sun shape
        ( 2, 'Threshold',  5.0, '15 min easy, then 4 × 1 mi at threshold with 90 sec easy.', 'Long run',  9.0, 'All easy. Nothing quick.'),
        ( 3, 'Speed',      5.0, '15 min easy, then 8 × 400 m quick with equal easy.',        'Long run', 10.0, 'All easy. Nothing quick.'),
        ( 4, 'Easy',       5.0, 'All easy.',                                                  'Long run',  9.0, 'Easy week. Keep it short.'),
        ( 5, 'Threshold',  6.0, '15 min easy, then 5 × 1 mi at threshold with 90 sec easy.', 'Long run', 11.0, 'All easy. Nothing quick.'),
        ( 6, 'Speed',      5.0, '15 min easy, then 10 × 400 m quick with equal easy.',       'Long run', 11.0, 'All easy. Nothing quick.'),
        ( 7, 'Threshold',  6.0, '15 min easy, then 5 × 1 mi at threshold with 90 sec easy.', 'Long run', 12.0, 'Last 20 min a little firmer.'),
        ( 8, 'Easy',       5.0, 'All easy.',                                                  'Long run', 10.0, 'Easy week. Keep it short.'),
        ( 9, 'Speed',      6.0, '15 min easy, then 10 × 400 m quick with equal easy.',       'Long run', 12.0, 'All easy. Nothing quick.'),
        (10, 'Threshold',  6.0, '15 min easy, then 6 × 1 mi at threshold with 90 sec easy.', 'Long run', 13.0, 'Last 20 min a little firmer.'),
        (11, 'Speed',      6.0, '15 min easy, then 12 × 400 m quick with equal easy.',       'Long run', 13.0, 'All easy. Nothing quick.'),
        (12, 'Easy',       5.0, 'All easy. Tuesday was the big one.',                         'Long run', 14.0, 'All easy. Nothing quick.'),
        (13, 'Speed',      5.0, '15 min easy, then 8 × 400 m quick with equal easy.',        'Long run', 12.0, 'All easy. Nothing quick.'),
        (14, 'Easy',       4.0, 'All easy.',                                                  'Long run', 10.0, 'Coming down now.'),
        (15, 'Easy',       4.0, 'All easy. A few strides.',                                   'Long run',  8.0, 'Short and easy.'),
        (16, 'Easy',       4.0, 'All easy. A few strides.',                                   'Long run',  8.0, 'Short and easy.')
      ) as t(num, thu_title, thu_mi, thu_shape, sun_title, sun_mi, sun_shape)
      where t.num <= case when r.slug = 'marcus' then 16 else 14 end
    loop
      select id into w_id from public.training_weeks
       where athlete_id = r.id and week_number = wk.num;
      if w_id is null then continue; end if;

      insert into public.planned_sessions (athlete_id, week_id, scheduled_on, day_label, position, state)
      values (r.id, w_id, date '2026-08-23' + ((wk.num - 1) * 7) + 4, 'THU', 2, 'published')
      returning id into p_id;
      insert into public.planned_session_versions
        (athlete_id, planned_session_id, version_number, title, shape, prescribed_distance, distance_unit, rpe_low, rpe_high)
      values (r.id, p_id, 1, wk.thu_title, wk.thu_shape, wk.thu_mi, 'mi',
              case when wk.thu_title = 'Easy' then 4 else 7 end,
              case when wk.thu_title = 'Easy' then 5 else 8 end);

      insert into public.planned_sessions (athlete_id, week_id, scheduled_on, day_label, position, state)
      values (r.id, w_id, date '2026-08-23' + ((wk.num - 1) * 7), 'SUN', 3, 'published')
      returning id into p_id;
      insert into public.planned_session_versions
        (athlete_id, planned_session_id, version_number, title, shape, prescribed_distance, distance_unit, rpe_low, rpe_high)
      values (r.id, p_id, 1, wk.sun_title, wk.sun_shape, wk.sun_mi, 'mi', 5, 6);
    end loop;
  end loop;
end $$;
