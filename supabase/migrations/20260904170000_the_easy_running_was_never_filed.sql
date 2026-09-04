-- The easy running was never filed.
--
-- Both athletes run five or six days a week. FORM held eight completions in
-- total, all of them key sessions, because the weekly easy budget is one
-- authored quantity with no date and nothing was ever filed against it. So the
-- plan could show what was asked and almost never what was done, and José's
-- Monday — 7.02 miles at 8:44 — existed only in a screenshot.
--
-- These twelve rows are read off Strava for 24 August to 4 September and filed
-- as coach_import, which is what they are: the coach entering evidence he can
-- see. Nothing is inferred. Distance, clock, surface and the athlete's own words
-- are transcribed; anything the screenshot did not show is null.
--
-- Two of them attach to authored sessions nobody had filed:
--   José  29 Aug — 12.02 mi at 8:39 against an authored 9.  Status changed.
--   Hope  29 Aug — 12.09 mi at 8:07 against an authored 12. Status completed.
-- The difference between the prescription and the filing is information and is
-- kept as difference. Neither authored session is touched.
--
-- The other ten carry no planned_session_id, and that is not a workaround. There
-- is no authored session on those days. The weekly budget is a quantity the
-- athlete places, not a session with a date, and attaching Monday's run to
-- "Easy — 18 mi across the week" would invent a schedule nobody wrote. An
-- unattached filing is the true shape: this was run, on this day, and nothing was
-- authored for it.
--
-- No session_pieces are written. Not to keep anything away from a metric — the
-- kind column admits warmup, rep, float and cooldown only, and a continuous easy
-- run is none of those. It has no split to file, so it files none. When a piece
-- kind exists for continuous running, these rows can carry one.
--
-- Cross-training is not filed. The stair-stepper and the two weight sessions on
-- 30 August and 2 September are real and have no home in this schema, and
-- inventing one for them would be worse than the gap.

do $$
declare
  jose  uuid := (select id from public.athletes where slug = 'jose');
  hope  uuid := (select id from public.athletes where slug = 'hope');
  brice uuid := '79d1520c-7c7c-4cd2-bd31-229a3cc56158';
begin

insert into public.session_completions
  (athlete_id, planned_session_id, status, actual_distance, distance_unit,
   duration_seconds, surface, athlete_note, source, filed_by, filed_at)
values
  -- José. filed_at is the activity's own start time, Eastern.
  (jose, null, 'completed', 4.02, 'mi', 2120, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-08-24 07:17-04'),
  (jose, null, 'completed', 5.05, 'mi', 2867, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-08-26 07:19-04'),
  (jose, null, 'completed', 6.02, 'mi', 3223, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-08-27 06:54-04'),
  (jose, null, 'completed', 3.52, 'mi', 1971, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-08-28 06:02-04'),
  (jose, (select id from public.planned_sessions
            where athlete_id = jose and scheduled_on = date '2026-08-29'),
     'changed', 12.02, 'mi', 6240, 'outdoor',
     'Supposed to be easy miles. Plan was to get base points but that just didn''t seem possible with weather.',
     'coach_import', brice, timestamptz '2026-08-29 06:45-04'),
  (jose, null, 'completed', 7.02, 'mi', 3660, 'treadmill', 'Rainy outside',
     'coach_import', brice, timestamptz '2026-08-31 06:13-04'),
  (jose, null, 'completed', 7.03, 'mi', 3780, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-09-02 06:10-04'),
  (jose, null, 'completed', 7.26, 'mi', 3840, 'outdoor',
     'Easy miles turned progression run lol, with Hope.',
     'coach_import', brice, timestamptz '2026-09-03 06:04-04'),
  (jose, null, 'completed', 3.54, 'mi', 1880, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-09-04 07:42-04'),

  -- Hope. Only the days her screenshots covered.
  (hope, null, 'completed', 7.29, 'mi', 3900, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-08-24 05:09-04'),
  (hope, null, 'completed', 7.27, 'mi', 3960, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-08-26 05:10-04'),
  (hope, (select id from public.planned_sessions
            where athlete_id = hope and scheduled_on = date '2026-08-29'),
     'completed', 12.09, 'mi', 5880, 'outdoor', null,
     'coach_import', brice, timestamptz '2026-08-29 06:31-04');

end $$;
