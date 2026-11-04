
-- FORM community work: ON by default for active coached roster athletes.
-- An explicit OFF in Settings overrides the default and hides all of that
-- athlete's posts, including coach-filed work while the account is unclaimed.
-- The community feed remains visible only to authenticated roster members.

create or replace function collective_work_internal.publication_allowed(p_athlete_id uuid)
returns boolean language sql stable security definer set search_path to ''
as $$
  select collective_work_internal.is_roster_athlete(p_athlete_id)
    and not exists (
      select 1 from public.collective_work_consents c
      where c.athlete_id = p_athlete_id and c.enabled = false
    );
$$;

create or replace function collective_work_internal.publication_owner(
  p_athlete_id uuid, p_filed_by uuid, p_allow_coach boolean
) returns uuid language sql stable security definer set search_path to ''
as $$
  select case
    when exists (
      select 1 from public.athlete_memberships m
      where m.athlete_id=p_athlete_id and m.user_id=p_filed_by
        and m.role='athlete' and m.status='active'
    ) then p_filed_by
    when p_allow_coach and exists (
      select 1 from public.athlete_memberships m
      where m.athlete_id=p_athlete_id and m.user_id=p_filed_by
        and m.role='coach' and m.status='active'
    ) then coalesce((
      select m.user_id from public.athlete_memberships m
      where m.athlete_id=p_athlete_id and m.role='athlete' and m.status='active'
      order by m.created_at, m.user_id limit 1
    ), p_filed_by)
    else null::uuid
  end;
$$;

revoke all on function collective_work_internal.publication_allowed(uuid)
  from public, anon, authenticated;
revoke all on function collective_work_internal.publication_owner(uuid, uuid, boolean)
  from public, anon, authenticated;

create or replace function public.collective_work_sharing_get()
returns boolean language sql stable security definer set search_path to ''
as $$
  select coalesce(
    collective_work_internal.publication_allowed(
      (public.coaching_access_identity()->>'athlete_id')::uuid
    ), false
  );
$$;

create or replace function collective_work_internal.consent_withdrawn()
returns trigger language plpgsql security definer set search_path to ''
as $$
begin
  if old.enabled and not new.enabled then
    update public.collective_work_posts p
    set revoked_at = now()
    where p.athlete_id = new.athlete_id and p.revoked_at is null;
  end if;
  return new;
end;
$$;

create or replace function collective_work_internal.consent_deleted()
returns trigger language plpgsql security definer set search_path to ''
as $$
begin
  update public.collective_work_posts p
  set revoked_at = now()
  where p.athlete_id = old.athlete_id and p.revoked_at is null;
  return old;
end;
$$;

create or replace function collective_work_internal.publish_completion(
  rec public.session_completions
) returns void language plpgsql security definer set search_path to ''
as $$
declare
  v_title text;
  v_first text;
  v_owner uuid;
begin
  select nullif(btrim(v.title), '') into v_title
  from public.planned_session_versions v
  where v.id=rec.planned_session_version_id
    and v.planned_session_id=rec.planned_session_id and v.athlete_id=rec.athlete_id;
  select nullif(btrim(a.first_name), '') into v_first
  from public.athletes a where a.id=rec.athlete_id;

  update public.collective_work_posts
  set revoked_at=now()
  where source_completion_id=rec.id and revoked_at is null;

  if rec.status not in ('completed','partial','changed')
     or rec.source not in ('athlete','form','coach_import')
     or v_title is null or v_first is null
     or not collective_work_internal.publication_allowed(rec.athlete_id)
  then return; end if;

  v_owner := collective_work_internal.publication_owner(
    rec.athlete_id,rec.filed_by,rec.source='coach_import'
  );
  if v_owner is null then return; end if;

  insert into public.collective_work_posts (
    source_completion_id,athlete_id,owner_user_id,group_id,source_kind,
    first_name,session_title,actual_distance,distance_unit,duration_seconds,
    filed_at,revoked_at
  ) values (
    rec.id,rec.athlete_id,v_owner,null,'run',v_first,v_title,
    rec.actual_distance,rec.distance_unit,rec.duration_seconds,rec.filed_at,null
  ) on conflict (source_completion_id) do update set
    athlete_id=excluded.athlete_id,
    owner_user_id=excluded.owner_user_id,
    first_name=excluded.first_name,
    session_title=excluded.session_title,
    actual_distance=excluded.actual_distance,
    distance_unit=excluded.distance_unit,
    duration_seconds=excluded.duration_seconds,
    filed_at=excluded.filed_at,
    revoked_at=null;
