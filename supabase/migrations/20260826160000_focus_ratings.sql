-- The three state words are out. Brice does this evaluation on Sundays and wants
-- to set it with a slider, so the read becomes a rating rather than a label.
--
-- Deliberately no number is shown to the athlete. A visible score is a score, and
-- scores get chased — the rating locates where a cue sits, it does not grade her.
--
-- state is kept and still written, because the single-leg rule reads from it and
-- the two must not drift. Rating is what the page shows.

alter table public.movement_reads add column if not exists rating smallint
  check (rating is null or rating between 1 and 5);

update public.movement_reads
   set rating = case state
     when 'holds' then 5
     when 'holds_until_tired' then 3
     when 'not_yet' then 1
   end
 where rating is null;

comment on column public.movement_reads.rating is
  '1-5, set by Brice on Sundays. Shown as a position, never as a number.';

-- Each cue points at the work that answers it, so the athlete can go from
-- "this is what I am working on" to "this is what I do about it" in one tap.
alter table public.movement_reads add column if not exists support_purpose text;

update public.movement_reads
   set support_purpose = 'Own the single leg'
 where marker = 'single_leg_control';
