-- Speed Record v1 is an explicitly curated, athlete-owned projection of
-- published work. It does not infer benchmark identity from titles, generic
-- distance keys, is_key, or the global Vault catalogue.

create table public.athlete_speed_record_benchmarks (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  block_id uuid not null references public.training_blocks(id) on delete cascade,
  identity_key text not null check (identity_key = lower(identity_key)
    and identity_key ~ '^[a-z0-9][a-z0-9_-]{1,79}$'),
  display_shape text not null check (length(btrim(display_shape)) between 1 and 48),
  position smallint not null check (position > 0),
  enabled boolean not null default true,
  created_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  created_at timestamptz not null default now(),
  unique (athlete_id, block_id, identity_key),
  unique (athlete_id, block_id, position)
);

create table public.athlete_speed_record_versions (
  benchmark_id uuid not null references public.athlete_speed_record_benchmarks(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  planned_session_id uuid not null references public.planned_sessions(id) on delete restrict,
  planned_session_version_id uuid not null references public.planned_session_versions(id) on delete restrict,
  linked_by uuid not null references auth.users(id) on delete restrict default auth.uid(),
  linked_at timestamptz not null default now(),
  primary key (benchmark_id, planned_session_version_id),
  unique (athlete_id, planned_session_version_id)
);

create index athlete_speed_record_benchmarks_block_idx
  on public.athlete_speed_record_benchmarks(athlete_id,block_id,position)
  where enabled;
create index athlete_speed_record_versions_session_idx
  on public.athlete_speed_record_versions(athlete_id,planned_session_id,planned_session_version_id);

alter table public.athlete_speed_record_benchmarks enable row level security;
alter table public.athlete_speed_record_versions enable row level security;

revoke all on public.athlete_speed_record_benchmarks from public,anon;
revoke all on public.athlete_speed_record_versions from public,anon;
grant select,insert,update,delete on public.athlete_speed_record_benchmarks to authenticated;
grant select,insert,delete on public.athlete_speed_record_versions to authenticated;

create policy speed_record_benchmarks_member_read
  on public.athlete_speed_record_benchmarks for select to authenticated
  using (public.can_read_athlete(athlete_id));
create policy speed_record_benchmarks_coach_insert
  on public.athlete_speed_record_benchmarks for insert to authenticated
  with check (public.is_coach_member(athlete_id) and created_by=auth.uid());
create policy speed_record_benchmarks_coach_update
  on public.athlete_speed_record_benchmarks for update to authenticated
  using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));
create policy speed_record_benchmarks_coach_delete
  on public.athlete_speed_record_benchmarks for delete to authenticated
  using (public.is_coach_member(athlete_id));

create policy speed_record_versions_member_read
  on public.athlete_speed_record_versions for select to authenticated
  using (public.can_read_athlete(athlete_id));
create policy speed_record_versions_coach_insert
  on public.athlete_speed_record_versions for insert to authenticated
  with check (public.is_coach_member(athlete_id) and linked_by=auth.uid());
create policy speed_record_versions_coach_delete
  on public.athlete_speed_record_versions for delete to authenticated
  using (public.is_coach_member(athlete_id));

create or replace function public.protect_speed_record_identity()
returns trigger language plpgsql set search_path=public,pg_temp as $function$
declare benchmark record; block_owner uuid; session_owner uuid; version_session uuid; version_owner uuid;
begin
  if tg_table_name='athlete_speed_record_benchmarks' then
    select athlete_id into block_owner from public.training_blocks where id=new.block_id;
    if block_owner is distinct from new.athlete_id then
      raise exception 'Speed benchmark block belongs to a different athlete';
    end if;
    if tg_op='UPDATE' and (new.athlete_id<>old.athlete_id or new.block_id<>old.block_id
       or new.identity_key<>old.identity_key) then
      raise exception 'Speed benchmark identity is immutable';
    end if;
    return new;
  end if;

  select athlete_id,block_id into benchmark
    from public.athlete_speed_record_benchmarks where id=new.benchmark_id;
  select athlete_id into session_owner from public.planned_sessions where id=new.planned_session_id;
  select athlete_id,planned_session_id into version_owner,version_session
    from public.planned_session_versions where id=new.planned_session_version_id;
  if benchmark.athlete_id is distinct from new.athlete_id
     or session_owner is distinct from new.athlete_id
     or version_owner is distinct from new.athlete_id
     or version_session is distinct from new.planned_session_id then
    raise exception 'Speed record link identity does not match';
  end if;
  return new;
