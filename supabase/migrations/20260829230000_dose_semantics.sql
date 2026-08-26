-- A prescription is a band with a target, not a single number.
--
-- Jose was asked for three to six race-pace reps: three is good, four is
-- correct, five if it stays even, six if it stays manageable. He ran four and
-- stopped when the fourth reached RPE 9 with cramping and heat. Under a schema
-- that stores one repeat_count, four of six reads as partial volume and the
-- session gets scored as a shortfall. It is not a shortfall. It is the session
-- landing exactly where it was authored to land.
--
-- The wrong reading came from the schema, not from the coach, which is why it
-- had to be corrected by hand every time. So the band is stored.
--
--   minimum      below this the session did not do its job
--   target       what correct looks like
--   progression  take it if the work stays even
--   ceiling      the most that is ever useful here
--
-- repeat_count stays and means the target, so nothing that reads it today
-- changes meaning. The band qualifies it and never contradicts it.

alter table public.planned_session_components
  add column if not exists repeat_minimum smallint,
  add column if not exists repeat_target smallint,
  add column if not exists repeat_progression smallint,
  add column if not exists repeat_ceiling smallint;

-- Existing repetition work already states its target in repeat_count. The rest
-- of the band was never authored, so it stays null rather than being guessed.
update public.planned_session_components
   set repeat_target = repeat_count
 where shape = 'repetitions' and repeat_count is not null and repeat_target is null;

alter table public.planned_session_components
  add constraint components_band_is_ordered check (
    coalesce(repeat_minimum, 1) <= coalesce(repeat_target, repeat_minimum, 1)
    and coalesce(repeat_target, 1) <= coalesce(repeat_progression, repeat_ceiling, repeat_target, 1)
    and coalesce(repeat_progression, 1) <= coalesce(repeat_ceiling, repeat_progression, 1));

-- One truth. The target and the count cannot drift apart.
alter table public.planned_session_components
  add constraint components_target_is_the_count check (
    repeat_target is null or repeat_count is null or repeat_target = repeat_count);

-- A band only means anything on repetitions.
alter table public.planned_session_components
  add constraint components_band_needs_repetitions check (
    shape = 'repetitions'
    or (repeat_minimum is null and repeat_target is null
        and repeat_progression is null and repeat_ceiling is null));

comment on column public.planned_session_components.repeat_minimum is
  'Below this the session did not do its job. Above it the session is successful, and completing fewer than the ceiling is not a shortfall.';
comment on column public.planned_session_components.repeat_target is
  'What correct looks like. Equal to repeat_count, which is kept so nothing reading it changes meaning.';
comment on column public.planned_session_components.repeat_progression is
  'Take it if the work stays even. Not expected, and not missing when it is not taken.';
comment on column public.planned_session_components.repeat_ceiling is
  'The most that is ever useful here. Never a goal; an athlete who stops below it at honest effort has not fallen short.';

do $$
declare bad integer; detail text;
begin
  select count(*) into bad from public.planned_session_components
   where shape = 'repetitions' and repeat_target is null;
  if bad > 0 then raise exception '% repetition components have no target', bad; end if;

  select count(*) into bad from public.planned_session_components
   where repeat_target is not null and repeat_count is distinct from repeat_target;
  if bad > 0 then raise exception '% components have a target that is not the count', bad; end if;

  select string_agg(format('%s x%s (min %s, target %s, prog %s, ceil %s)',
           c.distance, c.repeat_count,
           coalesce(c.repeat_minimum::text,'-'), coalesce(c.repeat_target::text,'-'),
           coalesce(c.repeat_progression::text,'-'), coalesce(c.repeat_ceiling::text,'-')), '  ')
    into detail from public.planned_session_components c where c.shape = 'repetitions';
  raise notice 'repetition bands: %', coalesce(detail, 'none');
end $$;
