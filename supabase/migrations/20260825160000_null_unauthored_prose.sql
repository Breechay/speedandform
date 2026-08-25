-- More seeded prose was speaking in Brice's voice. He identified the week intent
-- as not his line, and it is not: nothing in the brief contains it.
--
-- Kept (traceable to the brief, his words):
--   athlete_marks.current_question  — brief §6, verbatim
--   planned_session_versions.title  — structural labels, not coaching prose
--
-- Cleared (invented, or recombined into something he never wrote):
--   training_weeks.intent
--   training_weeks.matters_because
--   planned_session_versions.intent
--
-- These become nullable because "not yet authored" is a real and honest state.
-- The record already renders nothing when they are null. Per VOICE_LAW §1,
-- absence is correct; a plausible-sounding placeholder is not.

alter table public.training_weeks alter column intent drop not null;
alter table public.training_weeks alter column matters_because drop not null;

update public.training_weeks set intent = null, matters_because = null;
update public.planned_session_versions set intent = null;
