-- Speed marks prefer signed session pieces. Existing dated performance measurements
-- provide a database-backed fallback when no filed rep exists for a lane.
-- The same invoker-scoped RPC serves the athlete and the read-only Coach Mirror.

create or replace function public.speed_distance_key(p_metres numeric,p_unit text default null)
returns integer language sql immutable parallel safe set search_path = public, pg_temp as $$
  select key
    from unnest(array[100,200,300,400,600,800,1000,1609,3000,3219,
                      4828,5000,6437,10000,16093,21098,42195]) as candidates(key)
   where p_metres is not null and p_metres > 0
     and abs(p_metres - key) <= key * 0.01
     -- 1600m is not a mile, nor 3km a 2-mile effort. A road-unit mark
     -- needs mile provenance or a metre-exact equivalent.
     and (key not in (1609,3219,4828,6437,16093,21098,42195)
       or p_unit='mi' or abs(p_metres-key)<=1)
   order by abs(p_metres - key), key
   limit 1;
$$;

create or replace function public.athlete_speed_feed(p_athlete_id uuid)
returns jsonb language sql stable security invoker
set search_path = public, pg_temp as $$
with
  authorized as (
    select a.id, a.first_name from public.athletes a
    join public.athlete_training_tab_access access on access.athlete_id=a.id
     where a.id = p_athlete_id and public.can_read_athlete(a.id)
       and access.speed_enabled
  ),
  settings as (
    select coalesce(s.distance_keys, array[100,200,300,400,600,800,1000]) as keys
    from authorized a left join public.athlete_speed_settings s on s.athlete_id=a.id
  ),
  pieces as (
    select p.completion_id, p.position, c.filed_at, c.athlete_id,
           public.speed_distance_key(coalesce(
             d.distance_m::numeric,
             case p.distance_unit
               when 'm' then p.distance
               when 'km' then p.distance * 1000
               when 'mi' then p.distance * 1609.344
               else null
             end
           ),p.distance_unit) as distance_m,
           round(coalesce(p.duration_seconds_exact,p.duration_seconds::numeric) * 1000)::bigint as ms
      from authorized a
      join public.session_completions c on c.athlete_id=a.id
      join public.session_pieces p on p.completion_id=c.id and p.athlete_id=c.athlete_id
      left join public.speed_piece_distance_corrections d
        on d.piece_id=p.id and d.athlete_id=c.athlete_id
     where c.status in ('completed','partial','changed')
       and c.source in ('coach_import','form','athlete')
       and p.kind='rep'
       and coalesce(p.duration_seconds_exact,p.duration_seconds::numeric)>0
  ),
  accepted as (
    select * from pieces where distance_m is not null and ms is not null
  ),
  sequenced as (
    select r.*,
           count(*) over (partition by completion_id,distance_m) as n,
           lead(ms,1) over (partition by completion_id,distance_m order by position) as m2,
           lead(ms,2) over (partition by completion_id,distance_m order by position) as m3
      from accepted r
  ),
  held_windows as (
    select distance_m, completion_id, filed_at,
           case when n>=3 and m3 is not null
                  then floor((ms+m2+m3)::numeric/300 + 0.5)::bigint * 100
                when n=2 and m2 is not null
                  then floor((ms+m2)::numeric/200 + 0.5)::bigint * 100
                when n=1 then floor(ms::numeric/100 + 0.5)::bigint * 100
                else null end as held_ms,
           case when n>=3 then 3 when n=2 then 2 else 1 end as held_reps
      from sequenced
  ),
  held as (
    select distinct on (distance_m) distance_m, completion_id, filed_at, held_ms, held_reps
    from held_windows where held_ms is not null
    order by distance_m, held_ms asc, filed_at desc, completion_id
  ),
  best as (
    select distinct on (distance_m) distance_m, ms as best_ms,
           completion_id as best_completion_id
    from accepted
    order by distance_m, ms asc, filed_at desc, completion_id, position
  ),
  measurement_candidates as (
    select case m.measurement_type
             when 'reported_best_400m_seconds' then 400
             when 'reported_best_800m_seconds' then 800
             when 'observed_mean_800m_seconds' then 800
             when 'reported_best_1k_seconds' then 1000
             when 'reported_best_mile_seconds' then 1609
             when 'reported_best_2mile_seconds' then 3219
             when 'reported_best_5k_seconds' then 5000
             when 'reported_best_10k_seconds' then 10000
             when 'reported_best_10mile_seconds' then 16093
             when 'reported_best_half_seconds' then 21098
             when 'reported_best_marathon_seconds' then 42195
           end as distance_m,
           round(m.value * 1000)::bigint as best_ms,
           m.measured_at,
           m.source,
           case when m.measurement_type like 'reported_best_%' then 1 else 2 end as priority
      from authorized a
      join public.athlete_measurements m on m.athlete_id=a.id
     where m.value > 0
       and lower(m.unit) in ('s','sec','secs','second','seconds')
       and m.measurement_type in (
         'reported_best_400m_seconds','reported_best_800m_seconds',
         'observed_mean_800m_seconds','reported_best_1k_seconds',
         'reported_best_mile_seconds','reported_best_2mile_seconds',
         'reported_best_5k_seconds','reported_best_10k_seconds',
         'reported_best_10mile_seconds','reported_best_half_seconds',
         'reported_best_marathon_seconds'
       )
  ),
  measurement_best as (
    select distinct on (distance_m) distance_m,best_ms,measured_at,source
      from measurement_candidates
     where distance_m is not null
     order by distance_m,priority,best_ms,measured_at desc
  ),
  keys as (
    select k.key, k.ord from settings s,
         unnest(s.keys) with ordinality as k(key,ord)
  ),
  marks as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'distanceMeters',k.key,'heldMs',h.held_ms,'heldReps',h.held_reps,
      'bestMs',coalesce(b.best_ms,m.best_ms),'completionId',h.completion_id,
      'bestCompletionId',b.best_completion_id,'filedAt',h.filed_at
      ,'bestEvidence',case when b.best_ms is not null then 'filed_rep'
                           when m.best_ms is not null then 'dated_measurement' end
      ,'bestMeasuredAt',case when b.best_ms is null then m.measured_at end
      ,'bestSource',case when b.best_ms is null then m.source end
    ) order by k.ord),'[]'::jsonb) as value
    from keys k left join held h on h.distance_m=k.key
                left join best b on b.distance_m=k.key
                left join measurement_best m on m.distance_m=k.key
  ),
  next_plan as (
    select jsonb_build_object(
      'plannedSessionId',p.id,'plannedVersionId',v.id,
      'vaultVersionId',coalesce(v.vault_session_version_id,vl.vault_version_id),
      'date',p.scheduled_on,'title',v.title,
      'segments',coalesce((
        select jsonb_agg(jsonb_build_object(
          'distanceMeters', case component.distance_unit
            when 'm' then round(component.distance)::integer
            when 'km' then round(component.distance*1000)::integer
            when 'mi' then round(component.distance*1609.344)::integer
            else null end,
          'reps',coalesce(component.repeat_target,component.repeat_count,1),
          'durationSeconds',component.duration_seconds,
          'recoverySeconds',component.recovery_seconds,
          'paceLowSeconds',component.pace_low_seconds,
          'paceHighSeconds',component.pace_high_seconds
        ) order by component.position),'[]'::jsonb)
        from public.planned_session_components component
        where component.version_id=v.id and component.role='work'
      ),'[]'::jsonb),
      'distances',coalesce((
        select jsonb_agg(distinct public.speed_distance_key(
          case component.distance_unit
            when 'm' then component.distance
            when 'km' then component.distance*1000
            when 'mi' then component.distance*1609.344
            else null end
        ,component.distance_unit)) filter (where component.distance is not null)
        from public.planned_session_components component
        where component.version_id=v.id and component.role='work'
      ),'[]'::jsonb)
    ) as value
    from authorized a
    join public.planned_sessions p on p.athlete_id=a.id
      and p.state='published'
      and p.role='key'
      and p.scheduled_on >= (now() at time zone 'America/New_York')::date
      and not exists (
        select 1 from public.session_completions done
        where done.planned_session_id=p.id and done.athlete_id=p.athlete_id
          and done.status in ('completed','partial','changed')
      )
    join lateral (
      select v.id,v.title,v.vault_session_version_id
      from public.planned_session_versions v
      where v.planned_session_id=p.id and v.athlete_id=p.athlete_id
      order by v.version_number desc,v.id desc limit 1
    ) v on true
    left join public.speed_plan_vault_links vl
      on vl.plan_version_id=v.id and vl.athlete_id=p.athlete_id
    order by p.scheduled_on,p.position,p.id limit 1
  ),
  next_shared as (
    select jsonb_build_object(
      'runId',r.id,'date',(r.starts_at at time zone 'America/New_York')::date,
      'startsAt',r.starts_at,'title',r.title
    ) as value from authorized a, public.collective_public_runs r
    where r.starts_at>=now() and r.status not in ('cancelled','withdrawn')
      and r.kind in ('track','long_run','long-run','speed','group')
    order by r.starts_at,r.id limit 1
  ),
  season_rows as (
    select c.id,c.athlete_id,c.filed_at,c.actual_distance,c.distance_unit,
           c.duration_seconds,c.planned_session_version_id,
           pin.position,pin.is_peak,pin.block_id
      from authorized a
      join public.athlete_season_pins pin on pin.athlete_id=a.id
      join public.session_completions c on c.id=pin.completion_id and c.athlete_id=a.id
    union all
    select recent.id,recent.athlete_id,recent.filed_at,recent.actual_distance,
           recent.distance_unit,recent.duration_seconds,recent.planned_session_version_id,
           recent.position,false,null::uuid
      from (
        select c.id,c.athlete_id,c.filed_at,c.actual_distance,c.distance_unit,
               c.duration_seconds,c.planned_session_version_id,
               row_number() over (order by c.filed_at,c.id)::integer as position
          from authorized a
          join public.session_completions c on c.athlete_id=a.id
         where c.status in ('completed','partial','changed')
           and exists (select 1 from public.session_pieces p
                        where p.completion_id=c.id and p.athlete_id=c.athlete_id
                          and p.kind='rep')
           and not exists (select 1 from public.athlete_season_pins pin
                            where pin.athlete_id=a.id)
         order by c.filed_at desc,c.id desc
         limit 12
      ) recent
  ),
  season as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'completionId',c.id,'date',c.filed_at::date,'title',v.title,
      'position',c.position,'isPeak',c.is_peak,'blockId',c.block_id,
      'distance',c.actual_distance,'distanceUnit',c.distance_unit,
      'durationSeconds',c.duration_seconds,
      'segments',coalesce((
        select jsonb_agg(jsonb_build_object(
          'distanceMeters',round(coalesce(correction.distance_m,
            case piece.distance_unit
              when 'm' then piece.distance
              when 'km' then piece.distance*1000
              when 'mi' then piece.distance*1609.344
              else null end
          ))::integer,
          'durationMs',round(coalesce(piece.duration_seconds_exact,
                                      piece.duration_seconds::numeric)*1000)::bigint
        ) order by piece.position),'[]'::jsonb)
        from public.session_pieces piece
        left join public.speed_piece_distance_corrections correction
          on correction.piece_id=piece.id and correction.athlete_id=c.athlete_id
        where piece.completion_id=c.id and piece.athlete_id=c.athlete_id and piece.kind='rep'
      ),'[]'::jsonb)
    ) order by c.position),'[]'::jsonb) as value
    from season_rows c
    left join public.planned_session_versions v on v.id=c.planned_session_version_id
  ),
  vault as (
    select coalesce(jsonb_agg(jsonb_build_object(
      'id',s.id,'title',s.title,'family',s.family,
      'versionId',v.id,'version',v.version_number,'blocks',v.blocks,
      'lastResult',(
        select public.vault_attempt_score(c.id)
        from public.session_completions c
        join authorized a on c.athlete_id=a.id
        left join public.speed_completion_vault_links cl
          on cl.completion_id=c.id and cl.athlete_id=c.athlete_id
        left join public.planned_session_versions pv on pv.id=c.planned_session_version_id
        left join public.speed_plan_vault_links pl
          on pl.plan_version_id=pv.id and pl.athlete_id=c.athlete_id
        where coalesce(c.vault_session_version_id,cl.vault_version_id,
                       pv.vault_session_version_id,pl.vault_version_id)=v.id
          and c.status in ('completed','partial','changed')
        order by c.filed_at desc,c.id desc limit 1
      ),
      'attempts',(
        select count(*) from public.session_completions c
        join authorized a on c.athlete_id=a.id
        left join public.speed_completion_vault_links cl
          on cl.completion_id=c.id and cl.athlete_id=c.athlete_id
        left join public.planned_session_versions pv on pv.id=c.planned_session_version_id
        left join public.speed_plan_vault_links pl
          on pl.plan_version_id=pv.id and pl.athlete_id=c.athlete_id
        where coalesce(c.vault_session_version_id,cl.vault_version_id,
                       pv.vault_session_version_id,pl.vault_version_id)=v.id
          and c.status in ('completed','partial','changed')
      ),
      'history',(
        select coalesce(jsonb_agg(public.vault_attempt_score(recent.id)
                                  order by recent.filed_at desc,recent.id desc),'[]'::jsonb)
        from (
          select c.id,c.filed_at
          from public.session_completions c
          join authorized a on c.athlete_id=a.id
          left join public.speed_completion_vault_links cl
            on cl.completion_id=c.id and cl.athlete_id=c.athlete_id
          left join public.planned_session_versions pv on pv.id=c.planned_session_version_id
          left join public.speed_plan_vault_links pl
            on pl.plan_version_id=pv.id and pl.athlete_id=c.athlete_id
          where coalesce(c.vault_session_version_id,cl.vault_version_id,
                         pv.vault_session_version_id,pl.vault_version_id)=v.id
            and c.status in ('completed','partial','changed')
          order by c.filed_at desc,c.id desc
          limit 50
        ) recent
      )
    ) order by s.authored_order),'[]'::jsonb) as value
    from public.vault_sessions s
    join lateral (
      select v.id,v.version_number,v.blocks from public.vault_session_versions v
      where v.session_id=s.id order by v.version_number desc limit 1
    ) v on true
    where s.published and exists(select 1 from authorized)
  )
select jsonb_build_object(
  'athleteId',a.id,'firstName',a.first_name,
  'keys',(select to_jsonb(keys) from settings),
  'marks',(select value from marks),
  'next',coalesce((select value from next_plan),(select value from next_shared)),
  'season',(select value from season),
  'vault',(select value from vault)
)
from authorized a;
$$;

revoke all on function public.speed_distance_key(numeric,text) from public,anon;
revoke all on function public.athlete_speed_feed(uuid) from public,anon;
grant execute on function public.speed_distance_key(numeric,text) to authenticated;
grant execute on function public.athlete_speed_feed(uuid) to authenticated;

comment on function public.athlete_speed_feed(uuid) is
  'One RLS-scoped Speed feed for athlete and Coach Mirror. Filed reps are canonical; dated performance measurements are a truthful best-only fallback.';
