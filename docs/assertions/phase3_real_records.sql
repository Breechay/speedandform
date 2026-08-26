-- Phase 3 read-only assertions against real records.
-- Safe to run in the Supabase SQL editor. Reads only, except one mutation test
-- that is wrapped in an explicit transaction and rolled back.
-- Every row comes back as pass or FAIL with the number that decided it.

with
-- 1 · Monday week boundaries
w as (
  select tw.*, a.slug
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id and tb.status = 'active'
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope','jose','marcus')
),
a1 as (
  select 'week 1 starts Mon 24 Aug' as assertion,
         count(*) filter (where week_number = 1 and starts_on <> date '2026-08-24') as bad,
         count(*) filter (where week_number = 1) as checked from w
),
a2 as (
  select 'every week is Mon..Sun',
         count(*) filter (where extract(isodow from starts_on) <> 1 or ends_on <> starts_on + 6),
         count(*) from w
),
a3 as (
  select 'week count matches total_weeks',
         count(*) filter (where tb.total_weeks <> (select count(*) from public.training_weeks x where x.block_id = tb.id)),
         count(*)
    from public.training_blocks tb join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope','jose','marcus') and tb.status = 'active'
),
a4 as (
  select 'race day inside final week',
         count(*) filter (where not exists (
           select 1 from public.training_weeks x
            where x.block_id = tb.id and x.week_number = tb.total_weeks
              and tb.race_on between x.starts_on and x.ends_on)),
         count(*)
    from public.training_blocks tb join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope','jose','marcus') and tb.status = 'active' and tb.race_on is not null
),
a5 as (
  select 'every session inside its week',
         count(*) filter (where ps.scheduled_on not between w.starts_on and w.ends_on), count(*)
    from public.planned_sessions ps join w on w.id = ps.week_id
),
a6 as (
  select 'no session kept a temporary position',
         count(*) filter (where ps.position > 100), count(*)
    from public.planned_sessions ps join public.athletes a on a.id = ps.athlete_id
   where a.slug in ('hope','jose','marcus')
),
a7 as (
  select 'position and date agree in a week', count(*), count(*)
    from public.planned_sessions p1
    join public.planned_sessions p2 on p2.week_id = p1.week_id and p2.id <> p1.id
    join public.athletes a on a.id = p1.athlete_id
   where a.slug in ('hope','jose','marcus')
     and p1.position < p2.position and p1.scheduled_on > p2.scheduled_on
),
-- 2 · structured dose coverage
a8 as (
  select 'only Threshold/Speed lack a dose',
         count(*) filter (where v.title not in ('Threshold','Speed')
                            and not exists (select 1 from public.planned_session_components c where c.version_id = v.id)),
         count(*)
    from public.planned_session_versions v
    join public.planned_sessions ps on ps.id = v.planned_session_id
    join public.athletes a on a.id = ps.athlete_id
   where a.slug in ('hope','jose','marcus')
),
a9 as (
  select 'exactly one work component per version', count(*), count(*)
    from (select version_id from public.planned_session_components
           where role = 'work' group by version_id having count(*) <> 1) t
),
a10 as (
  select 'work total equals prescribed distance',
         count(*) filter (where c.distance * coalesce(c.repeat_count,1) <> v.prescribed_distance), count(*)
    from public.planned_session_components c
    join public.planned_session_versions v on v.id = c.version_id
   where c.role = 'work' and v.prescribed_distance is not null
),
a11 as (
  select 'every repetition set names its recovery',
         count(*) filter (where recovery_seconds is null and recovery_kind is null), count(*)
    from public.planned_session_components where shape = 'repetitions'
),
-- 3 · checkpoint provenance
a12 as (
  select 'every checkpoint has a source', count(*) filter (where source is null), count(*)
    from public.mark_checkpoints
),
a13 as (
  select 'automatic advances cite evidence',
         count(*) filter (where source = 'automatic' and evidence_completion_id is null), count(*)
    from public.mark_checkpoints
),
-- 4 · the movement ledger
a14 as (
  select 'idempotency index exists', case when count(*) = 1 then 0 else 1 end, count(*)
    from pg_indexes where schemaname='public' and indexname='checkpoint_movement_idempotent'
),
a15 as (
  select 'movement ledger is append only', case when count(*) = 1 then 0 else 1 end, count(*)
    from pg_trigger where tgname='mark_checkpoint_movements_immutable' and not tgisinternal
)
select assertion, bad, checked, case when bad = 0 then 'pass' else 'FAIL' end as result
from (
  select * from a1 union all select * from a2 union all select * from a3 union all
  select * from a4 union all select * from a5 union all select * from a6 union all
  select * from a7 union all select * from a8 union all select * from a9 union all
  select * from a10 union all select * from a11 union all select * from a12 union all
  select * from a13 union all select * from a14 union all select * from a15
) t(assertion, bad, checked)
order by result desc, assertion;

