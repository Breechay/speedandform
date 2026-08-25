-- The coaching week is Monday to Sunday. Sunday is the last run of the week.
--
-- The block was authored with `date '2026-08-23' + (n-1)*7`, which anchors weeks
-- on Sunday. That is a data defect, not product authority, and it produces three
-- visible wrongs: Marcus has no week 1, his Sunday long run sorts before the
-- Tuesday and Thursday that follow it, and race day falls outside the last week.
--
-- Additive and in place. No row is deleted and recreated. Every training_weeks id
-- that exists is kept, every planned_sessions id is kept, and every scheduled_on
-- and prescribed distance is left exactly as authored. Only week boundaries move,
-- and each session is filed under the week that contains its own date.
--
-- The apparent re-pairing of long runs is presentation only. Nov 8's fourteen
-- miles still falls two days before Nov 10's ten at race pace; only the box drawn
-- around them changes. Moving a prescription would be the actual coaching change,
-- so nothing here moves one.
--
-- Natalie is not in scope. Her block is a different program on a different claim.

do $$
declare
  b record;
  wk integer;
  monday constant date := date '2026-08-24';   -- the Monday of week 1
  w_id uuid;
  moved integer := 0;
begin
  for b in
    select tb.id, tb.athlete_id, tb.total_weeks, tb.race_on, a.slug
      from public.training_blocks tb
      join public.athletes a on a.id = tb.athlete_id
     where tb.status = 'active' and a.slug in ('hope', 'jose', 'marcus')
  loop
    -- 1. Every week from 1 to the block's authored length, Monday anchored.
    --    Existing rows are updated in place so their ids and history survive.
    for wk in 1 .. b.total_weeks loop
      update public.training_weeks
         set starts_on = monday + ((wk - 1) * 7),
             ends_on   = monday + ((wk - 1) * 7) + 6
       where block_id = b.id and week_number = wk;

      if not found then
        -- Marcus never had a week 1, and neither Half block had its final race
        -- week. Insert, never replace.
        insert into public.training_weeks
          (athlete_id, block_id, week_number, starts_on, ends_on, state)
        values (b.athlete_id, b.id, wk,
                monday + ((wk - 1) * 7), monday + ((wk - 1) * 7) + 6, 'planned');
      end if;
    end loop;

    -- 2. File each authored session under the week that contains its own date.
    --    scheduled_on is untouched; only week_id moves.
    for w_id in
      select id from public.training_weeks where block_id = b.id
    loop
      update public.planned_sessions ps
         set week_id = w_id
        from public.training_weeks tw
       where tw.id = w_id
         and ps.athlete_id = b.athlete_id
         and ps.scheduled_on between tw.starts_on and tw.ends_on
         and ps.week_id is distinct from w_id;
      get diagnostics moved = row_count;
    end loop;
  end loop;
end $$;

-- ── Validation. Any failure aborts the migration. ───────────────────────────

do $$
declare
  bad integer;
  detail text;
begin
  -- Week 1 starts on Monday 24 August for every block in scope.
  select count(*) into bad
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and tw.week_number = 1 and tw.starts_on <> date '2026-08-24';
  if bad > 0 then raise exception 'week 1 does not start on 2026-08-24 (% blocks)', bad; end if;

  -- Week numbering is contiguous from 1 and as long as the block says.
  select count(*) into bad
    from public.training_blocks tb
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and tb.total_weeks <> (select count(*) from public.training_weeks w where w.block_id = tb.id);
  if bad > 0 then raise exception 'a block does not have total_weeks weeks (% blocks)', bad; end if;

  -- Every week is exactly Monday to Sunday.
  select count(*) into bad
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and (extract(isodow from tw.starts_on) <> 1 or tw.ends_on <> tw.starts_on + 6);
  if bad > 0 then raise exception '% weeks are not Monday to Sunday', bad; end if;

  -- Every planned session falls inside the week it points at.
  select count(*) into bad
    from public.planned_sessions ps
    join public.training_weeks tw on tw.id = ps.week_id
    join public.training_blocks tb on tb.id = tw.block_id
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and ps.scheduled_on not between tw.starts_on and tw.ends_on;
  if bad > 0 then raise exception '% sessions sit outside their week', bad; end if;

  -- Race day belongs to the final week of its block.
  select count(*) into bad
    from public.training_blocks tb
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active' and tb.race_on is not null
     and not exists (
       select 1 from public.training_weeks w
        where w.block_id = tb.id and w.week_number = tb.total_weeks
          and tb.race_on between w.starts_on and w.ends_on);
  if bad > 0 then raise exception 'race day is outside the final week (% blocks)', bad; end if;

  -- Inside a week the authored order is Tuesday, Thursday, Sunday, and position
  -- already carries it. Prove position and date agree.
  select count(*) into bad
    from public.planned_sessions a1
    join public.planned_sessions a2
      on a2.week_id = a1.week_id and a2.id <> a1.id
    join public.athletes a on a.id = a1.athlete_id
   where a.slug in ('hope', 'jose', 'marcus')
     and a1.position < a2.position and a1.scheduled_on > a2.scheduled_on;
  if bad > 0 then raise exception 'position and date disagree inside a week (% pairs)', bad; end if;

  select string_agg(format('W%s %s..%s', tw.week_number, tw.starts_on, tw.ends_on), '  ' order by tw.week_number)
    into detail
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id
    join public.athletes a on a.id = tb.athlete_id
   where a.slug = 'marcus' and tb.status = 'active';
  raise notice 'marcus runway: %', detail;
end $$;

comment on column public.training_weeks.starts_on is
  'Monday. The coaching week runs Monday to Sunday and the long run closes it. Sessions are filed under the week containing their own scheduled_on, never by authoring order.';
