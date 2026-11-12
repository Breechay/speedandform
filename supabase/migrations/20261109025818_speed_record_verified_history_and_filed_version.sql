-- Review-only additive successor to the already-applied season-speedwork RPC.
-- Makes verified September key-session completions visible for race-specific
-- athletes and displays a filed result from an older immutable plan version
-- only when its work-segment geometry exactly matches the currently published
-- version. Keep the filed version identity; never re-file or alter results.
-- Does not change privileges, training plans, Field v2, or Speed entitlement.

CREATE OR REPLACE FUNCTION public.athlete_speed_record_v1(p_athlete_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SET search_path TO 'public', 'pg_temp'
AS $function$
with
authorized as (
  select a.id,a.first_name,access.speed_enabled
  from public.athletes a
  join public.athlete_training_tab_access access on access.athlete_id=a.id
  where a.id=p_athlete_id and access.speed_enabled and public.can_read_athlete(a.id)
),
active_block as (
  select b.* from public.training_blocks b join authorized a on a.id=b.athlete_id
  where b.status='active' order by b.starts_on desc nulls last,b.created_at desc,b.id limit 1
),
-- Thursday speedwork begins with the verified 5 November published session.
-- Race-specific athletes retain their individually authored key workouts.
thursday_cohort as (
  select 1 as member
  from active_block block
  join public.training_weeks w on w.block_id=block.id and w.athlete_id=block.athlete_id
  join public.planned_sessions p on p.week_id=w.id and p.athlete_id=block.athlete_id
  where p.state='published' and p.role='key'
    and p.scheduled_on=date '2026-11-05'
    and exists (
      select 1 from public.planned_session_versions v
      join public.planned_session_components work on work.version_id=v.id and work.role='work'
      where v.planned_session_id=p.id and v.athlete_id=p.athlete_id
    )
  limit 1
),
benchmarks as (
  select mark.* from public.athlete_speed_record_benchmarks mark
  join active_block block on block.id=mark.block_id and block.athlete_id=mark.athlete_id
  where mark.enabled
),
linked as (
  select link.*,mark.identity_key,mark.display_shape,mark.position as benchmark_position
  from public.athlete_speed_record_versions link
  join benchmarks mark on mark.id=link.benchmark_id and mark.athlete_id=link.athlete_id
),
valid_attempts as (
  select distinct c.id,c.athlete_id,c.planned_session_id,c.planned_session_version_id,c.filed_at,
    coalesce(session.scheduled_on,c.filed_at::date) as performed_on,link.benchmark_id
  from linked link
  join public.session_completions c
    on c.athlete_id=link.athlete_id
   and c.planned_session_id=link.planned_session_id
   and c.planned_session_version_id=link.planned_session_version_id
   and c.status in ('completed','partial','changed')
  join public.planned_sessions session on session.id=c.planned_session_id
),
piece_evidence as (
  select attempt.benchmark_id,attempt.id as completion_id,p.id as piece_id,p.position,p.pace_seconds as filed_pace_seconds,
    coalesce(p.duration_seconds_exact,p.duration_seconds::numeric) as duration_seconds,
    coalesce(correction.distance_m::numeric,case p.distance_unit
      when 'm' then p.distance
      when 'km' then p.distance*1000
      when 'mi' then p.distance*1609.344
      else null end) as distance_m,
    case when correction.distance_m > 0 then 'signed_correction'
      when p.distance > 0 and p.distance_unit in ('m','km','mi') then 'filed'
      else 'unknown' end as distance_source
  from valid_attempts attempt
  join public.session_pieces p on p.completion_id=attempt.id and p.athlete_id=attempt.athlete_id
  left join public.speed_piece_distance_corrections correction
    on correction.piece_id=p.id and correction.athlete_id=p.athlete_id
  where p.kind='rep'
),
attempt_metrics as (
  select attempt.benchmark_id,attempt.id as completion_id,attempt.performed_on,attempt.filed_at,
    case when count(piece.piece_id)>0
       and count(piece.piece_id)=count(*) filter(where piece.duration_seconds>0 and piece.distance_m>0)
      then round(sum(piece.duration_seconds)/sum(piece.distance_m)*1609.344)::integer end
      as avg_work_pace_seconds_per_mile,
    case when count(piece.piece_id)=0 then 'missing'
         when count(piece.piece_id)=count(*) filter(where piece.duration_seconds>0 and piece.distance_m>0)
           then 'complete'
         else 'partial' end as piece_evidence_quality
  from valid_attempts attempt
  left join piece_evidence piece on piece.completion_id=attempt.id
  group by attempt.benchmark_id,attempt.id,attempt.performed_on,attempt.filed_at
),
latest_attempt as (
  select distinct on (metric.benchmark_id) metric.*
  from attempt_metrics metric
  order by metric.benchmark_id,metric.performed_on desc,metric.filed_at desc,metric.completion_id
),
latest_piece_rows as (
  select latest.completion_id,coalesce(jsonb_agg(jsonb_build_object(
    'position',piece.position,
    'distanceMeters',case when piece.distance_m>0 then round(piece.distance_m)::integer end,
    'durationMs',case when piece.duration_seconds>0 then round(piece.duration_seconds*1000)::bigint end,
    'paceSecondsPerMile',case when piece.distance_m>0 and piece.duration_seconds>0
      then case when piece.filed_pace_seconds>0
        and abs(piece.filed_pace_seconds-round(piece.duration_seconds/piece.distance_m*1609.344))<=2
        then piece.filed_pace_seconds
        else round(piece.duration_seconds/piece.distance_m*1609.344)::integer end end,
    'distanceSource',piece.distance_source
  ) order by piece.position) filter(where piece.piece_id is not null),'[]'::jsonb) as value
  from latest_attempt latest
  left join piece_evidence piece on piece.completion_id=latest.completion_id
  group by latest.completion_id
),
split_candidates as (
  select piece.*,count(*) over(partition by piece.completion_id,round(piece.distance_m)) as distance_count,
    row_number() over(partition by piece.completion_id,round(piece.distance_m) order by piece.position) as distance_order
  from piece_evidence piece join latest_attempt latest on latest.completion_id=piece.completion_id
  where piece.duration_seconds>0 and piece.distance_m>0
),
split_distance as (
  select distinct on (completion_id) completion_id,round(distance_m)::integer as distance_m
  from split_candidates where distance_count>=2
  order by completion_id,round(distance_m) desc
),
split_pairs as (
  select candidate.completion_id,jsonb_agg(jsonb_build_object(
    'distanceMeters',round(candidate.distance_m)::integer,
    'durationMs',round(candidate.duration_seconds*1000)::bigint
  ) order by candidate.position) filter(where candidate.distance_order<=2) as value
  from split_candidates candidate
  join split_distance chosen on chosen.completion_id=candidate.completion_id
    and chosen.distance_m=round(candidate.distance_m)::integer
  group by candidate.completion_id
),
attempt_counts as (
  select benchmark_id,count(distinct id)::integer as value from valid_attempts group by benchmark_id
),
authored_segments as (
  select mark.id as benchmark_id,coalesce(jsonb_agg(jsonb_build_object(
    'position',component.position,
    'reps',coalesce(component.repeat_target,component.repeat_count,1),
    'distanceMeters',case component.distance_unit
      when 'm' then round(component.distance)::integer
      when 'km' then round(component.distance*1000)::integer
      when 'mi' then round(component.distance*1609.344)::integer end,
    'durationSeconds',component.duration_seconds,
    'recoverySeconds',component.recovery_seconds
  ) order by version.version_number desc,component.position)
    filter(where version.version_rank=1),'[]'::jsonb) as value
  from benchmarks mark
  left join lateral (
    select link.planned_session_version_id,pv.version_number,
      row_number() over(order by pv.version_number desc,link.linked_at desc,link.planned_session_version_id) as version_rank
    from linked link join public.planned_session_versions pv on pv.id=link.planned_session_version_id
    where link.benchmark_id=mark.id
  ) version on true
  left join public.planned_session_components component
    on component.version_id=version.planned_session_version_id and component.role='work'
  group by mark.id
),
benchmark_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',mark.id,'order',mark.position,'sessionIdentity',mark.identity_key,
    'displayShape',mark.display_shape,'segments',segments.value,
    'completedAttemptCount',coalesce(counts.value,0),
    'latestCompletedAttempt',case when latest.completion_id is null then null else jsonb_build_object(
      'completionId',latest.completion_id,'performedOn',latest.performed_on,
      'avgWorkPaceSecondsPerMile',latest.avg_work_pace_seconds_per_mile,
      'displaySplitPair',splits.value,'pieceEvidenceQuality',latest.piece_evidence_quality,
      'repPieces',piece_rows.value
    ) end
  ) order by mark.position),'[]'::jsonb) as value
  from benchmarks mark
  left join attempt_counts counts on counts.benchmark_id=mark.id
  left join latest_attempt latest on latest.benchmark_id=mark.id
  left join split_pairs splits on splits.completion_id=latest.completion_id
  left join latest_piece_rows piece_rows on piece_rows.completion_id=latest.completion_id
  left join authored_segments segments on segments.benchmark_id=mark.id
),
season_plan as (
  select p.id,p.athlete_id,p.scheduled_on,p.position,v.id as version_id,v.title,
    row_number() over(order by p.scheduled_on,p.position,p.id)::integer as sequence
  from active_block block
  join public.training_weeks w on w.block_id=block.id and w.athlete_id=block.athlete_id
  join public.planned_sessions p on p.week_id=w.id and p.athlete_id=block.athlete_id
  join lateral (
    select pv.* from public.planned_session_versions pv
    where pv.planned_session_id=p.id and pv.athlete_id=p.athlete_id
    order by pv.version_number desc,pv.created_at desc,pv.id desc limit 1
  ) v on true
  where p.state='published' and p.role='key'
    and exists (
      select 1 from public.planned_session_components work
      where work.version_id=v.id and work.role='work'
    )
    and (
      (exists (select 1 from thursday_cohort)
       and p.scheduled_on >= date '2026-11-05'
       and extract(isodow from p.scheduled_on)=4)
      or (not exists (select 1 from thursday_cohort)
       and (
         p.scheduled_on >= date '2026-10-01'
         or (p.scheduled_on >= date '2026-09-01' and exists (
           select 1 from public.session_completions historic
           where historic.athlete_id=p.athlete_id
             and historic.planned_session_id=p.id
             and historic.planned_session_version_id=v.id
             and historic.status in ('completed','partial','changed')
         ))
       ))
    )
    and (
      coalesce(v.title,'') !~* '(long run|marathon|aerobic run|easy[[:space:]]*\+[[:space:]]*strides|(^|[^a-z])easy([^a-z]|$)|race$)'
      or coalesce(v.title,'') ~* '(goal pace|race pace|fast finish|steady finish|last [0-9]+|build to [0-9]+)'
    )
    and coalesce(v.title,'') !~* '(Half Marathon$|Marathon · sub-|calibration race$)'
),
-- Work geometry is pinned independently of target pace text. This permits
-- Megan's Nov 5 v3 filed Ladder to show beneath the v5 plan (same six
-- distances/recoveries), while Sohel's changed 200m→100m stays separated.
-- Including both immutable version IDs makes provenance auditable.
season_compatible_versions as (
  select plan.id as planned_session_id,candidate.id as version_id
  from season_plan plan
  join public.planned_session_versions candidate
    on candidate.planned_session_id=plan.id
   and candidate.athlete_id=plan.athlete_id
   and candidate.title is not distinct from plan.title
  where coalesce((
      select jsonb_agg(jsonb_build_object(
        'position',work.position,
        'reps',coalesce(work.repeat_target,work.repeat_count,1),
        'distanceMeters',case work.distance_unit
          when 'm' then round(work.distance)::integer
          when 'km' then round(work.distance*1000)::integer
          when 'mi' then round(work.distance*1609.344)::integer end,
        'durationSeconds',work.duration_seconds,
        'recoverySeconds',work.recovery_seconds
      ) order by work.position)
      from public.planned_session_components work
      where work.version_id=candidate.id and work.role='work'
    ),'[]'::jsonb) = coalesce((
      select jsonb_agg(jsonb_build_object(
        'position',work.position,
        'reps',coalesce(work.repeat_target,work.repeat_count,1),
        'distanceMeters',case work.distance_unit
          when 'm' then round(work.distance)::integer
          when 'km' then round(work.distance*1000)::integer
          when 'mi' then round(work.distance*1609.344)::integer end,
        'durationSeconds',work.duration_seconds,
        'recoverySeconds',work.recovery_seconds
      ) order by work.position)
      from public.planned_session_components work
      where work.version_id=plan.version_id and work.role='work'
    ),'[]'::jsonb)
),
season_rows as (
  select plan.*,coalesce(segments.value,'[]'::jsonb) as segments,
    coalesce(attempts.attempt_count,0) as attempt_count,
    filed.id as completion_id, filed.planned_session_version_id as filed_version_id,
    coalesce(filed.filed_at::date,plan.scheduled_on) as performed_on,
    coalesce(metrics.reps,'[]'::jsonb) as rep_pieces,
    case when coalesce(metrics.rep_count,0)=0 then 'missing'
         when metrics.rep_count=metrics.valid_count then 'complete'
         else 'partial' end as piece_quality,
    case when metrics.rep_count>0 and metrics.rep_count=metrics.valid_count
      then round(metrics.total_seconds/metrics.total_distance_m*1609.344)::integer end
      as avg_pace_seconds_per_mile,
    pace.low_seconds as low_seconds,pace.high_seconds as high_seconds
  from season_plan plan
  left join lateral (
    select coalesce(jsonb_agg(jsonb_build_object(
      'position',work.position,
      'reps',coalesce(work.repeat_target,work.repeat_count,1),
      'distanceMeters',case work.distance_unit
        when 'm' then round(work.distance)::integer
        when 'km' then round(work.distance*1000)::integer
        when 'mi' then round(work.distance*1609.344)::integer end,
      'durationSeconds',work.duration_seconds,
      'recoverySeconds',work.recovery_seconds
    ) order by work.position),'[]'::jsonb) as value
    from public.planned_session_components work
    where work.version_id=plan.version_id and work.role='work'
  ) segments on true
  left join lateral (
    select count(*)::integer as attempt_count
    from public.session_completions completion
    where completion.planned_session_id=plan.id
      and completion.athlete_id=plan.athlete_id
      and exists (
        select 1 from season_compatible_versions compatible
        where compatible.planned_session_id=plan.id
          and compatible.version_id=completion.planned_session_version_id
      )
      and completion.status in ('completed','partial','changed')
  ) attempts on true
  left join lateral (
    select completion.* from public.session_completions completion
    where completion.planned_session_id=plan.id
      and completion.athlete_id=plan.athlete_id
      and exists (
        select 1 from season_compatible_versions compatible
        where compatible.planned_session_id=plan.id
          and compatible.version_id=completion.planned_session_version_id
      )
      and completion.status in ('completed','partial','changed')
    order by completion.filed_at desc nulls last,completion.updated_at desc,completion.id desc
    limit 1
  ) filed on true
  left join lateral (
    select count(*)::integer as rep_count,
      count(*) filter(where rep.duration_seconds>0 and rep.distance_m>0)::integer as valid_count,
      sum(rep.duration_seconds) as total_seconds,
      sum(rep.distance_m) as total_distance_m,
      coalesce(jsonb_agg(jsonb_build_object(
        'position',rep.position,
        'distanceMeters',case when rep.distance_m>0 then round(rep.distance_m)::integer end,
        'durationMs',case when rep.duration_seconds>0 then round(rep.duration_seconds*1000)::bigint end,
        'paceSecondsPerMile',case when rep.distance_m>0 and rep.duration_seconds>0
          then case when rep.filed_pace_seconds>0 and
            abs(rep.filed_pace_seconds-round(rep.duration_seconds/rep.distance_m*1609.344))<=2
            then rep.filed_pace_seconds
            else round(rep.duration_seconds/rep.distance_m*1609.344)::integer end end,
        'distanceSource',rep.distance_source
      ) order by rep.position) filter(where rep.id is not null),'[]'::jsonb) as reps
    from (
      select sp.id,sp.position,sp.pace_seconds as filed_pace_seconds,
        coalesce(sp.duration_seconds_exact,sp.duration_seconds::numeric) as duration_seconds,
        coalesce(correction.distance_m::numeric,case sp.distance_unit
          when 'm' then sp.distance
          when 'km' then sp.distance*1000
          when 'mi' then sp.distance*1609.344 end) as distance_m,
        case when correction.distance_m>0 then 'signed_correction'
          when sp.distance>0 and sp.distance_unit in ('m','km','mi') then 'filed'
          else 'unknown' end as distance_source
      from public.session_pieces sp
      left join public.speed_piece_distance_corrections correction
        on correction.piece_id=sp.id and correction.athlete_id=sp.athlete_id
      where sp.completion_id=filed.id and sp.athlete_id=plan.athlete_id and sp.kind='rep'
    ) rep
  ) metrics on true
  left join lateral (
    select min(work.pace_low_seconds) as low_seconds,max(work.pace_high_seconds) as high_seconds
    from public.planned_session_components work
    where work.version_id=plan.version_id and work.role='work'
  ) pace on true
),
season_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',row.id,'order',row.sequence,
    'date',row.scheduled_on,
    'sessionIdentity',case
      when row.title ~* '1000 / 600 / 400' then 'ladder_1k_600_400_x2'
      when row.title='5K Pyramid' then 'pyramid_400_800_1200'
      when row.title='The Switch' then 'the_switch'
      else 'season_' || row.id::text end,
    'displayShape',row.title,
    'segments',row.segments,
    'completedAttemptCount',row.attempt_count,
    'latestCompletedAttempt',case when row.completion_id is null then null else jsonb_build_object(
      'completionId',row.completion_id,'performedOn',row.performed_on,
      'filedVersionId',row.filed_version_id,
      'publishedVersionId',row.version_id,
      'avgWorkPaceSecondsPerMile',row.avg_pace_seconds_per_mile,
      'displaySplitPair',null,'pieceEvidenceQuality',row.piece_quality,
      'repPieces',row.rep_pieces
    ) end
  ) order by row.sequence),'[]'::jsonb) as value
  from season_rows row
),
upcoming_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'plannedSessionId',row.id,'versionId',row.version_id,'date',row.scheduled_on,
    'benchmarkId',row.id,'displayShape',row.title,
    'targetPace',case when row.low_seconds is null and row.high_seconds is null then null
      else jsonb_build_object('lowSeconds',row.low_seconds,'highSeconds',row.high_seconds,'unit','mi') end
  ) order by row.scheduled_on,row.position,row.id),'[]'::jsonb) as value
  from season_rows row
  where row.scheduled_on >= (now() at time zone 'America/New_York')::date
    and row.completion_id is null
)

select jsonb_build_object(
  'contractVersion',1,
  'athleteId',athlete.id,
  'firstName',athlete.first_name,
  'displayPaceUnit',coalesce((
    select settings.speed_record_pace_unit
    from public.athlete_speed_settings settings
    where settings.athlete_id=athlete.id
  ),'mi'),
  'recordBlock',case when block.id is null then null else jsonb_build_object(
    'id',block.id,'startsOn',block.starts_on,'endsOn',block.ends_on,'status',block.status,'name',block.name,'targetEvent',block.target_event,'raceName',block.race_name) end,
  'benchmarks',coalesce((select value from benchmark_json),'[]'::jsonb),
  'seasonSessions',coalesce((select value from season_json),'[]'::jsonb),
  'upcoming',coalesce((select value from upcoming_json),'[]'::jsonb)
)
from authorized athlete left join active_block block on block.athlete_id=athlete.id;
$function$

-- Access and data identity remain governed by can_read_athlete and the
-- existing training-tab access gate in athlete_speed_record_v1.