end;
$$;

create or replace function collective_work_internal.publish_strength_receipt(
  rec public.forge_strength_receipts
) returns void language plpgsql security definer set search_path to ''
as $$
declare
  v_title text := nullif(btrim(rec.session_name),'');
  v_first text;
  v_owner uuid;
begin
  select nullif(btrim(a.first_name),'') into v_first
  from public.athletes a where a.id=rec.athlete_id;
  update public.collective_work_posts set revoked_at=now()
  where source_strength_receipt_id=rec.receipt_id and revoked_at is null;

  if rec.completed_at is null or v_title is null or v_first is null
     or not collective_work_internal.publication_allowed(rec.athlete_id)
  then return; end if;
  v_owner := collective_work_internal.publication_owner(
    rec.athlete_id,rec.submitted_by,false
  );
  if v_owner is null then return; end if;

  insert into public.collective_work_posts (
    source_strength_receipt_id,source_kind,athlete_id,owner_user_id,group_id,
    first_name,session_title,set_count,movement_summary,filed_at,revoked_at
  ) values (
    rec.receipt_id,'strength',rec.athlete_id,v_owner,null,v_first,v_title,
    rec.set_count,rec.movement_summary,rec.completed_at,null
  ) on conflict (source_strength_receipt_id) do update set
    athlete_id=excluded.athlete_id,owner_user_id=excluded.owner_user_id,
    first_name=excluded.first_name,session_title=excluded.session_title,
    set_count=excluded.set_count,movement_summary=excluded.movement_summary,
    filed_at=excluded.filed_at,revoked_at=null;
end;
$$;

create or replace function collective_work_internal.publish_coach_strength_duration(
  rec public.coach_strength_duration_completions
) returns void language plpgsql security definer set search_path to ''
as $$
declare
  v_first text;
  v_owner uuid;
begin
  update public.collective_work_posts set revoked_at=now()
  where source_coach_strength_duration_id=rec.id and revoked_at is null;

  if rec.superseded_by_strength_receipt_id is not null
     or not collective_work_internal.publication_allowed(rec.athlete_id)
  then return; end if;
  select nullif(btrim(a.first_name),'') into v_first
  from public.athletes a where a.id=rec.athlete_id;
  if v_first is null or nullif(btrim(rec.session_title),'') is null then return; end if;
  v_owner := collective_work_internal.publication_owner(rec.athlete_id,rec.filed_by,true);
  if v_owner is null then return; end if;

  insert into public.collective_work_posts (
    source_coach_strength_duration_id,source_kind,athlete_id,owner_user_id,
    group_id,first_name,session_title,duration_seconds,set_count,movement_summary,
    filed_at,revoked_at
  ) values (
    rec.id,'strength',rec.athlete_id,v_owner,null,v_first,rec.session_title,
    rec.duration_seconds,null,null,rec.filed_at,null
  ) on conflict (source_coach_strength_duration_id) do update set
    athlete_id=excluded.athlete_id,owner_user_id=excluded.owner_user_id,
    first_name=excluded.first_name,session_title=excluded.session_title,
    duration_seconds=excluded.duration_seconds,set_count=null,
    movement_summary=null,filed_at=excluded.filed_at,revoked_at=null;
end;
$$;

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
    select distinct on (p.athlete_id, lower(p.session_title),
                        (p.filed_at at time zone 'America/New_York')::date)
           p.*
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
    select min(pp.avatar_path) as avatar_path
    from public.collective_people pp
    where pp.athlete_id=p.athlete_id and pp.visible=true
      and pp.avatar_path ~* '^(/media|/assets|avatars)/[A-Za-z0-9._/-]+\\.(webp|jpe?g|png)$'
      and pp.avatar_path !~ '\\.\\.' and pp.avatar_path !~ '//'
      and not exists(
        select 1 from public.collective_people h
        where h.athlete_id=p.athlete_id and h.visible is not true
      )
    having count(distinct pp.avatar_path)=1
  ) person on true
  where (p.filed_at >= now()-interval '7 days' or p.recency<=6)
    and (p_before is null or (p.filed_at,p.id)<(p_before,p_before_id))
  order by p.filed_at desc,p.id desc
  limit least(greatest(coalesce(p_limit,12),1),12);
$$;

-- Preserve the existing authenticated-only feed boundary.
revoke all on function public.collective_work_feed(integer,timestamp with time zone,uuid)
  from public,anon;
grant execute on function public.collective_work_feed(integer,timestamp with time zone,uuid)
  to authenticated,service_role;
