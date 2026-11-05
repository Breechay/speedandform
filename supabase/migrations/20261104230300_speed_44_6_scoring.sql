-- One scorer for timer, coach filing, watch and text. Attempt = completion.
-- The completion references the exact immutable Vault version it attempted.

-- Private calculation can inspect all completions for the faces-only aggregate.
-- It is not an API. The public wrapper separately checks athlete ownership.
create or replace function coach_performance_private.speed_vault_score_internal(p_completion_id uuid)
returns jsonb language sql stable security definer
set search_path = public, pg_temp as $$
with
  attempt as (
    select c.id,c.athlete_id,c.filed_at,c.status,c.source,c.planned_session_version_id,
           coalesce(c.vault_session_version_id,cl.vault_version_id,
                    pv.vault_session_version_id,pl.vault_version_id) as version_id
    from public.session_completions c
    left join public.speed_completion_vault_links cl
      on cl.completion_id=c.id and cl.athlete_id=c.athlete_id
    left join public.planned_session_versions pv on pv.id=c.planned_session_version_id
    left join public.speed_plan_vault_links pl
      on pl.plan_version_id=pv.id and pl.athlete_id=c.athlete_id
    where c.id=p_completion_id
      and c.status in ('completed','partial','changed')
      and c.source in ('athlete','form','coach_import')
  ),
  target as (
    select a.id as completion_id, v.id as version_id, s.family, b.ord,rep.rep,
           (b.block->>'distanceMeters')::integer as distance_m,
           (b.block->>'durationSeconds')::integer as duration_s,
           (b.block->>'targetMinMs')::bigint as min_ms,
           (b.block->>'targetMaxMs')::bigint as max_ms,
           component.pace_low_seconds as pace_low_s,
           component.pace_high_seconds as pace_high_s,
           row_number() over (order by b.ord,rep.rep) as rep_position
    from attempt a
    join public.vault_session_versions v on v.id=a.version_id
    join public.vault_sessions s on s.id=v.session_id
    cross join lateral jsonb_array_elements(v.blocks) with ordinality as b(block,ord)
    cross join lateral generate_series(1,(b.block->>'reps')::integer) as rep(rep)
    left join lateral (
      select pc.pace_low_seconds,pc.pace_high_seconds
      from public.speed_plan_vault_links link
      join public.planned_session_components pc on pc.version_id=link.plan_version_id
      where link.athlete_id=a.athlete_id and link.vault_version_id=v.id
        and pc.role='work'
      order by pc.position limit 1
    ) component on true
  ),
  actual as (
    select row_number() over (order by p.position) as rep_position,
           coalesce(d.distance_m::numeric,
             case p.distance_unit
               when 'm' then p.distance
               when 'km' then p.distance*1000
               when 'mi' then p.distance*1609.344
               else null end
           ) as distance_m,
           round(coalesce(p.duration_seconds_exact,p.duration_seconds::numeric)*1000)::bigint as ms,
           p.pace_seconds
    from attempt a join public.session_pieces p on p.completion_id=a.id and p.kind='rep'
    left join public.speed_piece_distance_corrections d
      on d.piece_id=p.id and d.athlete_id=a.athlete_id
  ),
  scored as (
    select t.rep_position,t.distance_m,t.duration_s,t.min_ms,t.max_ms,
           t.pace_low_s,t.pace_high_s,x.ms as actual_ms,x.pace_seconds as actual_pace_seconds,
           case when t.family='LONG HOLDS' then
             x.pace_seconds is not null and t.pace_low_s is not null
             and x.pace_seconds between t.pace_low_s and coalesce(t.pace_high_s,t.pace_low_s)
             and x.ms between (t.duration_s*1000-1000) and (t.duration_s*1000+1000)
           else
             abs(x.distance_m-t.distance_m)<=t.distance_m*0.01 and x.ms is not null
             and t.max_ms is not null
             and case when t.min_ms=t.max_ms then x.ms<=t.max_ms
                      else x.ms between t.min_ms and t.max_ms end
           end as hit
    from target t left join actual x on x.rep_position=t.rep_position
  )
