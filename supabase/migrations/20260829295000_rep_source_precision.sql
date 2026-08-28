-- The stopwatch measured tenths. The column stored whole seconds.
--
-- Hope's six reps were measured to a tenth and filed into an integer column, so a
-- rep spread of 10.3 seconds came back out of the database as 11. Nobody rounded
-- anything on purpose. The storage did it, silently, and the derived figure then
-- stood in for the measurement it had replaced.
--
-- Eleven and 10.3 fall in the same consistency band, so no confidence proposal
-- changes. That is luck, not a reason to leave it: the next spread that matters
-- will sit on a band edge, and a rounding nobody chose will decide it.
--
-- So the source keeps its own column. The integer stays, because everything reads
-- it and a rep time in whole seconds is the right thing to show an athlete. It is
-- now explicitly a rounding of the measurement rather than the measurement, and
-- the constraint holds it to within a second of the source so the two can never
-- drift into disagreeing about what happened.
--
-- Nothing is backfilled here. The per-rep tenths behind Hope's 10.3 are in the
-- screenshots, not in this database, and a set of tenths invented to add up to a
-- known spread would be a fabrication wearing the costume of precision.

alter table public.session_pieces
  add column if not exists duration_seconds_exact numeric(7,2)
    check (duration_seconds_exact is null or duration_seconds_exact >= 0);

alter table public.session_pieces
  drop constraint if exists pieces_integer_is_a_rounding;
alter table public.session_pieces
  add constraint pieces_integer_is_a_rounding check (
    duration_seconds_exact is null
    or duration_seconds is null
    or abs(duration_seconds_exact - duration_seconds) <= 1);

comment on column public.session_pieces.duration_seconds_exact is
  'The measurement as it was taken, when it was taken more finely than a second. Authoritative over duration_seconds, which is a rounding of it kept for display and for every existing reader. Any computation over rep times must prefer this when present, or integer storage decides band edges by accident.';
comment on column public.session_pieces.duration_seconds is
  'Whole seconds. A rounding of duration_seconds_exact when that is present, and the measurement itself when it is not.';

do $$
declare bad integer;
begin
  select count(*) into bad from public.session_pieces
   where duration_seconds_exact is not null and duration_seconds is not null
     and abs(duration_seconds_exact - duration_seconds) > 1;
  if bad > 0 then raise exception 'source precision disagrees with stored seconds in % pieces', bad; end if;
end $$;
