-- FORM Miami: shared practice is a source for exact, dated athlete sessions.
-- A prescribed Saturday is NOT evidence that FORM is hosting a Saturday run.
-- Hosting is exclusively a linked, published Collective occurrence with RSVP.

create table public.form_miami_subscriptions (
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  lane text not null check (lane in ('thursday','saturday')),
  track_mode text not null default 'paced' check (track_mode in ('paced','effort')),
  enabled boolean not null default true,
  joined_at timestamptz not null default now(),
  primary key (athlete_id,lane)
);
create index form_miami_subscription_lane on public.form_miami_subscriptions(lane,athlete_id) where enabled;

create table public.form_miami_session_links (
  lane text not null check (lane = 'thursday'),
  on_date date not null,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  planned_session_id uuid not null references public.planned_sessions(id) on delete cascade,
  paused boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (lane,on_date,athlete_id),
  unique (planned_session_id)
);
create index form_miami_session_links_session on public.form_miami_session_links(planned_session_id);

create table public.form_miami_publications (
  id uuid primary key default gen_random_uuid(),
  lane text not null check (lane = 'thursday'),
  on_date date not null,
  revision integer not null,
  payload jsonb not null,
  published_by uuid not null references auth.users(id),
  published_at timestamptz not null default now(),
  unique (lane,on_date,revision)
);
create index form_miami_publications_date on public.form_miami_publications(lane,on_date,revision desc);

create table public.form_miami_publication_receipts (
  publication_id uuid not null references public.form_miami_publications(id),
  athlete_id uuid not null references public.athletes(id),
  planned_session_id uuid not null references public.planned_sessions(id),
  before_version_id uuid not null references public.planned_session_versions(id),
  after_version_id uuid not null references public.planned_session_versions(id),
  primary key (publication_id,athlete_id)
);

create table public.form_miami_run_links (
  lane text not null check(lane in ('thursday','saturday')),
  on_date date not null,
  run_id uuid not null unique references public.collective_runs(id),
  linked_by uuid not null references auth.users(id),
  linked_at timestamptz not null default now(),
  primary key (lane,on_date)
);

create table public.form_miami_notifications (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  source_key text not null,
  kind text not null check (kind in ('session_revised','run_posted','coach_note','run_changed')),
  title text not null,
  body text not null,
  href text not null default '/athlete/',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  read_at timestamptz,
  unique (athlete_id,source_key)
);
create index form_miami_notifications_athlete_latest on public.form_miami_notifications(athlete_id,created_at desc);

create table public.form_miami_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.form_miami_email_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.form_miami_notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','sending','sent','skipped','failed')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  provider_id text,
  sent_at timestamptz,
  unique (notification_id,user_id)
);
create index form_miami_email_claim on public.form_miami_email_outbox(status,next_attempt_at) where status in ('pending','sending');

-- Supabase REST must not expose these private tables directly. All access is
-- audited through named RPCs with explicit coach and recipient authorization.
do $$ declare t text; begin
  foreach t in array array[
    'form_miami_subscriptions','form_miami_session_links','form_miami_publications',
    'form_miami_publication_receipts','form_miami_run_links',
    'form_miami_notifications','form_miami_notification_preferences','form_miami_email_outbox'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
  end loop;
end $$;

create or replace function public.form_miami_is_coach()
returns boolean language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.athlete_memberships m
    where m.user_id=(select auth.uid()) and m.role='coach' and m.status='active'
  );
$$;

create or replace function public.form_miami_ensure_coach()
returns void language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.form_miami_is_coach() then raise exception 'coach_access_required' using errcode='42501'; end if;
end $$;

