-- FORM Curated · coach-owned invitations and event overlays.
-- A Collective run remains the only owner of time/place/status/RSVP.
-- An event is never a planned session or evidence that training was completed.

-- The iOS Run model already has .event, but the database's old constraints
-- still restrict FORM-authored occurrences to track/long_run. Preserve the
-- one-Run model while allowing curated fitness, yoga and social occurrences.
alter table public.collective_runs drop constraint collective_runs_kind_check;
alter table public.collective_runs add constraint collective_runs_kind_check
  check (kind = any(array['long_run'::text,'track'::text,'invite'::text,'event'::text]));
alter table public.collective_runs drop constraint collective_runs_check2;
alter table public.collective_runs add constraint collective_runs_check2
  check (author_kind <> 'form' or kind = any(array['long_run'::text,'track'::text,'event'::text]));

create table public.form_curated_hosts (
  slug text primary key check (slug ~ '^[a-z][a-z0-9-]{1,40}$'),
  display_name text not null check (length(btrim(display_name)) between 2 and 80),
  description text not null default '' check (length(description) <= 240),
  cadence_hint text not null default '' check (length(cadence_hint) <= 100),
  curated_by text not null default 'FORM',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.form_curated_run_links (
  run_id uuid primary key references public.collective_runs(id) on delete cascade,
  host_slug text not null references public.form_curated_hosts(slug),
  category text not null check (category in ('run','strength','yoga','wellness','social')),
  cadence text not null check (cadence in ('weekly','occasional','one_time')),
  ends_at timestamptz,
  source_url text check (source_url is null or source_url ~ '^https://'),
  note text not null default '' check (length(note) <= 280),
  curated_by uuid not null references auth.users(id),
  curated_at timestamptz not null default now()
);
create index form_curated_run_links_host on public.form_curated_run_links(host_slug);

create table public.form_curated_invitations (
  run_id uuid not null references public.form_curated_run_links(run_id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  invited_by uuid not null references auth.users(id),
  invited_at timestamptz not null default now(),
  read_at timestamptz,
  declined_at timestamptz,
  primary key (run_id,athlete_id),
  check (declined_at is null or read_at is not null)
);
create index form_curated_invites_athlete on public.form_curated_invitations(athlete_id,invited_at desc);

-- All three tables are private. They can only be accessed through functions
-- with per-user permission checks; no broad Data API table grants.
alter table public.form_curated_hosts enable row level security;
alter table public.form_curated_run_links enable row level security;
alter table public.form_curated_invitations enable row level security;
revoke all on public.form_curated_hosts from public,anon,authenticated;
revoke all on public.form_curated_run_links from public,anon,authenticated;
revoke all on public.form_curated_invitations from public,anon,authenticated;

insert into public.form_curated_hosts(slug,display_name,description,cadence_hint)
values
  ('form','FORM','Training mornings and selected gatherings.','Thursday practice; hosted Saturdays when announced'),
  ('irun','iRUN','Monday morning runs selected by FORM.','Monday mornings'),
  ('alo','ALO Wellness','Selected running and wellness events curated by FORM.','Dates announced individually');

-- Host names indicate independent FORM curation, not official partner accounts.
create or replace function public.form_curated_hosts_list()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'slug',h.slug,'name',h.display_name,'description',h.description,
    'cadence_hint',h.cadence_hint,'curated_by',h.curated_by
  ) order by case h.slug when 'form' then 0 when 'irun' then 1 else 2 end),'[]'::jsonb)
  from public.form_curated_hosts h
  where h.active and (select auth.uid()) is not null;
$$;

-- A coach must first publish a real dated Collective run. This link gives it
-- a curated host and category, without copying time, place, or RSVP state.
create or replace function public.form_curated_link_run(
  p_run_id uuid,p_host_slug text,p_category text,p_cadence text,
  p_source_url text default null,p_note text default '',p_ends_at timestamptz default null)
