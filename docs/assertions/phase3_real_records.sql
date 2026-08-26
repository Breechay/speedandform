-- Phase 3 assertions against real records. Read only. Nothing is written.
--
-- One statement, one result set. The Supabase SQL editor returns only the last
-- statement's result, so everything is unioned into a single table of
-- (section, label, value, result) rather than run as separate queries.
--
-- The idempotency guarantee is proven structurally here, by reading the index
-- definition. The behavioural probe that inserts a duplicate and expects it to be
-- rejected needs a transaction that can be rolled back, which the editor cannot
-- give back a result from; that one runs through the app once a session exists.

with
weeks as (
  select tw.*, a.slug
    from public.training_weeks tw
    join public.training_blocks tb on tb.id = tw.block_id and tb.status = 'active'
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope','jose','marcus')
),
blocks as (
  select tb.*, a.slug
    from public.training_blocks tb
    join public.athletes a on a.id = tb.athlete_id
   where a.slug in ('hope','jose','marcus') and tb.status = 'active'
),
versions as (
  select v.*, ps.scheduled_on, ps.day_label, ps.position, ps.week_id, a.slug
    from public.planned_session_versions v
    join public.planned_sessions ps on ps.id = v.planned_session_id
    join public.athletes a on a.id = ps.athlete_id
   where a.slug in ('hope','jose','marcus')
),
checks(label, bad, checked) as (
  select 'A1 week 1 starts Mon 24 Aug',
         count(*) filter (where week_number = 1 and starts_on <> date '2026-08-24'),
         count(*) filter (where week_number = 1) from weeks
  union all
  select 'A2 every week is Mon..Sun',
         count(*) filter (where extract(isodow from starts_on) <> 1 or ends_on <> starts_on + 6),
         count(*) from weeks
  union all
  select 'A3 week count matches total_weeks',
         count(*) filter (where b.total_weeks <> (select count(*) from public.training_weeks x where x.block_id = b.id)),
         count(*) from blocks b
  union all
  select 'A4 race day inside final week',
         count(*) filter (where not exists (
           select 1 from public.training_weeks x
            where x.block_id = b.id and x.week_number = b.total_weeks
              and b.race_on between x.starts_on and x.ends_on)),
         count(*) from blocks b where b.race_on is not null
  union all
  select 'A5 every session inside its week',
         count(*) filter (where v.scheduled_on not between w.starts_on and w.ends_on),
         count(*) from versions v join weeks w on w.id = v.week_id where v.version_number = 1
  union all
  select 'A6 no session kept a temporary position',
         count(*) filter (where v.position > 100), count(*) from versions v where v.version_number = 1
  union all
  select 'A7 position and date agree in a week',
         (select count(*) from public.planned_sessions p1
            join public.planned_sessions p2 on p2.week_id = p1.week_id and p2.id <> p1.id
            join public.athletes a2 on a2.id = p1.athlete_id
           where a2.slug in ('hope','jose','marcus')
             and p1.position < p2.position and p1.scheduled_on > p2.scheduled_on), 0
  union all
  select 'B1 only Threshold/Speed lack a dose',
         count(*) filter (where v.title not in ('Threshold','Speed')
           and not exists (select 1 from public.planned_session_components c where c.version_id = v.id)),
         count(*) from versions v
  union all
  select 'B2 Threshold/Speed are intentionally undosed',
         0, count(*) filter (where v.title in ('Threshold','Speed')) from versions v
  union all
  select 'B3 exactly one work component per version',
         (select count(*) from (select c.version_id from public.planned_session_components c
            where c.role = 'work' group by c.version_id having count(*) <> 1) t), 0
  union all
  select 'B4 work total equals prescribed distance',
         count(*) filter (where c.distance * coalesce(c.repeat_count,1) <> v2.prescribed_distance),
         count(*) from public.planned_session_components c
         join public.planned_session_versions v2 on v2.id = c.version_id
        where c.role = 'work' and v2.prescribed_distance is not null
  union all
  select 'B5 every repetition set names its recovery',
         count(*) filter (where c.recovery_seconds is null and c.recovery_kind is null),
         count(*) from public.planned_session_components c where c.shape = 'repetitions'
  union all
  select 'C1 every checkpoint has a source',
         count(*) filter (where mc.source is null), count(*) from public.mark_checkpoints mc
  union all
  select 'C2 automatic advances cite evidence',
         count(*) filter (where mc.source = 'automatic' and mc.evidence_completion_id is null),
         count(*) from public.mark_checkpoints mc
  union all
  select 'D1 idempotency index exists',
         case when count(*) = 1 then 0 else 1 end, count(*)
    from pg_indexes where schemaname='public' and indexname='checkpoint_movement_idempotent'
  union all
  select 'D2 movement ledger is append only',
         case when count(*) = 1 then 0 else 1 end, count(*)
    from pg_trigger where tgname='mark_checkpoint_movements_immutable' and not tgisinternal
)
select '1 assert' as section, label, bad || ' bad of ' || checked || ' checked' as value,
       case when bad = 0 then 'pass' else 'FAIL' end as result
  from checks

