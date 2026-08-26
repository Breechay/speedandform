-- A component's target is its own version's target. Never a later convention.
--
-- 20260829170000 backfilled the race-pace sessions from a table that carried
-- 6:30 to 6:45 on every row, and matched sessions by date and title with no
-- version filter. Two things went wrong on 2026-08-25.
--
-- First, the 25 August prescription is not 6:30 to 6:45. Version 1 authored no
-- band at all, and 20260826220000 appended version 2 recording what was actually
-- asked: 6:25 to 6:30. So the backfill did not invent a band out of nothing, it
-- overwrote a real one with the wrong numbers, which is worse. Hope held 6:19
-- against a 6:25 target, and against 6:30 to 6:45 the same run reads as a
-- different session entirely.
--
-- Second, with no version filter the backfill attached components to version 1
-- as well, giving a superseded prescription a dose it never had.
--
-- The rule, applied here and enforced from here on: a component carries its own
-- version's authored band, or none. Effort is untouched throughout; the rpe
-- values on those versions are real.

update public.planned_session_components c
   set pace_low = v.pace_low, pace_high = v.pace_high
  from public.planned_session_versions v
 where v.id = c.version_id
   and (c.pace_low is distinct from v.pace_low or c.pace_high is distinct from v.pace_high);

create or replace function public.component_pace_follows_prescription()
returns trigger language plpgsql as $$
declare authored_low text; authored_high text;
begin
  select v.pace_low, v.pace_high into authored_low, authored_high
    from public.planned_session_versions v where v.id = new.version_id;
  if new.pace_low is distinct from authored_low or new.pace_high is distinct from authored_high then
    raise exception 'a component must carry its own version''s authored pace band, not another version''s';
  end if;
  return new;
end $$;

revoke all on function public.component_pace_follows_prescription() from public;

create trigger components_pace_follows_prescription
  before insert or update on public.planned_session_components
  for each row execute function public.component_pace_follows_prescription();

comment on function public.component_pace_follows_prescription() is
  'A component inherits the pace band of the version it belongs to. A backfill keyed on date and title once gave the 25 August sessions 6:30 to 6:45, overwriting the 6:25 to 6:30 that was actually authored and attaching a dose to a superseded version as well. Reading a run against a band nobody asked for changes what the run means.';

do $$
declare bad integer; detail text;
begin
  select count(*) into bad
    from public.planned_session_components c
    join public.planned_session_versions v on v.id = c.version_id
   where c.pace_low is distinct from v.pace_low or c.pace_high is distinct from v.pace_high;
  if bad > 0 then raise exception '% components still disagree with their version', bad; end if;

  select string_agg(format('%s v%s %s..%s', ps.scheduled_on, v.version_number,
                           coalesce(c.pace_low,'none'), coalesce(c.pace_high,'none')), '  ')
    into detail
    from public.planned_session_components c
    join public.planned_session_versions v on v.id = c.version_id
    join public.planned_sessions ps on ps.id = v.planned_session_id
   where ps.scheduled_on = date '2026-08-25' and c.role = 'work';
  raise notice '25 August work components: %', coalesce(detail, 'none');
end $$;