returns void language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  perform public.form_miami_ensure_coach();
  if not public.collective_is_publisher() then raise exception 'publisher_required' using errcode='42501'; end if;
  select id,author_kind,starts_at into r from public.collective_runs where id=p_run_id;
  if r.id is null or r.author_kind <> 'form' or r.starts_at < now() - interval '1 day' then
    raise exception 'published_form_run_required';
  end if;
  if not exists(select 1 from public.form_curated_hosts where slug=p_host_slug and active) then
    raise exception 'unknown_curated_host';
  end if;
  if p_ends_at is not null and p_ends_at<=r.starts_at then raise exception 'end_must_follow_start'; end if;
  insert into public.form_curated_run_links(run_id,host_slug,category,cadence,source_url,note,ends_at,curated_by)
  values(p_run_id,p_host_slug,p_category,p_cadence,p_source_url,coalesce(p_note,''),p_ends_at,(select auth.uid()))
  on conflict(run_id) do update set host_slug=excluded.host_slug,category=excluded.category,
    cadence=excluded.cadence,source_url=excluded.source_url,note=excluded.note,ends_at=excluded.ends_at;
end $$;

-- Small owner console: this reads the existing Collective calendar and
-- our editorial links. It does not create recurrence or infer attendance.
create or replace function public.form_curated_manage()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare events jsonb; available jsonb;
begin
  perform public.form_miami_ensure_coach();
  if not public.collective_is_publisher() then raise exception 'publisher_required' using errcode='42501'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'title',r.title,'kind',r.kind,'host_slug',l.host_slug,
    'category',l.category,'cadence',l.cadence,'starts_at',r.starts_at,
    'meet_name',r.meet_name,'status',r.status,
    'invitation_count',(select count(*) from public.form_curated_invitations i where i.run_id=r.id)
  ) order by r.starts_at),'[]'::jsonb) into events
  from public.form_curated_run_links l join public.collective_runs_current r on r.id=l.run_id
  where r.starts_at >= now()-interval '1 day' and r.starts_at < now()+interval '180 days';
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'title',r.title,'kind',r.kind,'starts_at',r.starts_at,'meet_name',r.meet_name
  ) order by r.starts_at),'[]'::jsonb) into available
  from public.collective_runs_current r
  where r.author_kind='form' and r.status='scheduled' and r.starts_at > now()
    and r.starts_at < now()+interval '180 days'
    and not exists(select 1 from public.form_curated_run_links l where l.run_id=r.id);
  return jsonb_build_object('events',events,'available_runs',available,
    'hosts',public.form_curated_hosts_list());
end $$;