-- Exact session links, rather than just weekday or title, prevent colliding
-- plans on the same day (notably Tinius's separate threshold block).
create or replace function public.form_miami_set_link(p_athlete_id uuid,p_session_id uuid,p_paused boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare s record;
begin
  perform public.form_miami_ensure_coach();
  if not public.is_coach_member(p_athlete_id) then raise exception 'not_athlete_coach'; end if;
  select id,athlete_id,scheduled_on,state into s from public.planned_sessions where id=p_session_id;
  if s.id is null or s.athlete_id<>p_athlete_id or s.scheduled_on is null or
     extract(isodow from s.scheduled_on)<>4 or s.state<>'published' then
    raise exception 'link_requires_published_thursday_session';
  end if;
  if not exists(select 1 from public.form_miami_subscriptions where athlete_id=p_athlete_id and lane='thursday' and enabled) then
    raise exception 'subscribe_first';
  end if;
  insert into public.form_miami_session_links(lane,on_date,athlete_id,planned_session_id,paused)
  values('thursday',s.scheduled_on,p_athlete_id,p_session_id,p_paused)
  on conflict(lane,on_date,athlete_id) do update set planned_session_id=excluded.planned_session_id,paused=excluded.paused;
end $$;

create or replace function public.form_miami_set_subscription(p_athlete_id uuid,p_lane text,p_enabled boolean,p_mode text default 'paced')
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.form_miami_ensure_coach();
  if not public.is_coach_member(p_athlete_id) then raise exception 'not_athlete_coach'; end if;
  if p_lane not in ('thursday','saturday') or p_mode not in ('paced','effort') then raise exception 'invalid_membership'; end if;
  insert into public.form_miami_subscriptions(athlete_id,lane,enabled,track_mode)
  values(p_athlete_id,p_lane,p_enabled,p_mode)
  on conflict(athlete_id,lane) do update set enabled=excluded.enabled,track_mode=excluded.track_mode;
end $$;

-- Preview never returns private coach notes or historical observations.
create or replace function public.form_miami_preview(p_lane text,p_on_date date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare roster jsonb; run_info jsonb; latest jsonb;
begin
  perform public.form_miami_ensure_coach();
  if p_lane not in ('thursday','saturday') or p_on_date is null then raise exception 'invalid_lane_or_date'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'athlete_id',a.id,'name',a.display_name,'mode',sub.track_mode,
    'session_id',s.id,'scheduled_on',s.scheduled_on,'state',s.state,
    'override',coalesce(s.override_reason,'')<>'',
    'paused',coalesce(link.paused,false),'filed',exists(select 1 from public.session_completions c where c.planned_session_id=s.id),
    'version_id',v.id,'version_number',v.version_number,'title',v.title,
    'intent',v.intent,'details',v.details,'duration',v.prescribed_duration_minutes,
    'distance',v.prescribed_distance,'unit',v.distance_unit,
    'components',(select coalesce(jsonb_agg(jsonb_build_object(
      'role',c.role,'shape',c.shape,'repeatCount',c.repeat_count,
      'distance',c.distance,'distanceUnit',c.distance_unit,'durationSeconds',c.duration_seconds,
      'recoverySeconds',c.recovery_seconds,'recoveryKind',c.recovery_kind,
      'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,
      'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high) order by c.position),'[]'::jsonb)
      from public.planned_session_components c where c.version_id=v.id)
  ) order by a.display_name),'[]'::jsonb) into roster
  from public.form_miami_subscriptions sub
  join public.athletes a on a.id=sub.athlete_id
  left join public.form_miami_session_links link on link.athlete_id=sub.athlete_id and link.lane=p_lane and link.on_date=p_on_date
  left join public.planned_sessions s on s.id=case when p_lane='thursday' then link.planned_session_id else null end
  left join lateral (select vv.* from public.planned_session_versions vv where vv.planned_session_id=s.id order by vv.version_number desc limit 1) v on true
  where sub.lane=p_lane and sub.enabled and public.is_coach_member(a.id);
  -- Saturdays are individualized distances, looked up separately by date.
  if p_lane='saturday' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'athlete_id',a.id,'name',a.display_name,'mode',sub.track_mode,'session_id',s.id,
      'scheduled_on',s.scheduled_on,'state',s.state,'title',v.title,
      'distance',v.prescribed_distance,'unit',v.distance_unit,'filed',exists(select 1 from public.session_completions c where c.planned_session_id=s.id)
    ) order by a.display_name),'[]'::jsonb) into roster
    from public.form_miami_subscriptions sub
    join public.athletes a on a.id=sub.athlete_id
    left join lateral(select ps.* from public.planned_sessions ps where ps.athlete_id=a.id and ps.scheduled_on=p_on_date and ps.state='published' order by ps.position limit 1) s on true
    left join lateral(select * from public.planned_session_versions vv where vv.planned_session_id=s.id order by vv.version_number desc limit 1) v on true
    where sub.lane='saturday' and sub.enabled and public.is_coach_member(a.id);
  end if;
  select jsonb_build_object('id',r.id,'title',r.title,'kind',r.kind,'status',r.status,
    'starts_at',r.starts_at,'meet_at',r.meet_at,'meet_name',r.meet_name,'meet_address',r.meet_address)
  into run_info from public.form_miami_run_links l join public.collective_runs_current r on r.id=l.run_id
  where l.lane=p_lane and l.on_date=p_on_date;
  select jsonb_build_object('revision',p.revision,'payload',p.payload,'published_at',p.published_at)
  into latest from public.form_miami_publications p where p.lane=p_lane and p.on_date=p_on_date order by p.revision desc limit 1;
  return jsonb_build_object('lane',p_lane,'date',p_on_date,'roster',roster,'run',run_info,'publication',latest);