end;
$function$;

create trigger speed_record_benchmark_identity
  before insert or update on public.athlete_speed_record_benchmarks
  for each row execute function public.protect_speed_record_identity();
create trigger speed_record_version_identity
  before insert or update on public.athlete_speed_record_versions
  for each row execute function public.protect_speed_record_identity();

create or replace function public.athlete_speed_record_v1(p_athlete_id uuid)
returns jsonb language sql stable security invoker
set search_path=public,pg_temp as $function$
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
  select attempt.benchmark_id,attempt.id as completion_id,p.id as piece_id,p.position,
    coalesce(p.duration_seconds_exact,p.duration_seconds::numeric) as duration_seconds,
    coalesce(correction.distance_m::numeric,case p.distance_unit
      when 'm' then p.distance
      when 'km' then p.distance*1000
      when 'mi' then p.distance*1609.344
      else null end) as distance_m
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
      'displaySplitPair',splits.value,'pieceEvidenceQuality',latest.piece_evidence_quality
    ) end
  ) order by mark.position),'[]'::jsonb) as value
  from benchmarks mark
  left join attempt_counts counts on counts.benchmark_id=mark.id
  left join latest_attempt latest on latest.benchmark_id=mark.id
  left join split_pairs splits on splits.completion_id=latest.completion_id
  left join authored_segments segments on segments.benchmark_id=mark.id
),
upcoming_json as (
  select coalesce(jsonb_agg(jsonb_build_object(
    'plannedSessionId',session.id,'versionId',version.id,'date',session.scheduled_on,
    'benchmarkId',link.benchmark_id,'displayShape',link.display_shape,
    'targetPace',case when pace.low_seconds is null and pace.high_seconds is null then null
      else jsonb_build_object('lowSeconds',pace.low_seconds,'highSeconds',pace.high_seconds,'unit','mi') end
  ) order by session.scheduled_on,session.position,session.id),'[]'::jsonb) as value
  from linked link
  join public.planned_sessions session on session.id=link.planned_session_id
    and session.athlete_id=link.athlete_id and session.state='published'
    and session.scheduled_on >= (now() at time zone 'America/New_York')::date
  join public.planned_session_versions version on version.id=link.planned_session_version_id
    and version.planned_session_id=session.id and version.athlete_id=session.athlete_id
    and version.version_number=(select max(newest.version_number)
      from public.planned_session_versions newest where newest.planned_session_id=session.id)
  left join lateral (
    select min(component.pace_low_seconds) as low_seconds,max(component.pace_high_seconds) as high_seconds
    from public.planned_session_components component
    where component.version_id=version.id and component.role='work'
  ) pace on true
  where not exists(select 1 from public.session_completions completed
    where completed.planned_session_id=session.id and completed.athlete_id=session.athlete_id
      and completed.status in ('completed','partial','changed'))
)
select jsonb_build_object(
  'contractVersion',1,
  'athleteId',athlete.id,
  'firstName',athlete.first_name,
  'recordBlock',case when block.id is null then null else jsonb_build_object(
    'id',block.id,'startsOn',block.starts_on,'endsOn',block.ends_on,'status',block.status) end,
  'benchmarks',coalesce((select value from benchmark_json),'[]'::jsonb),
  'upcoming',coalesce((select value from upcoming_json),'[]'::jsonb)
)
from authorized athlete left join active_block block on block.athlete_id=athlete.id;
$function$;

revoke all on function public.athlete_speed_record_v1(uuid) from public,anon;
grant execute on function public.athlete_speed_record_v1(uuid) to authenticated;

comment on function public.athlete_speed_record_v1(uuid) is
  'Authenticated Speed Record v1 projection. Explicit curated immutable versions only; weighted work evidence, no title parsing, Vault leakage, or inferred performance.';
comment on table public.athlete_speed_record_benchmarks is
  'Coach-curated stable workout identities for one athlete and active training block. Not a global workout catalogue.';
comment on table public.athlete_speed_record_versions is
  'Exact immutable published plan versions belonging to one curated Speed benchmark. Historical versions remain linked for attempt provenance.';
