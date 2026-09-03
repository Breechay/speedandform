-- A race has a name and a place, and a caption is not a description.
--
-- Two small corrections, both of the same kind: the design was saying something
-- the schema could not, so the words lived in a mockup instead of in a row.
--
-- ── the race ────────────────────────────────────────────────────────────────
--
-- The bench draws "OUC Half · Orlando · 5 Dec". The database says "Half
-- marathon", because `athletes.target_event` is a distance in a field that gets
-- read as an event. A race has a name, a place and a date; the date has lived on
-- `training_blocks.race_on` all along and the other two were prose in a design
-- file.
--
-- They go on the block rather than the athlete, because an athlete has a race
-- per campaign and not a race forever. `target_event` stays where it is and is
-- what the surfaces fall back to.

alter table public.training_blocks
  add column if not exists race_name text,
  add column if not exists race_place text;

comment on column public.training_blocks.race_name is
  'What the race is called — "OUC Half", not "Half marathon". Null falls back to athletes.target_event, which is a distance and reads thinner.';
comment on column public.training_blocks.race_place is
  'Where it is run. Null renders nothing rather than a guess.';

-- Backfilled from what is already known and nowhere else recorded. Hope and José
-- run the same race, named in the design and never in a row; Marcus and Natalie
-- already carry a race name in target_event with no place stated, so the name
-- moves and the place stays empty rather than being invented.
update public.training_blocks b set race_name = 'OUC Half', race_place = 'Orlando'
 where b.status = 'active' and b.race_name is null
   and exists (select 1 from public.athletes a where a.id = b.athlete_id and a.slug in ('hope', 'jose'));

update public.training_blocks b set race_name = a.target_event
  from public.athletes a
 where a.id = b.athlete_id and b.status = 'active' and b.race_name is null
   and a.slug in ('marcus', 'natalie');

-- ── the caption ─────────────────────────────────────────────────────────────
--
-- "Longest continuous run at race pace" is a description, and it sits under a
-- number as a caption. Captions are short. The question beside the mark already
-- carries the full sentence — "How far can he hold 6:30–6:45 without it coming
-- apart?" — so the label does not have to say it twice.
--
-- The value and the unit are untouched. This is the wording, not the evidence.

update public.athlete_marks set label = 'continuous at race pace'
 where active and label = 'Longest continuous run at race pace';

update public.athlete_marks set label = 'continuous'
 where active and label = 'Longest continuous distance';