-- A single transaction creates and curates an actual one-time occurrence.
-- Only a FORM publisher who is also a coach may use this private editor.
create or replace function public.form_curated_create_event(
  p_host_slug text,p_title text,p_category text,p_cadence text,
  p_starts_at timestamptz,p_meet_at timestamptz,p_meet_name text,p_meet_address text,
  p_visibility text default 'members',p_ends_at timestamptz default null,
  p_source_url text default null,p_note text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare created uuid;
begin
  perform public.form_miami_ensure_coach();
  if not public.collective_is_publisher() then raise exception 'publisher_required' using errcode='42501'; end if;
  if p_starts_at <= now() or p_starts_at > now()+interval '180 days'
    or (p_meet_at is not null and p_meet_at > p_starts_at)
    or p_visibility not in ('members','public') or btrim(coalesce(p_title,''))=''
    or btrim(coalesce(p_meet_name,''))='' or btrim(coalesce(p_meet_address,''))='' then
    raise exception 'check_time_title_and_meeting_place';
  end if;
  insert into public.collective_runs(
    author_kind,author_account_id,kind,title,visibility,starts_at,meet_at,meet_name,meet_address,group_facts)
  values('form',(select auth.uid()),'event',btrim(p_title),p_visibility,
    p_starts_at,p_meet_at,btrim(p_meet_name),btrim(p_meet_address),'{}'::jsonb)
  returning id into created;
  perform public.form_curated_link_run(created,p_host_slug,p_category,p_cadence,p_source_url,p_note,p_ends_at);
  return created;
end $$;

-- Recipient selection is explicit; neither group subscriptions nor athlete
-- profiles imply an invitation. Calling this function does not send email.
create or replace function public.form_curated_invite(
  p_run_id uuid,p_athlete_ids uuid[])
returns integer language plpgsql security definer set search_path = '' as $$
declare total integer;
begin
  perform public.form_miami_ensure_coach();
  if not public.collective_is_publisher() then raise exception 'publisher_required' using errcode='42501'; end if;
  if p_athlete_ids is null or cardinality(p_athlete_ids) not between 1 and 100 then
    raise exception 'choose_one_to_one_hundred_athletes';
  end if;
  if not exists (
    select 1 from public.form_curated_run_links l
    join public.collective_runs_current r on r.id=l.run_id
    where l.run_id=p_run_id and r.status='scheduled' and r.starts_at>now()
  ) then raise exception 'choose_published_future_run'; end if;
  if exists (select 1 from unnest(p_athlete_ids) as x(athlete_id)
    where not public.is_coach_member(x.athlete_id)) then
    raise exception 'uncoached_recipient' using errcode='42501';
  end if;
  insert into public.form_curated_invitations(run_id,athlete_id,invited_by)
  select p_run_id,x.athlete_id,(select auth.uid()) from (select distinct unnest(p_athlete_ids) as athlete_id) x
  on conflict do nothing;
  get diagnostics total = row_count;
  return total;
end $$;

-- All joined and invited flags are derived for the signed-in athlete only.
-- RSVP remains collective_run_ins; the invited table never claims attendance.
create or replace function public.form_curated_my()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare v_account_id uuid := (select auth.uid()); payload jsonb; total integer;
begin
  if v_account_id is null or not exists (
    select 1 from public.athlete_memberships m
    where m.user_id=v_account_id and m.role='athlete' and m.status='active'
  ) then return jsonb_build_object('hosts','[]'::jsonb,'events','[]'::jsonb,'unread_count',0); end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'host_slug',h.slug,'host_name',h.display_name,
    'title',r.title,'category',l.category,'cadence',l.cadence,
    'note',l.note,'source_url',l.source_url,'starts_at',r.starts_at,'ends_at',l.ends_at,'meet_at',r.meet_at,
    'meet_name',r.meet_name,'meet_address',r.meet_address,
    'status',r.status,'invited',i.athlete_id is not null,
    'unread',i.athlete_id is not null and i.read_at is null,
    'declined',i.declined_at is not null,
    'joined',exists(select 1 from public.collective_run_ins ci where ci.run_id=r.id and ci.account_id=v_account_id),
    'attendee_count',(select count(*) from public.collective_run_ins ci where ci.run_id=r.id)
  ) order by r.starts_at),'[]'::jsonb) into payload
  from public.form_curated_run_links l
  join public.form_curated_hosts h on h.slug=l.host_slug and h.active
  join public.collective_runs_current r on r.id=l.run_id
  left join lateral (
    select ci.* from public.form_curated_invitations ci
    join public.athlete_memberships m on m.athlete_id=ci.athlete_id
      and m.user_id=v_account_id and m.role='athlete' and m.status='active'
    where ci.run_id=r.id limit 1
  ) i on true
  where r.starts_at>=now()-interval '1 day' and r.starts_at<now()+interval '180 days'
    and (r.visibility='public' or public.collective_is_member() or i.athlete_id is not null);
  select count(*) into total from public.form_curated_invitations i
    join public.athlete_memberships m on m.athlete_id=i.athlete_id
    join public.collective_runs_current r on r.id=i.run_id
    where m.user_id=v_account_id and m.role='athlete' and m.status='active'
      and i.read_at is null and i.declined_at is null
      and r.starts_at>now() and r.status='scheduled';
  return jsonb_build_object('hosts',public.form_curated_hosts_list(),'events',payload,'unread_count',total);
end $$;

