-- Brice's correction: "Keep easy genuinely easy." is his line and stays. What
-- broke it was the clause bolted on afterwards — "Let Sunday answer the distance
-- question" — the elaboration that turns a plain instruction into a paragraph.
--
-- So this trims rather than deletes, and makes the fields nullable, because a
-- week with nothing yet authored is a real state and should render as nothing.
--
-- planned_session_versions is deliberately immutable ("plan changes are never
-- overwritten"), so session text is corrected by authoring a new version, never
-- by an update. That is why the first draft of this migration failed, correctly.

alter table public.training_weeks alter column intent drop not null;
alter table public.training_weeks alter column matters_because drop not null;

update public.training_weeks
   set intent = 'Keep easy genuinely easy.'
 where intent like 'Keep easy genuinely easy.%';

update public.training_weeks set matters_because = null;