select jsonb_build_object(
  'completionId',a.id,'vaultVersionId',a.version_id,
  'filedAt',a.filed_at,
  'total',count(s.rep_position),
  'hits',count(s.rep_position) filter(where s.hit),
  'cleared',count(s.rep_position)>0
       and count(s.rep_position)=count(s.rep_position) filter(where s.hit)
       and count(s.rep_position)=(select count(*) from actual),
  'reps',coalesce(jsonb_agg(jsonb_build_object(
    'position',s.rep_position,'distanceMeters',s.distance_m,
    'targetMinMs',s.min_ms,'targetMaxMs',s.max_ms,
    'paceLowSeconds',s.pace_low_s,'paceHighSeconds',s.pace_high_s,
    'actualMs',s.actual_ms,'actualPaceSeconds',s.actual_pace_seconds,
    'hit',coalesce(s.hit,false)
  ) order by s.rep_position) filter(where s.rep_position is not null),'[]'::jsonb)
)
from attempt a join target s on s.completion_id=a.id
group by a.id,a.version_id,a.filed_at;
$$;

revoke all on function coach_performance_private.speed_vault_score_internal(uuid)
  from public,anon,authenticated;

create or replace function public.vault_attempt_score(p_completion_id uuid)
returns jsonb language sql stable security definer
set search_path = public, pg_temp as $$
  select coach_performance_private.speed_vault_score_internal(c.id)
  from public.session_completions c
  where c.id=p_completion_id and public.can_read_athlete(c.athlete_id);
$$;
revoke all on function public.vault_attempt_score(uuid) from public,anon;
grant execute on function public.vault_attempt_score(uuid) to authenticated;

-- Deliberately declassified result: just faces of people who cleared. No times,
-- target precision, speeds, or athlete-specific files can cross this boundary.
create or replace function public.vault_cleared_faces(p_version_id uuid)
returns jsonb language plpgsql stable security definer
set search_path = public, pg_temp as $$
declare faces jsonb;
begin
  if auth.uid() is null or not exists (
    select 1 from public.athlete_memberships m
    where m.user_id=auth.uid() and m.status='active'
  ) then
    raise exception 'Not a FORM member' using errcode='42501';
  end if;

  if not exists (
    select 1 from public.vault_session_versions v
    join public.vault_sessions s on s.id=v.session_id
    where v.id=p_version_id and s.published
  ) then
    return '[]'::jsonb;
  end if;

  with first_clears as (
    select distinct on (c.athlete_id) c.athlete_id,c.filed_at
    from public.session_completions c
    left join public.speed_completion_vault_links cl
      on cl.completion_id=c.id and cl.athlete_id=c.athlete_id
    left join public.planned_session_versions pv on pv.id=c.planned_session_version_id
    left join public.speed_plan_vault_links pl
      on pl.plan_version_id=pv.id and pl.athlete_id=c.athlete_id
    where coalesce(c.vault_session_version_id,cl.vault_version_id,
                   pv.vault_session_version_id,pl.vault_version_id)=p_version_id
      and (coach_performance_private.speed_vault_score_internal(c.id)->>'cleared')::boolean is true
    order by c.athlete_id,c.filed_at,c.id
  ), visible as (
    select p.id,p.first_name,p.avatar_path
    from first_clears f join public.collective_people p on p.athlete_id=f.athlete_id
    where p.visible
    order by p.first_name,p.id limit 50
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'personId',id,'firstName',first_name,'avatarPath',avatar_path
  ) order by first_name,id),'[]'::jsonb) into faces from visible;

  return faces;
end;
$$;
revoke all on function public.vault_cleared_faces(uuid) from public,anon;
grant execute on function public.vault_cleared_faces(uuid) to authenticated;
