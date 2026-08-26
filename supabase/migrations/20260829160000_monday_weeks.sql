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
--
-- On ordering: planned_sessions carries a unique (week_id, position). A first
-- attempt refiled one week at a time and failed on it, because the Sunday moving
-- OUT of a week was still sitting on position 3 when the Sunday moving IN
-- arrived. Nothing applied. So the authored order is parked on positions that
-- cannot collide, the weeks are rebuilt, every session is refiled in one
-- statement, and the order is put back.

-- 1. Park the authored order. Position is TUE 1, THU 2, SUN 3, and it is restored
--    untouched at the end; this table exists only to survive the move.
create temporary table _authored_position as
select ps.id, ps.position
  from public.planned_sessions ps
  join public.athletes a on a.id = ps.athlete_id
 where a.slug in ('hope', 'jose', 'marcus');

-- 2. Clear the (week_id, position) space. Globally unique temporary positions
--    mean no intermediate state of the refile can collide, whatever order the
--    rows happen to move in.
update public.planned_sessions ps
   set position = 1000 + t.n
  from (select id, row_number() over (order by id) as n from _authored_position) t
 where t.id = ps.id;

-- 3. Every week from 1 to the block's authored length, Monday anchored. Existing
--    rows are updated in place so their ids and history survive.
do $$
declare
  b record;
  wk integer;
  monday constant date := date '2026-08-24';   -- the Monday of week 1
begin
  for b in
    select tb.id, tb.athlete_id, tb.total_weeks
      from public.training_blocks tb
      join public.athletes a on a.id = tb.athlete_id
     where tb.status = 'active' and a.slug in ('hope', 'jose', 'marcus')
  loop
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
  end loop;
end $$;

-- 4. File each authored session under the week that contains its own date, in one
--    statement. scheduled_on is untouched; only week_id moves.
update public.planned_sessions ps
   set week_id = tw.id
  from public.training_weeks tw
  join public.training_blocks tb on tb.id = tw.block_id and tb.status = 'active'
  join public.athletes a on a.id = tb.athlete_id
 where a.slug in ('hope', 'jose', 'marcus')
   and ps.athlete_id = tb.athlete_id
   and ps.scheduled_on between tw.starts_on and tw.ends_on
   and ps.week_id is distinct from tw.id;

-- 5. Put the authored order back. Each Monday to Sunday week holds at most one
--    Tuesday, one Thursday and one Sunday, so the restore cannot collide.
update public.planned_sessions ps
   set position = t.position
  from _authored_position t
 where t.id = ps.id;

drop table _authored_position;

-- ── Validation. Any failure aborts the migration. ───────────────────────────

do $$
declare
  bad integer;
  detail text;
begin
  select count(*) into bad
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and tw.week_number = 1 and tw.starts_on <> date '2026-08-24';
  if bad > 0 then raise exception 'week 1 does not start on 2026-08-24 (% blocks)', bad; end if;

  select count(*) into bad
    from public.training_blocks tb
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and tb.total_weeks <> (select count(*) from public.training_weeks w where w.block_id = tb.id);
  if bad > 0 then raise exception 'a block does not have total_weeks weeks (% blocks)', bad; end if;

  select count(*) into bad
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and (extract(isodow from tw.starts_on) <> 1 or tw.ends_on <> tw.starts_on + 6);
  if bad > 0 then raise exception '% weeks are not Monday to Sunday', bad; end if;

  select count(*) into bad
    from public.planned_sessions ps
    join public.training_weeks tw on tw.id = ps.week_id
    join public.training_blocks tb on tb.id = tw.block_id
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active'
     and ps.scheduled_on not between tw.starts_on and tw.ends_on;
  if bad > 0 then raise exception '% sessions sit outside their week', bad; end if;

  -- The authored order survived the move. A stranded temporary position would
  -- mean the restore silently missed rows.
  select count(*) into bad
    from public.planned_sessions ps
    join public.athletes a on a.id = ps.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and ps.position > 100;
  if bad > 0 then raise exception '% sessions kept a temporary position', bad; end if;

  select count(*) into bad
    from public.training_blocks tb
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope', 'jose', 'marcus') and tb.status = 'active' and tb.race_on is not null
     and not exists (
       select 1 from public.training_weeks w
        where w.block_id = tb.id and w.week_number = tb.total_weeks
          and tb.race_on between w.starts_on and w.ends_on);
  if bad > 0 then raise exception 'race day is outside the final week (% blocks)', bad; end if;

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
