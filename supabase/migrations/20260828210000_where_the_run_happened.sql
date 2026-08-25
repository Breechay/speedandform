-- Where the run happened, and in what.
--
-- Marcus's claim is how far he can hold 6:30-6:45 outside. Nothing in the record
-- said whether a run was outside. The only "surface" column was home_surface,
-- which is about whether an athlete uses the website or the app.
--
-- So his claim could not be answered by any session we hold, and worse, a
-- treadmill six would have looked identical to a road six. That is not a display
-- problem; the fact was never captured.
--
-- Kept small on purpose. Surface answers his question. Temperature and a plain
-- conditions line cover the case where a pace means something different than the
-- number suggests. Anything more is weather decoration.

alter table public.session_completions
  add column if not exists surface text
    check (surface is null or surface in ('treadmill', 'road', 'track', 'trail'));

alter table public.session_completions
  add column if not exists temperature_f smallint
    check (temperature_f is null or temperature_f between -40 and 140);

alter table public.session_completions
  add column if not exists conditions text;

comment on column public.session_completions.surface is
  'Where the run happened. A treadmill session cannot answer a claim about running outside, which is Marcus''s whole question.';
comment on column public.session_completions.conditions is
  'Plain words for anything that changed what the pace cost. Not a weather feed.';