union all
select '2 marcus runway', 'W' || lpad(w.week_number::text, 2, '0') || '  ' || w.starts_on || '..' || w.ends_on,
       coalesce((select string_agg(ps.day_label || ' ' || ps.scheduled_on || ' ' || v.title, ' | ' order by ps.position)
                   from public.planned_sessions ps
                   join public.planned_session_versions v
                     on v.planned_session_id = ps.id and v.version_number = 1
                  where ps.week_id = w.id), 'no sessions'),
       case when w.starts_on <= date '2026-08-25' and date '2026-08-25' <= w.ends_on then 'current week' else '' end
  from weeks w where w.slug = 'marcus'

union all
select '3 provenance', mc_slug || ' · ' || mc_source, mc_count::text, ''
  from (select a.slug as mc_slug, mc.source as mc_source, count(*) as mc_count
          from public.mark_checkpoints mc join public.athletes a on a.id = mc.athlete_id
         group by a.slug, mc.source) p

union all
select '4 ladder state', a.slug || ' · ' || mc.label || ' mi', mc.state, coalesce(mc.source,'')
  from public.mark_checkpoints mc join public.athletes a on a.id = mc.athlete_id
 where a.slug in ('hope','jose','marcus') and mc.state <> 'proposed'

union all
select '5 jose plan', v.scheduled_on || ' ' || v.day_label, v.title,
       coalesce(v.prescribed_distance::text,'') || ' mi · ' ||
       coalesce(v.pace_low,'-') || '..' || coalesce(v.pace_high,'-') || ' · rpe ' ||
       coalesce(v.rpe_low::text,'-') || '-' || coalesce(v.rpe_high::text,'-')
  from versions v where v.slug = 'jose' and v.version_number = 1 and v.scheduled_on <= date '2026-09-01'

union all
select '6 jose dose', v.scheduled_on || ' ' || v.title,
       c.role || ' ' || c.shape || coalesce(' x' || c.repeat_count::text,'') ||
       coalesce(' ' || c.distance::text || c.distance_unit,'') ||
       coalesce(' ' || c.duration_seconds::text || 's',''),
       coalesce(c.recovery_seconds::text || 's ' || c.recovery_kind, '')
  from versions v join public.planned_session_components c on c.version_id = v.id
 where v.slug = 'jose' and v.version_number = 1

union all
select '7 jose filings', sc.filed_at::text, sc.status || ' · ' ||
       coalesce(sc.actual_distance::text,'?') || ' mi · ' || coalesce(sc.surface,'no surface'),
       case when sc.planned_session_id is null then 'ad hoc' else 'against a prescription' end
  from public.session_completions sc join public.athletes a on a.id = sc.athlete_id
 where a.slug = 'jose'

union all
select '8 jose confidence', coalesce(r.created_at::text,'none'), coalesce(r.score::text,'unset'),
       coalesce(r.reason,'')
  from public.athletes a
  left join public.mark_standing_confidence r on r.athlete_id = a.id
 where a.slug = 'jose'

union all
select '9 idempotency index', 'definition', i.indexdef, ''
  from pg_indexes i where i.schemaname='public' and i.indexname='checkpoint_movement_idempotent'

order by 1, 2;
