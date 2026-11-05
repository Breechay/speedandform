-- FORM 44.7 · Halo announcements and one-ahead Thursday publication.
-- This migration creates no announcement, sends no push/email, and does not
-- publish any run by itself. Scheduling the guarded rollover is a separate,
-- reviewed production action after dry-run acceptance.

alter table public.form_home_team_announcements
  add column if not exists author_account_id uuid references auth.users(id),
  add column if not exists sender_name text not null default 'Brice',
  add column if not exists audience_kind text check (audience_kind in ('all_members','confirmed_run_attendees')),
  add column if not exists audience_run_id uuid references public.collective_runs(id),
  add column if not exists revision integer not null default 1 check (revision > 0),
  add column if not exists supersedes uuid references public.form_home_team_announcements(id),
  add column if not exists expires_at timestamptz,
  add column if not exists action_label text,
  add column if not exists action_target text check (action_target in ('week','races')),
  add column if not exists idempotency_key uuid unique;

create table if not exists public.form_home_announcement_recipients (
  announcement_id uuid not null references public.form_home_team_announcements(id) on delete cascade,
  account_id uuid not null references auth.users(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  read_at timestamptz,
  primary key (announcement_id,account_id)
);
create index if not exists form_home_announcement_recipient_unread
  on public.form_home_announcement_recipients(account_id,assigned_at desc) where read_at is null;

create table if not exists public.form_home_announcement_push_preferences (
  account_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.form_home_announcement_push_outbox (
  announcement_id uuid not null,
  account_id uuid not null,
  status text not null default 'pending' check (status in ('pending','sending','sent','skipped','failed')),
  attempts smallint not null default 0,
  next_attempt_at timestamptz not null default now(),
  provider_id text,
  last_error text,
  sent_at timestamptz,
  primary key (announcement_id,account_id),
  foreign key (announcement_id,account_id)
    references public.form_home_announcement_recipients(announcement_id,account_id) on delete cascade
);
create index if not exists form_home_announcement_push_claim
  on public.form_home_announcement_push_outbox(status,next_attempt_at)
  where status in ('pending','sending');

create table if not exists public.form_miami_rollover_exceptions (
  on_date date primary key,
  disposition text not null check (disposition in ('hold','cancelled','rescheduled')),
  replacement_meet_at timestamptz,
  replacement_starts_at timestamptz,
  replacement_meet_name text,
  replacement_meet_address text,
  reason text not null,
  issued_by uuid not null references auth.users(id),
  issued_at timestamptz not null default now(),
  check ((disposition='rescheduled') = (replacement_starts_at is not null))
);

create table if not exists public.form_miami_rollover_receipts (
  id uuid primary key default gen_random_uuid(),
  checked_at timestamptz not null default now(),
  current_date_miami date not null,
  target_date date not null,
  outcome text not null check (outcome in ('not_due','already_published','work_not_published','exception','published')),
  run_id uuid references public.collective_runs(id),
  publication_id uuid references public.form_miami_publications(id),
  detail jsonb not null default '{}'::jsonb
);

do $$ declare t text; begin
  foreach t in array array[
    'form_home_announcement_recipients','form_home_announcement_push_preferences',
    'form_home_announcement_push_outbox','form_miami_rollover_exceptions',
    'form_miami_rollover_receipts'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
  end loop;
end $$;

drop policy if exists form_home_team_member_read on public.form_home_team_announcements;
alter table public.form_home_team_announcements enable row level security;
revoke all on public.form_home_team_announcements from public,anon,authenticated;

create or replace function public.form_home_announcement_publish(
  p_idempotency_key uuid,
  p_audience_kind text,
  p_title text,
  p_body text,
  p_run_id uuid default null,
  p_action_label text default null,
  p_action_target text default null,
  p_expires_at timestamptz default null,
  p_enable_push boolean default false
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  announcement uuid;
  recipient_count integer;
begin
  if not public.collective_is_publisher() then raise exception 'publisher_required' using errcode='42501'; end if;
  if p_idempotency_key is null or p_audience_kind not in ('all_members','confirmed_run_attendees') then
    raise exception 'invalid_announcement_audience';
  end if;
  if length(btrim(coalesce(p_title,''))) not between 3 and 90
     or length(btrim(coalesce(p_body,''))) not between 3 and 1200 then
    raise exception 'invalid_announcement_copy';
  end if;
  if p_action_target is not null and p_action_target not in ('week','races') then
    raise exception 'invalid_announcement_action';
  end if;
  if p_audience_kind='confirmed_run_attendees' and (
    p_run_id is null or not exists(
      select 1 from public.collective_run_attendance a
      join public.collective_closeouts c on c.id=a.closeout_id and c.run_id=a.run_id
      where a.run_id=p_run_id and c.witness_confirmed and a.frozen_at is not null
    )
  ) then raise exception 'confirmed_closeout_required'; end if;

  select id into announcement from public.form_home_team_announcements
  where idempotency_key=p_idempotency_key;
  if announcement is not null then
    select count(*) into recipient_count from public.form_home_announcement_recipients
    where announcement_id=announcement;
    return jsonb_build_object('announcement_id',announcement,'recipients',recipient_count,'unchanged',true);
  end if;

  insert into public.form_home_team_announcements(
    title,body,published_at,author_account_id,sender_name,audience_kind,audience_run_id,
    action_label,action_target,expires_at,idempotency_key)
  values(btrim(p_title),btrim(p_body),now(),(select auth.uid()),'Brice',p_audience_kind,p_run_id,
    nullif(btrim(coalesce(p_action_label,'')),''),p_action_target,p_expires_at,p_idempotency_key)
  returning id into announcement;

  if p_audience_kind='all_members' then
    insert into public.form_home_announcement_recipients(announcement_id,account_id)
    select announcement,account_id from (
      select m.user_id account_id from public.athlete_memberships m
      where m.role='athlete' and m.status='active'
      union
      select cm.account_id from public.collective_members cm
    ) recipients where account_id is not null on conflict do nothing;
  else
    insert into public.form_home_announcement_recipients(announcement_id,account_id)
    select announcement,account_id
    from public.collective_run_attendance a
    join public.collective_closeouts c on c.id=a.closeout_id and c.run_id=a.run_id
    cross join lateral unnest(a.account_ids) as recipient(account_id)
    where a.run_id=p_run_id and c.witness_confirmed and a.frozen_at is not null
    on conflict do nothing;
  end if;

  select count(*) into recipient_count from public.form_home_announcement_recipients
  where announcement_id=announcement;
  if recipient_count=0 then raise exception 'no_verified_recipients'; end if;

  -- Push is opt-in twice: explicit publisher intent and the recipient's dedicated
  -- announcement preference. The queue carries privacy-safe lock-screen copy only.
  if p_enable_push then
    insert into public.form_home_announcement_push_outbox(announcement_id,account_id)
    select r.announcement_id,r.account_id from public.form_home_announcement_recipients r
    join public.form_home_announcement_push_preferences p on p.account_id=r.account_id and p.enabled
    where r.announcement_id=announcement on conflict do nothing;
  end if;
  return jsonb_build_object('announcement_id',announcement,'recipients',recipient_count,'unchanged',false);
end $$;

create or replace function public.form_home_announcements()
returns jsonb language sql stable security definer set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,'sender_name',a.sender_name,'title',a.title,'body',a.body,
    'published_at',a.published_at,'action_label',a.action_label,
    'action_target',a.action_target,'read_at',r.read_at
  ) order by a.published_at desc),'[]'::jsonb)
  from public.form_home_announcement_recipients r
  join public.form_home_team_announcements a on a.id=r.announcement_id
  where r.account_id=(select auth.uid()) and a.published_at<=now()
    and a.archived_at is null and (a.expires_at is null or a.expires_at>now());
$$;

create or replace function public.form_home_announcement_mark_read(p_announcement_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare changed integer;
begin
  update public.form_home_announcement_recipients
  set read_at=coalesce(read_at,now())
  where announcement_id=p_announcement_id and account_id=(select auth.uid());
  get diagnostics changed=row_count;
  return changed=1;
end $$;

create or replace function public.form_home_announcement_push_preference(p_enabled boolean default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare result boolean;
begin
  if (select auth.uid()) is null then raise exception 'sign_in_required' using errcode='42501'; end if;
  if p_enabled is not null then
    insert into public.form_home_announcement_push_preferences(account_id,enabled)
    values((select auth.uid()),p_enabled)
    on conflict(account_id) do update set enabled=excluded.enabled,updated_at=now();
  end if;
  select coalesce((select enabled from public.form_home_announcement_push_preferences
    where account_id=(select auth.uid())),false) into result;
  return result;
end $$;

-- Service-only claim contains no private announcement body. The APNs worker
-- sends only "FORM" / "New message from Brice" and deep-links to authorized UI.
create or replace function public.form_home_announcement_push_claim(p_limit integer default 20)
returns table(announcement_id uuid,account_id uuid,device_token text,environment text)
language plpgsql security definer set search_path = '' as $$
begin
  if current_user not in ('service_role','postgres') then raise exception 'service_only' using errcode='42501'; end if;
  return query with claims as (
    select o.announcement_id,o.account_id from public.form_home_announcement_push_outbox o
    where (o.status='pending' or (o.status='sending' and o.next_attempt_at<now()))
      and o.next_attempt_at<=now() and o.attempts<4
    order by o.next_attempt_at for update skip locked limit least(greatest(p_limit,1),50)
  ), moved as (
    update public.form_home_announcement_push_outbox o set status='sending',attempts=o.attempts+1,
      next_attempt_at=now()+interval '5 minutes' from claims c
    where o.announcement_id=c.announcement_id and o.account_id=c.account_id
    returning o.announcement_id,o.account_id
  ) select m.announcement_id,m.account_id,d.token,d.environment
    from moved m join public.collective_push_devices d on d.account=m.account_id;
end $$;

create or replace function public.form_home_announcement_push_finish(
  p_announcement_id uuid,p_account_id uuid,p_success boolean,
  p_provider_id text default null,p_error text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if current_user not in ('service_role','postgres') then raise exception 'service_only' using errcode='42501'; end if;
  update public.form_home_announcement_push_outbox set
    status=case when p_success then 'sent' when attempts>=4 then 'failed' else 'pending' end,
    sent_at=case when p_success then now() else sent_at end,
    provider_id=left(p_provider_id,160),last_error=left(p_error,280),
    next_attempt_at=case when p_success then now() else now()+(attempts*attempts||' minutes')::interval end
  where announcement_id=p_announcement_id and account_id=p_account_id and status='sending';
end $$;

create or replace function public.form_miami_rollover_next_thursday(
  p_now timestamptz default now(),p_dry_run boolean default true)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  miami_now timestamp;
  local_date date;
  next_date date;
  current_run record;
  series record;
  terms record;
  publication record;
  exception_row record;
  new_run uuid;
  meet_at timestamptz;
  starts_at timestamptz;
  outcome text;
  detail jsonb := '{}'::jsonb;
begin
  miami_now := p_now at time zone 'America/New_York';
  local_date := miami_now::date;
  next_date := local_date+7;
  <<workflow>>
  begin
  if extract(isodow from local_date)<>4 then outcome:='not_due'; exit workflow; end if;

  select r.* into current_run from public.form_miami_run_links l
  join public.collective_runs_current r on r.id=l.run_id
  where l.lane='thursday' and l.on_date=local_date;
  if current_run.id is null or current_run.status='cancelled'
     or p_now < current_run.starts_at+interval '2 hours' then
    outcome:='not_due'; exit workflow;
  end if;
  if exists(select 1 from public.form_miami_run_links where lane='thursday' and on_date=next_date) then
    outcome:='already_published'; exit workflow;
  end if;
  select * into publication from public.form_miami_publications p
    where p.lane='thursday' and p.on_date=next_date order by p.revision desc limit 1;
  if publication.id is null then outcome:='work_not_published'; exit workflow; end if;
  select * into exception_row from public.form_miami_rollover_exceptions where on_date=next_date;
  if exception_row.on_date is not null and exception_row.disposition in ('hold','cancelled') then
    outcome:='exception'; detail:=jsonb_build_object('disposition',exception_row.disposition); exit workflow;
  end if;

  select * into series from public.collective_run_series where id='track-thursday';
  select * into terms from public.collective_run_series_terms
    where series_id=series.id and effective_from<=next_date order by effective_from desc limit 1;
  if series.id is null or terms.id is null then outcome:='exception'; detail:='{"reason":"missing_series_terms"}'::jsonb; exit workflow; end if;
  meet_at := (next_date::timestamp + make_interval(mins=>terms.meet_minute)) at time zone series.time_zone;
  starts_at := (next_date::timestamp + make_interval(mins=>terms.run_minute)) at time zone series.time_zone;
  if exception_row.disposition='rescheduled' then
    meet_at:=coalesce(exception_row.replacement_meet_at,meet_at);
    starts_at:=exception_row.replacement_starts_at;
  end if;
  detail:=jsonb_build_object('title',publication.payload->>'title','meet_at',meet_at,'starts_at',starts_at);
  if p_dry_run then outcome:='published'; detail:=detail||'{"dry_run":true}'::jsonb; exit workflow; end if;

  perform pg_advisory_xact_lock(hashtext('form_miami_rollover:'||next_date::text));
  if exists(select 1 from public.form_miami_run_links where lane='thursday' and on_date=next_date) then
    outcome:='already_published'; exit workflow;
  end if;
  insert into public.collective_runs(author_kind,author_account_id,kind,series_id,title,visibility,
    meet_at,starts_at,meet_name,meet_address,group_facts)
  values('form',terms.issued_by,'track',series.id,publication.payload->>'title','public',meet_at,starts_at,
    coalesce(exception_row.replacement_meet_name,series.meet_name),
    coalesce(exception_row.replacement_meet_address,series.meet_address),
    jsonb_build_object('source','form_miami_rollover','publication_id',publication.id,'quiet',true))
  returning id into new_run;
  insert into public.form_miami_run_links(lane,on_date,run_id,linked_by)
  values('thursday',next_date,new_run,terms.issued_by);
  outcome:='published';
  end workflow;
  insert into public.form_miami_rollover_receipts(current_date_miami,target_date,outcome,run_id,publication_id,detail)
  values(local_date,next_date,outcome,new_run,publication.id,detail);
  return jsonb_build_object('outcome',outcome,'target_date',next_date,'run_id',new_run,'detail',detail);
end $$;

revoke all on function public.form_home_announcement_publish(uuid,text,text,text,uuid,text,text,timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.form_home_announcement_publish(uuid,text,text,text,uuid,text,text,timestamptz,boolean) to authenticated;
revoke all on function public.form_home_announcements() from public,anon,authenticated;
grant execute on function public.form_home_announcements() to authenticated;
revoke all on function public.form_home_announcement_mark_read(uuid) from public,anon,authenticated;
grant execute on function public.form_home_announcement_mark_read(uuid) to authenticated;
revoke all on function public.form_home_announcement_push_preference(boolean) from public,anon,authenticated;
grant execute on function public.form_home_announcement_push_preference(boolean) to authenticated;
revoke all on function public.form_home_announcement_push_claim(integer) from public,anon,authenticated;
grant execute on function public.form_home_announcement_push_claim(integer) to service_role;
revoke all on function public.form_home_announcement_push_finish(uuid,uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.form_home_announcement_push_finish(uuid,uuid,boolean,text,text) to service_role;
revoke all on function public.form_miami_rollover_next_thursday(timestamptz,boolean) from public,anon,authenticated;
grant execute on function public.form_miami_rollover_next_thursday(timestamptz,boolean) to service_role;

-- Intentionally no cron.schedule here. Production scheduling remains disabled
-- until dry-run receipts, exceptions, DST and quiet-queue assertions pass.
