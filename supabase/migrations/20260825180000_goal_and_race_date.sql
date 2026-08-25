-- Her page should open with who she is and what she is training for. The block
-- carried target_event and goal_label as two fragments, and no race date at all
-- (ends_on is when the block finishes, not when she runs).
--
-- goal_statement is written by Brice and rendered verbatim. Composing one from
-- fragments would be the interface writing in his voice, which VOICE_LAW §2
-- forbids. Until he writes it, the page shows the fragments as the data they are.

alter table public.training_blocks add column if not exists race_on date;
alter table public.training_blocks add column if not exists goal_statement text;

comment on column public.training_blocks.race_on is
  'The day she runs. Distinct from ends_on, which is when the block closes.';
comment on column public.training_blocks.goal_statement is
  'Brice''s words, rendered verbatim. Never composed from other columns.';

-- Sessions are named for what they are. Who runs with her is his call on the day.
insert into public.planned_session_versions
  (athlete_id, planned_session_id, version_number, title, intent, prescribed_distance, distance_unit, authored_by)
select v.athlete_id, v.planned_session_id, v.version_number + 1, 'Track', v.intent,
       v.prescribed_distance, v.distance_unit, v.authored_by
from public.planned_session_versions v
where v.title = 'Track with Brice'
  and v.version_number = (
    select max(v2.version_number) from public.planned_session_versions v2
    where v2.planned_session_id = v.planned_session_id
  );
