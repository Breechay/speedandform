-- The grade is a state, not a score, and three states carry it.
--
--   holds · holds until tired · not yet
--
-- "Holds until tired" is the one that does the work: it tells the athlete why
-- the support block exists without anyone writing a paragraph about it. The old
-- four-value vocabulary (present/available/fades/developing) split that meaning
-- across two values and never named the tired case plainly.
--
-- Cue text is left untouched. Cues are authored coaching; only the state
-- vocabulary is structural.

alter table public.movement_reads drop constraint if exists movement_reads_state_check;

update public.movement_reads
   set state = case state
     when 'present'    then 'holds'
     when 'available'  then 'holds'
     when 'fades'      then 'holds_until_tired'
     when 'developing' then 'not_yet'
     else state
   end;

alter table public.movement_reads
  add constraint movement_reads_state_check
  check (state in ('holds', 'holds_until_tired', 'not_yet'));

-- The gate, stated once in the schema so it cannot drift into prose:
-- single-leg control reading 'not_yet' means the next distance holds.
comment on column public.movement_reads.state is
  'holds | holds_until_tired | not_yet. single_leg_control = not_yet holds the next distance.';
