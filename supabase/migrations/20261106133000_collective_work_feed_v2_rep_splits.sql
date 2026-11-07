-- FORM Field: group-visible filed performance, not a second consent prompt.
-- Additive v2. The existing collective_work_feed signature remains intact.
-- This projects only real filed work-rep results for an already-publishable
-- run post. Medical details, coach notes, location and private plans stay out.

create or replace function public.collective_work_feed_v2(
  p_limit integer default 12,
  p_before timestamptz default null,
  p_before_id uuid default null)
returns table(
  id text,first_name text,session_title text,source_kind text,
  actual_distance numeric,distance_unit text,duration_seconds integer,
  set_count integer,movement_summary text[],filed_at timestamptz,
  city text,portrait_url text,rep_splits jsonb)
language sql stable security definer set search_path='' as $function$
  with deduped as (
    select distinct on (
      p.athlete_id,lower(p.session_title),
      (p.filed_at at time zone 'America/New_York')::date
    ) p.*
    from public.collective_work_posts p
    where p.revoked_at is null
      and p.filed_at>=now()-interval '30 days'
      and collective_work_internal.publication_allowed(p.athlete_id)
      and public.collective_work_viewer_on_roster()
    order by p.athlete_id,lower(p.session_title),
      (p.filed_at at time zone 'America/New_York')::date,
      (p.actual_distance is not null) desc,p.filed_at desc,p.id desc
  ), eligible as (
    select d.*,row_number() over (order by d.filed_at desc,d.id desc) recency
    from deduped d
  )
  select p.id::text,p.first_name,p.session_title,p.source_kind,
    p.actual_distance,p.distance_unit,p.duration_seconds,p.set_count,
    p.movement_summary,p.filed_at,null::text as city,
    person.avatar_path as portrait_url,
    case when p.source_kind='run' then coalesce((
      select jsonb_agg(jsonb_build_object(
        'position',piece.position,
        'distanceMeters',round(coalesce(correction.distance_m::numeric,
          case piece.distance_unit when 'm' then piece.distance
            when 'km' then piece.distance*1000
            when 'mi' then piece.distance*1609.344 else null end))::integer,
        'durationMs',round(coalesce(piece.duration_seconds_exact,
           piece.duration_seconds::numeric)*1000)::bigint,
        'distanceSource',case when correction.id is not null then 'signed_correction'
          when piece.distance is not null then 'filed' else 'missing' end
      ) order by piece.position)
      from public.session_completions completion
      join public.session_pieces piece
        on piece.completion_id=completion.id and piece.athlete_id=completion.athlete_id
      left join public.speed_piece_distance_corrections correction
        on correction.piece_id=piece.id and correction.athlete_id=piece.athlete_id
      where completion.id=p.source_completion_id and completion.athlete_id=p.athlete_id
        and completion.status in ('completed','partial','changed')
        and completion.timing_source is distinct from 'strava'
        and piece.kind='rep'
        and coalesce(piece.duration_seconds_exact,piece.duration_seconds::numeric)>0
        and coalesce(correction.distance_m::numeric,
          case piece.distance_unit when 'm' then piece.distance
            when 'km' then piece.distance*1000
            when 'mi' then piece.distance*1609.344 else null end)>0
        and (completion.source='coach_import' or exists (
          select 1 from public.planned_session_components work
          where work.version_id=completion.planned_session_version_id
            and work.athlete_id=completion.athlete_id
            and work.role='work' and work.shape='repetitions'
        ))
    ),'[]'::jsonb) else '[]'::jsonb end as rep_splits
  from eligible p
  left join lateral (
    select case
      when exists (
        select 1 from public.collective_people hidden
        where hidden.athlete_id=p.athlete_id and hidden.visible is not true
      ) then null::text
      else coalesce(
        (select min(pp.avatar_path)
         from public.collective_people pp
         where pp.athlete_id=p.athlete_id and pp.visible=true
           and pp.avatar_path ~* '^(/media|/assets|avatars)/[A-Za-z0-9._/-]+[.](webp|jpe?g|png)$'
           and position('..' in pp.avatar_path)=0
           and position('//' in pp.avatar_path)=0
         having count(distinct pp.avatar_path)=1),
        (select split_part(a.portrait_path,'?',1)
         from public.athletes a where a.id=p.athlete_id
           and split_part(a.portrait_path,'?',1)
                ~* '^(/media|/assets|avatars)/[A-Za-z0-9._/-]+[.](webp|jpe?g|png)$'
           and position('..' in split_part(a.portrait_path,'?',1))=0
           and position('//' in split_part(a.portrait_path,'?',1))=0)
      )
    end as avatar_path
  ) person on true
  where (p.filed_at>=now()-interval '7 days' or p.recency<=6)
    and (p_before is null or (p.filed_at,p.id)<(p_before,p_before_id))
  order by p.filed_at desc,p.id desc
  limit least(greatest(coalesce(p_limit,12),1),12);
$function$;

revoke all on function public.collective_work_feed_v2(integer,timestamptz,uuid)
  from public,anon;
grant execute on function public.collective_work_feed_v2(integer,timestamptz,uuid)
  to authenticated;

comment on function public.collective_work_feed_v2(integer,timestamptz,uuid) is
  'Roster-scoped, default-share Field feed plus measured work-rep splits; no separate permission ask. Opt-outs and withdrawal remain authoritative.';
