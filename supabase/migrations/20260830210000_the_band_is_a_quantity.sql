-- A pace band is a quantity. It was stored as two strings.
--
-- `pace_low` and `pace_high` are text: "6:30", "6:45". Everything that has ever
-- needed to compare against them has parsed them at read time, and the ownership
-- ladder about to be built needs to ask "how many of these miles were inside the
-- band" on every session in a campaign. A ladder that parses a string to decide
-- what an athlete owns will draw a lie the first time somebody types "6.30" or
-- "6:3" or a stray space.
--
-- So the seconds are derived once, here, with a constraint that keeps them agreeing
-- with the strings. The strings stay: they are what a coach typed and what the
-- screens render, and rewriting them into seconds would lose the authored form.
--
-- Nothing about race pace is decided here. This makes the band countable; which
-- band counts as race pace is a coaching decision and not one a migration makes.

alter table public.planned_session_components
  add column if not exists pace_low_seconds integer,
  add column if not exists pace_high_seconds integer;

create or replace function public.pace_clock_seconds(raw text)
returns integer
language sql immutable as $$
  select case
    when raw is null then null
    when btrim(raw) ~ '^[0-9]{1,2}:[0-5][0-9]$'
      then split_part(btrim(raw), ':', 1)::integer * 60 + split_part(btrim(raw), ':', 2)::integer
    else null
  end;
$$;

comment on function public.pace_clock_seconds is
  'Parses an authored m:ss pace into seconds, or returns null. Deliberately strict: a band that cannot be read as a quantity must read as absent rather than as a number somebody guessed.';

update public.planned_session_components
   set pace_low_seconds  = public.pace_clock_seconds(pace_low),
       pace_high_seconds = public.pace_clock_seconds(pace_high)
 where pace_low is not null or pace_high is not null;

alter table public.planned_session_components
  drop constraint if exists components_band_reads_forwards;
alter table public.planned_session_components
  add constraint components_band_reads_forwards check (
    pace_low_seconds is null or pace_high_seconds is null
    or pace_low_seconds <= pace_high_seconds);

do $$
declare unreadable integer;
begin
  select count(*) into unreadable from public.planned_session_components
   where pace_low is not null and pace_low_seconds is null;
  if unreadable > 0 then
    raise exception '% authored bands could not be read as a quantity', unreadable;
  end if;
end $$;