create or replace function public.form_curated_mark_read(p_run_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode='42501'; end if;
  update public.form_curated_invitations i set read_at=coalesce(i.read_at,now())
  from public.athlete_memberships m
  where i.run_id=p_run_id and m.athlete_id=i.athlete_id
    and m.user_id=(select auth.uid()) and m.role='athlete' and m.status='active';
end $$;

create or replace function public.form_curated_decline(p_run_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode='42501'; end if;
  update public.form_curated_invitations i
    set read_at=coalesce(i.read_at,now()),declined_at=coalesce(i.declined_at,now())
  from public.athlete_memberships m
  where i.run_id=p_run_id and m.athlete_id=i.athlete_id
    and m.user_id=(select auth.uid()) and m.role='athlete' and m.status='active';
end $$;

create or replace function public.form_curated_rsvp(p_run_id uuid,p_join boolean)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_account_id uuid := (select auth.uid()); run_row record;
begin
  if v_account_id is null or not public.collective_is_member() then
    raise exception 'join_collective_to_rsvp' using errcode='42501';
  end if;
  select r.id,r.status,r.starts_at,r.visibility into run_row
  from public.form_curated_run_links l join public.collective_runs_current r on r.id=l.run_id
  where l.run_id=p_run_id;
  if run_row.id is null or run_row.status<>'scheduled' or run_row.starts_at<=now()
    or run_row.visibility not in ('public','members') then
    raise exception 'run_unavailable';
  end if;
  if p_join then
    insert into public.collective_run_ins(run_id,account_id,at)
    values(p_run_id,v_account_id,now()) on conflict do nothing;
    perform public.form_curated_mark_read(p_run_id);
  else
    delete from public.collective_run_ins ci
    where ci.run_id=p_run_id and ci.account_id=v_account_id;
  end if;
  return p_join;
end $$;

-- RSVP is an explicit, member-owned declaration. Only an eligible signed-in
-- viewer may see names, never a coach's entire training roster. The tiny name
-- list is independent of the wider Collective navigation release flag.
create or replace function public.form_curated_attendees(p_run_id uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if (select auth.uid()) is null or not exists(
    select 1 from public.form_curated_run_links l
    join public.collective_runs_current r on r.id=l.run_id
    where l.run_id=p_run_id and r.starts_at>now()-interval '1 day'
      and (r.visibility='public' or public.collective_is_member() or exists(
        select 1 from public.form_curated_invitations i
        join public.athlete_memberships m on m.athlete_id=i.athlete_id
        where i.run_id=p_run_id and m.user_id=(select auth.uid())
          and m.role='athlete' and m.status='active'
      ))
  ) then return '[]'::jsonb; end if;
  select coalesce(jsonb_agg(x.name order by x.at),'[]'::jsonb) into result
  from (
    select ci.at,
      coalesce(nullif(btrim(cm.first_name),''),nullif(split_part(btrim(a.display_name),' ',1),''),'Runner') ||
      case when coalesce(nullif(btrim(cm.last_initial),''),nullif(split_part(btrim(a.display_name),' ',2),'')) is null
        then '' else ' ' || upper(left(coalesce(nullif(btrim(cm.last_initial),''),split_part(btrim(a.display_name),' ',2)),1)) end as name
    from public.collective_run_ins ci
    left join public.collective_members cm on cm.account_id=ci.account_id
    left join lateral (
      select ath.display_name from public.athlete_memberships m
      join public.athletes ath on ath.id=m.athlete_id
      where m.user_id=ci.account_id and m.role='athlete' and m.status='active'
      order by m.created_at limit 1
    ) a on true
    where ci.run_id=p_run_id order by ci.at limit 50
  ) x;
  return result;
end $$;

-- SECURITY DEFINER RPCs are not public endpoints by default.
revoke all on function public.form_curated_hosts_list() from public,anon,authenticated;
revoke all on function public.form_curated_link_run(uuid,text,text,text,text,text,timestamptz) from public,anon,authenticated;
revoke all on function public.form_curated_invite(uuid,uuid[]) from public,anon,authenticated;
revoke all on function public.form_curated_my() from public,anon,authenticated;
revoke all on function public.form_curated_mark_read(uuid) from public,anon,authenticated;
revoke all on function public.form_curated_decline(uuid) from public,anon,authenticated;
revoke all on function public.form_curated_rsvp(uuid,boolean) from public,anon,authenticated;
grant execute on function public.form_curated_hosts_list() to authenticated;
grant execute on function public.form_curated_my() to authenticated;
grant execute on function public.form_curated_mark_read(uuid) to authenticated;
grant execute on function public.form_curated_decline(uuid) to authenticated;
grant execute on function public.form_curated_rsvp(uuid,boolean) to authenticated;
grant execute on function public.form_curated_link_run(uuid,text,text,text,text,text,timestamptz) to authenticated;
grant execute on function public.form_curated_invite(uuid,uuid[]) to authenticated;
revoke all on function public.form_curated_manage() from public,anon,authenticated;
revoke all on function public.form_curated_create_event(text,text,text,text,timestamptz,timestamptz,text,text,text,timestamptz,text,text) from public,anon,authenticated;
grant execute on function public.form_curated_manage() to authenticated;
grant execute on function public.form_curated_create_event(text,text,text,text,timestamptz,timestamptz,text,text,text,timestamptz,text,text) to authenticated;
revoke all on function public.form_curated_attendees(uuid) from public,anon,authenticated;
grant execute on function public.form_curated_attendees(uuid) to authenticated;
