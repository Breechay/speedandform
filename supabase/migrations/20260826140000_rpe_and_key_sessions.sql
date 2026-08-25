-- Two things.
--
-- 1. RPE becomes a recorded coordinate, not a number in a note.
--    Pace already resolves against a band; effort should be capable of the same.
--    Storing the prescribed band next to what actually happened is what makes
--    "nailed the pace at RPE 9 against a prescribed 7-8" a statable fact rather
--    than something Brice has to catch by reading a Garmin screenshot.
--    This migration stores it. It does not yet judge it.
--
-- 2. Hope and Jose's 4x1mi from 2026-08-25, entered by Brice from their Garmin
--    files. Their plan source stays form_program; this is the key-session record
--    he keeps himself, which is the point of him filing rather than them.

alter table public.session_completions add column if not exists rpe smallint
  check (rpe is null or rpe between 1 and 10);
alter table public.planned_session_versions add column if not exists rpe_low smallint
  check (rpe_low is null or rpe_low between 1 and 10);
alter table public.planned_session_versions add column if not exists rpe_high smallint
  check (rpe_high is null or rpe_high between 1 and 10);

comment on column public.session_completions.rpe is
  'Effort as the athlete reported it. Never inferred from pace.';
comment on column public.planned_session_versions.rpe_low is
  'Lower bound of the prescribed effort band. Null means effort was not prescribed.';

-- Their race, which was not recorded anywhere.
do $$
declare
  r record;
  b_id uuid; w_id uuid; p_id uuid; v_id uuid; c_id uuid;
begin
  for r in
    select * from (values
      ('hope', 9.36, 4473, 9, '4×1 mi: 6:29 · 6:20 · 6:22 · 6:19. Floats 3:00 each.'),
      ('jose', 9.32, 4198, 8, '4×1 mi: 6:31 · 6:28 · 6:30 · 6:27. Floats 8:14 · 8:30 · 8:26.')
    ) as t(slug, miles, seconds, rpe, note)
  loop
    insert into public.training_blocks
      (athlete_id, source, name, block_number, target_event, total_weeks, starts_on, ends_on, race_on, status)
    select id, 'form_program', 'Half build', 1, 'OUC Half Marathon · Orlando',
           15, date '2026-08-23', date '2026-12-05', date '2026-12-05', 'active'
    from public.athletes where slug = r.slug
    returning id into b_id;

    insert into public.training_weeks (athlete_id, block_id, week_number, starts_on, ends_on, state)
    select athlete_id, id, 1, starts_on, starts_on + 6, 'in_progress'
    from public.training_blocks where id = b_id
    returning id into w_id;

    insert into public.planned_sessions (athlete_id, week_id, scheduled_on, day_label, position, state)
    select athlete_id, w_id, date '2026-08-25', 'TUE', 1, 'published'
    from public.training_blocks where id = b_id
    returning id into p_id;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance, distance_unit, rpe_low, rpe_high)
    select athlete_id, p_id, 1, '4×1 mi at race pace', 4.0, 'mi', 7, 8
    from public.training_blocks where id = b_id;

    insert into public.session_completions
      (athlete_id, planned_session_id, status, actual_distance, distance_unit,
       duration_seconds, rpe, athlete_note, source, filed_at)
    select athlete_id, p_id, 'completed', r.miles, 'mi', r.seconds, r.rpe, r.note,
           'coach_import', timestamptz '2026-08-25 11:00:00+00'
    from public.training_blocks where id = b_id;
  end loop;
end $$;
