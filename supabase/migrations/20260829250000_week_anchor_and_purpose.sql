-- The week anchor is a program property, not an exception.
--
-- A first attempt migrated Natalie onto Monday weeks to make the console
-- consistent. That was wrong, and the dry run is what showed it: her block starts
-- on 23 August, the Track session that day is her authored week 1, and her
-- program runs Sunday, Tuesday, Thursday on purpose. Moving every Sunday back a
-- week changes which sessions belong together, and calling that presentation only
-- was incorrect. It would have rewritten authored coaching to satisfy a screen.
--
-- Two week models are fine when they are declared. They are not fine when one of
-- them is a scoped exception nobody can see, because then every week calculation
-- needs hidden special handling. So the anchor becomes explicit and the console
-- reads it instead of assuming.
--
-- Purpose is the same problem in a different place. A race build must end in the
-- week containing its race. A development block may aim at a race months past its
-- last week, which is exactly Natalie: eight weeks ending in October against a
-- January race. An earlier draft of that assertion only checked blocks whose race
-- already fell inside the block, which would let a broken race build pass by
-- being broken. The block declares what it is, and is checked against that.
--
-- No session moves. No week boundary moves. Nothing is relabelled.

alter table public.training_blocks
  add column if not exists week_starts_on smallint,
  add column if not exists purpose text;

comment on column public.training_blocks.week_starts_on is
  'ISO day of week the training week opens on: 1 Monday through 7 Sunday. Declared per block, because Natalie runs Sunday to Saturday by design and the half builds run Monday to Sunday. Read by anything that draws or compares weeks; never assumed.';
comment on column public.training_blocks.purpose is
  'race_build ends in the week containing its race. development aims at a race that may sit well beyond the final week, so the race is a destination rather than the last thing in the block.';

update public.training_blocks tb
   set week_starts_on = case when a.slug = 'natalie' then 7 else 1 end,
       purpose        = case when a.slug = 'natalie' then 'development' else 'race_build' end
  from public.athletes a
 where a.id = tb.athlete_id and tb.week_starts_on is null;

-- Anything not named above is a race build on Monday until someone says otherwise,
-- which is the existing behaviour written down rather than left implicit.
update public.training_blocks set week_starts_on = 1 where week_starts_on is null;
update public.training_blocks set purpose = 'race_build' where purpose is null;

alter table public.training_blocks
  add constraint block_week_anchor_known check (week_starts_on between 1 and 7);
alter table public.training_blocks
  add constraint block_purpose_known check (purpose in ('race_build', 'development'));
alter table public.training_blocks alter column week_starts_on set not null;
alter table public.training_blocks alter column purpose set not null;
alter table public.training_blocks alter column week_starts_on set default 1;

-- ── Validation against what each block declares ─────────────────────────────

do $$
declare bad integer; detail text;
begin
  -- Every week opens on the day its own block declares.
  select count(*) into bad
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id and tb.status = 'active'
   where extract(isodow from tw.starts_on) <> tb.week_starts_on;
  if bad > 0 then raise exception '% weeks do not open on their block''s declared day', bad; end if;

  -- Every week is seven days long.
  select count(*) into bad
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id and tb.status = 'active'
   where tw.ends_on <> tw.starts_on + 6;
  if bad > 0 then raise exception '% weeks are not seven days', bad; end if;

  -- Weeks are contiguous and numbered from one.
  select count(*) into bad
    from public.training_weeks tw
    join public.training_weeks prev
      on prev.block_id = tw.block_id and prev.week_number = tw.week_number - 1
   where tw.starts_on <> prev.starts_on + 7;
  if bad > 0 then raise exception '% weeks do not follow the week before them', bad; end if;

  select count(*) into bad
    from public.training_blocks tb
   where tb.status = 'active'
     and tb.total_weeks <> (select count(*) from public.training_weeks w where w.block_id = tb.id);
  if bad > 0 then raise exception '% blocks do not have total_weeks weeks', bad; end if;

  -- Every session sits inside the week it points at. No exemptions: nothing was
  -- moved, so nothing should have fallen out.
  select count(*) into bad
    from public.planned_sessions ps
    join public.training_weeks tw on tw.id = ps.week_id
    join public.training_blocks tb on tb.id = tw.block_id and tb.status = 'active'
   where ps.scheduled_on is not null
     and ps.scheduled_on not between tw.starts_on and tw.ends_on;
  if bad > 0 then raise exception '% sessions sit outside their week', bad; end if;

  -- A race build ends in the week containing its race. Checked for every race
  -- build, not only the ones where the date already happens to fit.
  select count(*) into bad
    from public.training_blocks tb
   where tb.status = 'active' and tb.purpose = 'race_build' and tb.race_on is not null
     and not exists (
       select 1 from public.training_weeks w
        where w.block_id = tb.id and w.week_number = tb.total_weeks
          and tb.race_on between w.starts_on and w.ends_on);
  if bad > 0 then raise exception '% race builds do not end in the week of their race', bad; end if;

  select string_agg(format('%s: %s weeks opening on isodow %s, %s',
           a.slug, tb.total_weeks, tb.week_starts_on, tb.purpose), '  ' order by a.slug)
    into detail
    from public.training_blocks tb join public.athletes a on a.id = tb.athlete_id
   where tb.status = 'active';
  raise notice 'blocks: %', detail;
end $$;