end $$;

create or replace function public.form_miami_queue_notice(
 p_athlete_id uuid,p_source text,p_kind text,p_title text,p_body text,p_href text)
returns void language plpgsql security definer set search_path = '' as $$
declare notice_id uuid;
begin
  insert into public.form_miami_notifications(athlete_id,source_key,kind,title,body,href,created_by)
  values(p_athlete_id,p_source,p_kind,p_title,left(p_body,700),p_href,(select auth.uid()))
  on conflict(athlete_id,source_key) do nothing returning id into notice_id;
  if notice_id is null then return; end if;
  -- Only claimed, verified athlete accounts receive email. Invited-but-unclaimed
  -- profiles never generate speculative outbound mail.
  insert into public.form_miami_email_outbox(notification_id,user_id)
  select notice_id,m.user_id from public.athlete_memberships m
  join auth.users u on u.id=m.user_id
  where m.athlete_id=p_athlete_id and m.role='athlete' and m.status='active'
    and u.email_confirmed_at is not null and u.email is not null
  on conflict do nothing;
end $$;

create or replace function public.form_miami_publish_thursday(
 p_on_date date,p_payload jsonb,p_expected jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; v record; c record; pieces jsonb; arr jsonb; newv uuid; pubid uuid; revision_no int; changed int := 0; eligible int := 0;
begin
  perform public.form_miami_ensure_coach();
  if p_on_date is null or extract(isodow from p_on_date)<>4 or p_on_date<current_date then raise exception 'choose_future_thursday'; end if;
  if coalesce(length(btrim(p_payload->>'title')),0)<3 or coalesce(length(btrim(p_payload->>'intent')),0)<5 or
     coalesce(jsonb_typeof(p_payload->'components'),'')<>'array' or jsonb_array_length(p_payload->'components')<1 or
     jsonb_array_length(p_payload->'components')>12 or
     coalesce((p_payload->>'duration')::int,0) not between 10 and 240 then raise exception 'incomplete_workout'; end if;
  if jsonb_typeof(p_expected)<>'object' then raise exception 'preview_first'; end if;
  if length(p_payload::text)>12000 or length(p_payload->>'title')>100 or length(p_payload->>'intent')>240 or
     length(coalesce(p_payload->>'details',''))>500 then raise exception 'workout_too_long'; end if;
  -- Validate the wire shape before creating any version. Do not let clients
  -- smuggle in unsupported fields or individual pace values.
  if exists(select 1 from jsonb_array_elements(p_payload->'components') x
    where x->>'role' not in ('warm_up','work','cool_down')
      or x->>'shape' not in ('continuous','repetitions')
      or (x->>'repeatCount')::int not between 1 and 30 and x->>'shape'='repetitions'
      or (x->>'durationSeconds')::int<0 or (x->>'recoverySeconds')::int<0
      or (x->>'distance')::numeric<0 or (x->>'distanceUnit') not in ('mi','km','m')
      or x ? 'paceLowSeconds' or x ? 'paceHighSeconds'
  ) then raise exception 'invalid_workout_component'; end if;
  -- Row locks and expected version IDs make the preview a hard publication gate.
  -- A revision must never race an individual coach edit or a filing.
  perform pg_advisory_xact_lock(hashtext('form_miami_thursday:'||p_on_date::text));
  for r in select a.id athlete_id,sub.track_mode,s.id session_id,s.override_reason,s.state,link.paused
    from public.form_miami_subscriptions sub
    join public.athletes a on a.id=sub.athlete_id
    join public.form_miami_session_links link on link.athlete_id=a.id and link.lane='thursday' and link.on_date=p_on_date
    join public.planned_sessions s on s.id=link.planned_session_id
    where sub.lane='thursday' and sub.enabled order by a.id
  loop
    if not public.is_coach_member(r.athlete_id) then raise exception 'not_athlete_coach'; end if;
    if r.paused or r.state<>'published' or coalesce(r.override_reason,'')<>'' or
       exists(select 1 from public.session_completions where planned_session_id=r.session_id) then continue; end if;
    eligible := eligible+1;
    select * into v from public.planned_session_versions where planned_session_id=r.session_id order by version_number desc limit 1;
    if v.id is null or p_expected->>r.session_id::text is distinct from v.id::text then raise exception 'plan_changed_reload_preview'; end if;
  end loop;
  if eligible=0 then raise exception 'no_safe_recipients'; end if;
  if (select count(*) from jsonb_object_keys(p_expected))<>eligible then raise exception 'preview_recipient_mismatch'; end if;
  select coalesce(max(revision),0)+1 into revision_no from public.form_miami_publications where lane='thursday' and on_date=p_on_date;
  insert into public.form_miami_publications(lane,on_date,revision,payload,published_by)
  values('thursday',p_on_date,revision_no,p_payload,(select auth.uid())) returning id into pubid;
  for r in select sub.athlete_id,sub.track_mode,s.id session_id
    from public.form_miami_subscriptions sub
    join public.form_miami_session_links link on link.athlete_id=sub.athlete_id and link.lane='thursday' and link.on_date=p_on_date
    join public.planned_sessions s on s.id=link.planned_session_id
    where sub.lane='thursday' and sub.enabled and not link.paused and s.state='published'
      and coalesce(s.override_reason,'')='' and not exists(select 1 from public.session_completions where planned_session_id=s.id)
    order by sub.athlete_id
  loop
    select * into v from public.planned_session_versions where planned_session_id=r.session_id order by version_number desc limit 1;
    -- Athlete-specific paces survive unchanged only when the work shape and
    -- rep distance still match. Matt's effort-only mode has no clock targets.
    select coalesce(jsonb_agg(
      (n.value - 'paceLowSeconds' - 'paceHighSeconds') || jsonb_build_object(
        'paceLowSeconds',case when r.track_mode='effort' then null when old.shape=n.value->>'shape'
          and old.role=n.value->>'role' and old.distance is not distinct from (n.value->>'distance')::numeric
          and old.duration_seconds is not distinct from (n.value->>'durationSeconds')::integer
          then old.pace_low_seconds else null end,
        'paceHighSeconds',case when r.track_mode='effort' then null when old.shape=n.value->>'shape'
          and old.role=n.value->>'role' and old.distance is not distinct from (n.value->>'distance')::numeric
          and old.duration_seconds is not distinct from (n.value->>'durationSeconds')::integer
          then old.pace_high_seconds else null end
      ) order by n.ordinality),'[]'::jsonb) into pieces
    from jsonb_array_elements(p_payload->'components') with ordinality as n(value,ordinality)
    left join public.planned_session_components old on old.version_id=v.id and old.position=n.ordinality;
    newv:=public.write_session_version(r.session_id,p_payload->>'title',p_payload->>'intent',null,null,
      (p_payload->>'duration')::int,v.rpe_low,v.rpe_high,
      'FORM Thursday shared publication · revision '||revision_no,pieces,p_payload->>'details');
    insert into public.form_miami_publication_receipts(publication_id,athlete_id,planned_session_id,before_version_id,after_version_id)
    values(pubid,r.athlete_id,r.session_id,v.id,newv);
    perform public.form_miami_queue_notice(r.athlete_id,'thursday:'||pubid::text,'session_revised',
      'Thursday workout updated',p_payload->>'title'||'. Open your Week for the sets and recovery.','/athlete/');
    changed:=changed+1;
  end loop;
  return jsonb_build_object('publication_id',pubid,'revision',revision_no,'updated',changed);
end $$;

-- This is the only action that says a Saturday gathering is happening. It
-- links an existing real occurrence; no auto-created recurring run or meetup.
create or replace function public.form_miami_link_run(p_lane text,p_on_date date,p_run_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare runrec record; sub record; newlink boolean := false;
begin
  perform public.form_miami_ensure_coach();
  if not public.collective_is_publisher() then raise exception 'run_publisher_required'; end if;
  if p_lane not in ('thursday','saturday') or p_on_date is null or p_run_id is null then raise exception 'invalid_run_link'; end if;
  select * into runrec from public.collective_runs_current where id=p_run_id and author_kind='form';
  if runrec.id is null or runrec.status<>'scheduled' or runrec.kind<>(case when p_lane='thursday' then 'track' else 'long_run' end)
     or (runrec.starts_at at time zone 'America/New_York')::date<>p_on_date then raise exception 'run_kind_date_or_status_mismatch'; end if;
  if exists(select 1 from public.form_miami_run_links where lane=p_lane and on_date=p_on_date and run_id=p_run_id) then
    return jsonb_build_object('linked',true,'unchanged',true);
  end if;
  insert into public.form_miami_run_links(lane,on_date,run_id,linked_by)
  values(p_lane,p_on_date,p_run_id,(select auth.uid()))
  on conflict(lane,on_date) do update set run_id=excluded.run_id,linked_by=excluded.linked_by,linked_at=now();
  for sub in select athlete_id from public.form_miami_subscriptions where lane=p_lane and enabled loop
    if not public.is_coach_member(sub.athlete_id) then raise exception 'not_athlete_coach'; end if;
    perform public.form_miami_queue_notice(sub.athlete_id,'run:'||p_run_id::text,'run_posted',
      'FORM '||(case when p_lane='thursday' then 'Thursday' else 'Saturday' end)||' is on',
      runrec.title||'. Tap Who’s in to let the team know.','/runs/');
  end loop;
  return jsonb_build_object('linked',true,'run_id',p_run_id);
end $$;

-- A rescheduled/canceled hosted run is one real event changing, not an
-- athlete's Saturday prescription changing. Tell people who can RSVP.
create or replace function public.form_miami_announce_run_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare linkrow record; sub record; subject text; body_text text;
begin
  if new.kind not in ('time','place','cancelled') then return new; end if;
  select * into linkrow from public.form_miami_run_links where run_id=new.run_id;
  if linkrow.run_id is null then return new; end if;
  subject:=case when new.kind='cancelled' then 'FORM '||initcap(linkrow.lane)||' meetup canceled'
    else 'FORM '||initcap(linkrow.lane)||' meetup updated' end;
  body_text:=case when new.kind='cancelled' then
    'The group meetup is canceled. Your own training plan remains in Weeks.'
    else 'The group meetup time or place changed. Check the Run before heading out.' end;
  for sub in select athlete_id from public.form_miami_subscriptions
      where lane=linkrow.lane and enabled loop
    perform public.form_miami_queue_notice(sub.athlete_id,'run-change:'||new.id::text,
      'run_changed',subject,body_text,'/runs/');
  end loop;
  return new;
end $$;
create trigger form_miami_run_change_notify after insert on public.collective_run_changes
for each row execute function public.form_miami_announce_run_change();
revoke all on function public.form_miami_announce_run_change() from public,anon,authenticated;

create or replace function public.form_miami_nudge(p_lane text,p_on_date date,p_title text,p_body text,p_key uuid)
returns integer language plpgsql security definer set search_path = '' as $$
declare sub record; sent int:=0;
begin
  perform public.form_miami_ensure_coach();
  if p_lane not in ('thursday','saturday') or p_on_date is null or p_key is null or
     length(btrim(coalesce(p_title,''))) not between 4 and 90 or
     length(btrim(coalesce(p_body,''))) not between 5 and 500 then raise exception 'invalid_message'; end if;
  for sub in select athlete_id from public.form_miami_subscriptions where lane=p_lane and enabled loop
    if not public.is_coach_member(sub.athlete_id) then raise exception 'not_athlete_coach'; end if;
    perform public.form_miami_queue_notice(sub.athlete_id,'nudge:'||p_key::text,'coach_note',p_title,p_body,
      (case when p_lane='thursday' then '/athlete/' else '/runs/' end));
    sent:=sent+1;
  end loop;
  return sent;
end $$;

create or replace function public.form_miami_inbox()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object('id',n.id,'kind',n.kind,'title',n.title,
    'body',n.body,'href',n.href,'created_at',n.created_at,'read_at',n.read_at)
    order by n.created_at desc),'[]'::jsonb)
  from (select n.* from public.form_miami_notifications n
    join public.athlete_memberships m on m.athlete_id=n.athlete_id and m.role='athlete' and m.status='active'
    where m.user_id=(select auth.uid()) order by n.created_at desc limit 70) n;
