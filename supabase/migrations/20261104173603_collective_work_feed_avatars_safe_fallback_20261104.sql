
-- Restore safe Collective portraits. Earlier feed migration double-escaped
-- the extension regex, causing every otherwise valid avatar to be rejected.
-- If no Collective person row exists, use the already-authored athlete portrait
-- only when it is a safe site-relative asset path. Hidden profiles stay hidden.
create or replace function public.collective_work_feed(
  p_limit integer default 12,
  p_before timestamp with time zone default null,
  p_before_id uuid default null
) returns table(
  id text, first_name text, session_title text, source_kind text,
  actual_distance numeric, distance_unit text, duration_seconds integer,
  set_count integer, movement_summary text[],
  filed_at timestamp with time zone, city text, portrait_url text
) language sql stable security definer set search_path to ''
as $$
  with deduped as (
    select distinct on (
      p.athlete_id,lower(p.session_title),
      (p.filed_at at time zone 'America/New_York')::date
    ) p.*
    from public.collective_work_posts p
    where p.revoked_at is null
      and p.filed_at >= now()-interval '30 days'
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
    person.avatar_path as portrait_url
  from eligible p
  left join lateral (
    select case
      when exists (
        select 1 from public.collective_people hidden
        where hidden.athlete_id=p.athlete_id
          and hidden.visible is not true
      ) then null::text
      else coalesce(
        (
          select min(pp.avatar_path)
          from public.collective_people pp
          where pp.athlete_id=p.athlete_id and pp.visible=true
            and pp.avatar_path ~* '^(/media|/assets|avatars)/[A-Za-z0-9._/-]+[.](webp|jpe?g|png)$'
            and position('..' in pp.avatar_path)=0
            and position('//' in pp.avatar_path)=0
          having count(distinct pp.avatar_path)=1
        ),
        (
          select split_part(a.portrait_path,'?',1)
          from public.athletes a where a.id=p.athlete_id
            and split_part(a.portrait_path,'?',1)
                 ~* '^(/media|/assets|avatars)/[A-Za-z0-9._/-]+[.](webp|jpe?g|png)$'
            and position('..' in split_part(a.portrait_path,'?',1))=0
            and position('//' in split_part(a.portrait_path,'?',1))=0
        )
      )
    end as avatar_path
  ) person on true
  where (p.filed_at >= now()-interval '7 days' or p.recency<=6)
    and (p_before is null or (p.filed_at,p.id)<(p_before,p_before_id))
  order by p.filed_at desc,p.id desc
  limit least(greatest(coalesce(p_limit,12),1),12);
$$;

revoke all on function public.collective_work_feed(integer,timestamp with time zone,uuid)
 from public,anon;
grant execute on function public.collective_work_feed(integer,timestamp with time zone,uuid)
 to authenticated,service_role;