-- ── Marcus week 1, and his runway ───────────────────────────────────────────
select tw.week_number, tw.starts_on, tw.ends_on,
       string_agg(ps.day_label || ' ' || ps.scheduled_on::text || ' ' || v.title,
                  ' | ' order by ps.position) as sessions
  from public.training_weeks tw
  join public.training_blocks tb on tb.id = tw.block_id and tb.status='active'
  join public.athletes a on a.id = tb.athlete_id
  left join public.planned_sessions ps on ps.week_id = tw.id
  left join public.planned_session_versions v on v.planned_session_id = ps.id and v.version_number = 1
 where a.slug = 'marcus'
 group by tw.week_number, tw.starts_on, tw.ends_on
 order by tw.week_number;

-- ── Legacy provenance count ─────────────────────────────────────────────────
select a.slug, mc.source, count(*)
  from public.mark_checkpoints mc join public.athletes a on a.id = mc.athlete_id
 group by a.slug, mc.source order by a.slug, mc.source;

-- ── Jose: authored prescription, filings, and standing confidence ───────────
select ps.scheduled_on, ps.day_label, v.title, v.prescribed_distance,
       v.pace_low, v.pace_high, v.rpe_low, v.rpe_high, v.shape
  from public.planned_sessions ps
  join public.planned_session_versions v on v.planned_session_id = ps.id
  join public.athletes a on a.id = ps.athlete_id
 where a.slug = 'jose' and ps.scheduled_on <= date '2026-08-31'
 order by ps.scheduled_on;

select c.id, c.filed_at, c.status, c.actual_distance, c.duration_seconds,
       c.rpe, c.surface, c.planned_session_id
  from public.session_completions c join public.athletes a on a.id = c.athlete_id
 where a.slug = 'jose' order by c.filed_at;

select r.id, r.score, r.reason, r.next_evidence, r.created_at, r.supersedes
  from public.mark_standing_confidence r join public.athletes a on a.id = r.athlete_id
 where a.slug = 'jose';

-- ── Mutation test, rolled back. Proves the ledger rejects a replay. ─────────
-- Nothing below survives; the transaction is aborted deliberately.
begin;
  do $$
  declare cp record; comp uuid; first_ok boolean := false; second_blocked boolean := false;
  begin
    select mc.* into cp from public.mark_checkpoints mc
      join public.athletes a on a.id = mc.athlete_id
     where a.slug = 'jose' limit 1;
    select id into comp from public.session_completions sc
      join public.athletes a on a.id = sc.athlete_id where a.slug = 'jose' limit 1;
    if cp.id is null or comp is null then
      raise notice 'MUTATION TEST SKIPPED: no jose checkpoint or completion'; return;
    end if;

    insert into public.mark_checkpoint_movements
      (athlete_id, mark_id, checkpoint_id, source, decision, previous_state, resulting_state,
       evidence_completion_id, rule_id, rule_version, reason)
    values (cp.athlete_id, cp.mark_id, cp.id, 'automatic', 'advance', cp.state, 'reached',
            comp, 'test.rule', 'v0', 'rolled back idempotency probe');
    first_ok := true;

    begin
      insert into public.mark_checkpoint_movements
        (athlete_id, mark_id, checkpoint_id, source, decision, previous_state, resulting_state,
         evidence_completion_id, rule_id, rule_version, reason)
      values (cp.athlete_id, cp.mark_id, cp.id, 'automatic', 'advance', cp.state, 'reached',
              comp, 'test.rule', 'v0', 'replay of the same filing');
    exception when unique_violation then second_blocked := true;
    end;

    raise notice 'first insert accepted: %, replay blocked: %', first_ok, second_blocked;
    if not second_blocked then raise exception 'IDEMPOTENCY FAILED: a replay was accepted'; end if;
  end $$;
rollback;

-- Prove the rollback left nothing behind.
select count(*) as movements_after_rollback from public.mark_checkpoint_movements;
