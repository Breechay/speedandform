-- The pace band describes the work, not the warm up.
--
-- 20260829210000 corrected components to carry their own version's band, but it
-- applied that to every component. So the 25 August warm up and cool down came
-- out reading 6:25 to 6:30, which says the twenty easy minutes in were run at
-- race pace. They were not. A version's band is the target for its decisive
-- work; everything around it is authored against effort.
--
-- The rule is narrowed here: the work component carries the version's band, and
-- every other role carries none. Effort is untouched, and rpe 4-5 in and out is
-- what actually describes those pieces.

create or replace function public.component_pace_follows_prescription()
returns trigger language plpgsql as $$
declare authored_low text; authored_high text;
begin
  if new.role <> 'work' then
    if new.pace_low is not null or new.pace_high is not null then
      raise exception 'only the work component carries a pace band; % is authored against effort', new.role;
    end if;
    return new;
  end if;
  select v.pace_low, v.pace_high into authored_low, authored_high
    from public.planned_session_versions v where v.id = new.version_id;
  if new.pace_low is distinct from authored_low or new.pace_high is distinct from authored_high then
    raise exception 'the work component must carry its own version''s authored pace band';
  end if;
  return new;
end $$;

-- Narrowed above before the rows move, because the previous rule would have
-- rejected this correction as a component disagreeing with its version.
update public.planned_session_components
   set pace_low = null, pace_high = null
 where role <> 'work' and (pace_low is not null or pace_high is not null);

comment on function public.component_pace_follows_prescription() is
  'The work component inherits its version''s authored pace band; warm up, recovery and cool down carry none, because they are authored against effort. A backfill keyed on date and title once gave the 25 August sessions 6:30 to 6:45 over the 6:25 to 6:30 that was actually asked, and a first correction then spread that band across the warm up as well.';

do $$
declare bad integer; detail text;
begin
  select count(*) into bad from public.planned_session_components
   where role <> 'work' and (pace_low is not null or pace_high is not null);
  if bad > 0 then raise exception '% non-work components still carry a pace', bad; end if;

  select count(*) into bad
    from public.planned_session_components c
    join public.planned_session_versions v on v.id = c.version_id
   where c.role = 'work'
     and (c.pace_low is distinct from v.pace_low or c.pace_high is distinct from v.pace_high);
  if bad > 0 then raise exception '% work components disagree with their version', bad; end if;
end $$;