$$;

-- Public calendar projection contains a deliberately published GROUP workout
-- only when a separately published, public Collective event links to it. It
-- never includes subscribers, private pace targets, or Saturday mileage.
create or replace function public.form_miami_public_calendar()
returns table(run_id uuid,lane text,on_date date,revision integer,session_title text,sets jsonb)
language sql stable security definer set search_path = '' as $$
  select l.run_id,l.lane,l.on_date,p.revision,p.payload->>'title',
    coalesce((select jsonb_agg(jsonb_build_object(
      'reps',x->'repeatCount','meters',((x->>'distance')::numeric*1000)::integer,
      'seconds',x->'durationSeconds','recovery',x->'recoverySeconds') order by ord)
      from jsonb_array_elements(p.payload->'components') with ordinality as parts(x,ord)
      where x->>'role'='work'),'[]'::jsonb)
  from public.form_miami_run_links l
  join public.collective_public_runs r on r.id=l.run_id and r.status='scheduled'
  join lateral(select * from public.form_miami_publications pub
    where pub.lane=l.lane and pub.on_date=l.on_date order by pub.revision desc limit 1) p on true
  where l.lane='thursday';
$$;

create or replace function public.form_miami_mark_read(p_notification_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed int;
begin
  update public.form_miami_notifications n set read_at=coalesce(n.read_at,now())
  where n.id=p_notification_id and exists(
    select 1 from public.athlete_memberships m where m.athlete_id=n.athlete_id
      and m.role='athlete' and m.status='active' and m.user_id=(select auth.uid()));
  get diagnostics changed=row_count;
  return changed=1;
end $$;

create or replace function public.form_miami_email_preference(p_enabled boolean default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare enabled boolean;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required'; end if;
  if p_enabled is not null then
    insert into public.form_miami_notification_preferences(user_id,email_enabled)
    values((select auth.uid()),p_enabled)
    on conflict(user_id) do update set email_enabled=excluded.email_enabled,updated_at=now();
  end if;
  select coalesce((select email_enabled from public.form_miami_notification_preferences
    where user_id=(select auth.uid())),true) into enabled;
  return enabled;
end $$;

-- Service-only outbox, returned in limited locked batches. The Edge sender
-- does not accept arbitrary addresses, titles, or body copy from a caller.
create or replace function public.form_miami_email_claim(p_limit int default 20)
returns table(id uuid,email text,title text,body text,href text)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.role()<>'service_role' then raise exception 'service_only'; end if;
  return query with claimed as (
    select o.id from public.form_miami_email_outbox o
    where (o.status='pending' or (o.status='sending' and o.next_attempt_at<now()))
      and o.next_attempt_at<=now() and o.attempts<4
    order by o.next_attempt_at,o.id for update skip locked limit least(greatest(p_limit,1),30)
  ), moved as (
    update public.form_miami_email_outbox o set status='sending',attempts=o.attempts+1,
      next_attempt_at=now()+interval '5 minutes' from claimed c where o.id=c.id
      returning o.id,o.user_id,o.notification_id
  )
  select moved.id,u.email,n.title,n.body,n.href
    from moved join auth.users u on u.id=moved.user_id
    join public.form_miami_notifications n on n.id=moved.notification_id
    left join public.form_miami_notification_preferences pref on pref.user_id=u.id
    where u.email_confirmed_at is not null and u.email is not null and coalesce(pref.email_enabled,true);
end $$;

create or replace function public.form_miami_email_finish(p_id uuid,p_success boolean,p_provider_id text default null,p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.role()<>'service_role' then raise exception 'service_only'; end if;
  update public.form_miami_email_outbox set
    status=case when p_success then 'sent' when attempts>=4 then 'failed' else 'pending' end,
    sent_at=case when p_success then now() else sent_at end,
    provider_id=left(p_provider_id,160),last_error=left(p_error,280),
    next_attempt_at=case when p_success then now() else now()+(attempts*attempts||' minutes')::interval end
  where id=p_id and status='sending';
end $$;

-- Withheld rows must not sit leased forever: mark opt-outs explicitly and
-- invalidate abandoned unverified destination mail on every dispatcher run.
create or replace function public.form_miami_email_cleanup()
returns integer language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  if auth.role()<>'service_role' then raise exception 'service_only'; end if;
  update public.form_miami_email_outbox o set status='skipped'
  where o.status in ('pending','sending') and (
    not exists(select 1 from auth.users u where u.id=o.user_id and u.email_confirmed_at is not null and u.email is not null)
    or exists(select 1 from public.form_miami_notification_preferences p where p.user_id=o.user_id and not p.email_enabled));
  get diagnostics changed=row_count;
  return changed;
end $$;

-- Least privilege: exposed functions only for signed-in clients. Internal
-- helpers and outbox operations never callable with an athlete JWT.
do $$ declare fn regprocedure; begin
  foreach fn in array array[
    'public.form_miami_is_coach()'::regprocedure,
    'public.form_miami_ensure_coach()'::regprocedure,
    'public.form_miami_queue_notice(uuid,text,text,text,text,text)'::regprocedure,
    'public.form_miami_email_claim(integer)'::regprocedure,
    'public.form_miami_email_finish(uuid,boolean,text,text)'::regprocedure,
    'public.form_miami_email_cleanup()'::regprocedure
  ] loop execute format('revoke all on function %s from public,anon,authenticated',fn); end loop;
end $$;
grant execute on function public.form_miami_set_link(uuid,uuid,boolean) to authenticated;
grant execute on function public.form_miami_set_subscription(uuid,text,boolean,text) to authenticated;
grant execute on function public.form_miami_preview(text,date) to authenticated;
grant execute on function public.form_miami_publish_thursday(date,jsonb,jsonb) to authenticated;
grant execute on function public.form_miami_link_run(text,date,uuid) to authenticated;
grant execute on function public.form_miami_nudge(text,date,text,text,uuid) to authenticated;
grant execute on function public.form_miami_inbox() to authenticated;
revoke all on function public.form_miami_public_calendar() from public,anon,authenticated;
grant execute on function public.form_miami_public_calendar() to anon,authenticated;
grant execute on function public.form_miami_mark_read(uuid) to authenticated;
grant execute on function public.form_miami_email_preference(boolean) to authenticated;
grant execute on function public.form_miami_email_claim(integer) to service_role;
grant execute on function public.form_miami_email_finish(uuid,boolean,text,text) to service_role;
grant execute on function public.form_miami_email_cleanup() to service_role;

-- Explicit inaugural subscription. Matt uses effort, not the team's clock
-- target; individual Saturday distance never gets overwritten by this feature.
insert into public.form_miami_subscriptions(athlete_id,lane,track_mode)
select id,'thursday',case when slug='matt-alvarez' then 'effort' else 'paced' end
from public.athletes where slug in ('brice','david','jimmy-holmquist','kevin','matt-alvarez','sam-reyes','tinius')
on conflict do nothing;
insert into public.form_miami_subscriptions(athlete_id,lane,track_mode)
select id,'saturday','effort' from public.athletes
where slug in ('brice','jimmy-holmquist','kevin','matt-alvarez','sam-reyes','tinius')
on conflict do nothing;

-- Seed only sessions explicitly named Speed in the current cohort block. A
-- second Thursday threshold workout on the same calendar day is untouched.
insert into public.form_miami_session_links(lane,on_date,athlete_id,planned_session_id)
select 'thursday',ps.scheduled_on,ps.athlete_id,ps.id
from public.planned_sessions ps
join public.athletes a on a.id=ps.athlete_id
join public.training_weeks w on w.id=ps.week_id
join lateral(select title from public.planned_session_versions v where v.planned_session_id=ps.id order by v.version_number desc limit 1) v on true
where a.slug in ('brice','david','jimmy-holmquist','kevin','matt-alvarez','sam-reyes','tinius')
  and ps.scheduled_on between '2026-10-26' and '2027-01-31'
  and extract(isodow from ps.scheduled_on)=4 and ps.state='published'
  and v.title ~* '^Speed'
on conflict do nothing;
