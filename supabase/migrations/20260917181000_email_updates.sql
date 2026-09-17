-- Isolated newsletter consent, not an athlete account or a parallel training store.
-- All operations use service-only RPCs. No public/authenticated table policy.
create schema newsletter_private;
revoke all on schema newsletter_private from public, anon, authenticated;
create table newsletter_private.subscribers (
 id uuid primary key default gen_random_uuid(),
 email text unique not null check (email=lower(email) and length(email) between 3 and 254),
 state text not null default 'pending' check (state in ('pending','subscribed','unsubscribed','suppressed')),
 generation integer not null default 0,
 created_at timestamptz not null default now(),
 requested_at timestamptz not null default now(),
 confirmed_at timestamptz,
 unsubscribed_at timestamptz,
 consent_version text
);
create table newsletter_private.outbox (
 id uuid primary key,
 subscriber_id uuid not null references newsletter_private.subscribers(id) on delete cascade,
 generation integer not null,
 confirm_hash text not null unique check (confirm_hash ~ '^[0-9a-f]{64}$'),
 expires_at timestamptz not null default now()+interval '24 hours',
 consumed_at timestamptz,
 state text not null default 'sending' check (state in ('sending','retry','accepted','canceled')),
 payload jsonb,
 lease_until timestamptz not null default now()+interval '60 seconds',
 attempts integer not null default 1,
 provider_id uuid unique,
 delivery_state text,
 created_at timestamptz not null default now()
);
create index newsletter_outbox_subscriber on newsletter_private.outbox(subscriber_id,created_at);
create table newsletter_private.optouts (
 token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
 subscriber_id uuid not null references newsletter_private.subscribers(id) on delete cascade,
 created_at timestamptz not null default now()
);
create index newsletter_optouts_subscriber on newsletter_private.optouts(subscriber_id);
create table newsletter_private.quotas (
 bucket text primary key,
 starts_at timestamptz not null,
 hits integer not null check (hits>0)
);
create table newsletter_private.events (
 event_id text primary key check (length(event_id) between 1 and 128),
 request_id uuid not null references newsletter_private.outbox(id) on delete cascade,
 event_type text not null,
 created_at timestamptz not null default now()
);
alter table newsletter_private.subscribers enable row level security;
alter table newsletter_private.outbox enable row level security;
alter table newsletter_private.optouts enable row level security;
alter table newsletter_private.quotas enable row level security;
alter table newsletter_private.events enable row level security;
revoke all on all tables in schema newsletter_private from public, anon, authenticated;

create function public.newsletter_health() returns jsonb language sql security definer set search_path='' as $$ select '{"version":1}'::jsonb; $$;

create function public.newsletter_request(p_id uuid,p_email text,p_confirm text,p_optout text,p_payload jsonb,p_version text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare s newsletter_private.subscribers; j newsletter_private.outbox; n integer; k text; span interval;
begin
 if p_email is null or p_email<>lower(p_email) or length(p_email)>254 or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_confirm !~ '^[0-9a-f]{64}$' or p_optout !~ '^[0-9a-f]{64}$' or p_confirm=p_optout
    or p_version is distinct from '2026-09-17-v1' or octet_length(p_payload::text)>16000
    or p_payload->'to' is distinct from jsonb_build_array(p_email)
    or p_payload->>'from' is distinct from 'FORM <updates@send.speedandform.com>' then
   raise exception 'invalid newsletter request' using errcode='22023';
 end if;
 -- Initial conservative ceiling: 50 new confirmation messages/day, 10/hour,
 -- two per address/day and a five-minute re-request cooldown. Entire admission
 -- is serialized, so concurrent requests cannot exceed the quotas.
 perform pg_advisory_xact_lock(6717991);
 select * into j from newsletter_private.outbox where id=p_id for update;
 if found then
   select * into s from newsletter_private.subscribers where id=j.subscriber_id for update;
   if s.email<>p_email then return '{"code":"conflict"}'::jsonb; end if;
   if j.state in ('accepted','canceled') or j.expires_at<=now() or s.generation<>j.generation or s.state='suppressed' then return '{"code":"received"}'::jsonb; end if;
   if j.state='sending' and j.lease_until>now() then return '{"code":"busy"}'::jsonb; end if;
   if j.attempts>=3 then return '{"code":"rate_limited"}'::jsonb; end if;
   update newsletter_private.outbox set state='sending',attempts=attempts+1,lease_until=now()+interval '60 seconds' where id=p_id returning * into j;
   return jsonb_build_object('code','send','id',j.id,'payload',j.payload,'state',j.state);
 end if;
 select * into s from newsletter_private.subscribers where email=p_email for update;
 if found then
   if s.state in ('subscribed','suppressed') then return '{"code":"received"}'::jsonb; end if;
   if s.requested_at>now()-interval '5 minutes' then return '{"code":"rate_limited"}'::jsonb; end if;
   select count(*) into n from newsletter_private.outbox where subscriber_id=s.id and created_at>now()-interval '1 day';
   if n>=2 then return '{"code":"rate_limited"}'::jsonb; end if;
 end if;
 foreach k in array array['hour','day'] loop
   span:=case when k='hour' then interval '1 hour' else interval '1 day' end;
   select hits into n from newsletter_private.quotas where bucket=k and starts_at>now()-span;
   if n>=case when k='hour' then 10 else 50 end then return '{"code":"rate_limited"}'::jsonb; end if;
 end loop;
 foreach k in array array['hour','day'] loop
   span:=case when k='hour' then interval '1 hour' else interval '1 day' end;
   insert into newsletter_private.quotas(bucket,starts_at,hits) values(k,now(),1)
   on conflict(bucket) do update set hits=case when newsletter_private.quotas.starts_at<=now()-span then 1 else newsletter_private.quotas.hits+1 end,
   starts_at=case when newsletter_private.quotas.starts_at<=now()-span then now() else newsletter_private.quotas.starts_at end;
 end loop;
 insert into newsletter_private.subscribers(email,generation,consent_version) values(p_email,1,p_version)
 on conflict(email) do update set generation=newsletter_private.subscribers.generation+1,requested_at=now(),consent_version=p_version
 returning * into s;
 -- Unsubscribed stays unsubscribed until fresh affirmative confirmation.
 update newsletter_private.outbox set state='canceled',payload=null where subscriber_id=s.id and state in ('sending','retry');
 insert into newsletter_private.outbox(id,subscriber_id,generation,confirm_hash,payload) values(p_id,s.id,s.generation,p_confirm,p_payload) returning * into j;
 insert into newsletter_private.optouts(token_hash,subscriber_id) values(p_optout,s.id);
 return jsonb_build_object('code','send','id',j.id,'payload',j.payload,'state',j.state);
end $$;

create function public.newsletter_finish(p_id uuid,p_provider uuid,p_ok boolean) returns jsonb language plpgsql security definer set search_path='' as $$
declare j newsletter_private.outbox;
begin
 select * into j from newsletter_private.outbox where id=p_id for update;
 if not found then raise exception 'unknown newsletter delivery'; end if;
 if p_ok and p_provider is null then raise exception 'missing provider receipt'; end if;
 if j.provider_id is not null and p_provider is not null and j.provider_id<>p_provider then raise exception 'conflicting provider receipt'; end if;
 if p_ok then
   update newsletter_private.outbox set state=case when state='canceled' then 'canceled' else 'accepted' end,payload=null,provider_id=p_provider where id=p_id;
 elsif j.state not in ('accepted','canceled') then
   update newsletter_private.outbox set state='retry',lease_until=now() where id=p_id;
 end if;
 return '{"ok":true}'::jsonb;
end $$;

create function public.newsletter_confirm(p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare j newsletter_private.outbox; s newsletter_private.subscribers;
begin
 -- One lock order across request, confirmation and opt-out prevents race revival.
 perform pg_advisory_xact_lock(6717991);
 select * into j from newsletter_private.outbox where confirm_hash=p_hash for update;
 if not found then return '{"ok":false}'::jsonb; end if;
 select * into s from newsletter_private.subscribers where id=j.subscriber_id for update;
 if s.state='suppressed' or j.generation<>s.generation or j.state='canceled' then return '{"ok":false}'::jsonb; end if;
 if j.consumed_at is not null then return jsonb_build_object('ok',s.state='subscribed'); end if;
 if j.expires_at<=now() then return '{"ok":false}'::jsonb; end if;
 update newsletter_private.subscribers set state='subscribed',confirmed_at=now(),unsubscribed_at=null where id=s.id;
 update newsletter_private.outbox set consumed_at=now() where id=j.id;
 return '{"ok":true}'::jsonb;
end $$;

create function public.newsletter_unsubscribe(p_hash text) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid;
begin
 perform pg_advisory_xact_lock(6717991);
 select subscriber_id into sid from newsletter_private.optouts where token_hash=p_hash;
 if not found then return '{"ok":false}'::jsonb; end if;
 update newsletter_private.subscribers set state=case when state='suppressed' then 'suppressed' else 'unsubscribed' end,
   unsubscribed_at=now(),generation=generation+1 where id=sid;
 update newsletter_private.outbox set state='canceled',payload=null where subscriber_id=sid and state in ('sending','retry');
 return '{"ok":true}'::jsonb;
end $$;

create function public.newsletter_event(p_event text,p_request uuid,p_provider uuid,p_type text) returns jsonb language plpgsql security definer set search_path='' as $$
declare j newsletter_private.outbox; inserted integer;
begin
 perform pg_advisory_xact_lock(6717991);
 if p_type not in ('email.sent','email.delivered','email.delivery_delayed','email.bounced','email.complained','email.failed','email.suppressed') then return '{"ok":true}'::jsonb; end if;
 select * into j from newsletter_private.outbox where id=p_request for update;
 if not found then return '{"ok":true}'::jsonb; end if;
 if j.provider_id is not null and j.provider_id<>p_provider then raise exception 'conflicting newsletter event'; end if;
 insert into newsletter_private.events(event_id,request_id,event_type) values(p_event,p_request,p_type) on conflict(event_id) do nothing;
 get diagnostics inserted=row_count;
 if inserted=0 then return '{"ok":true}'::jsonb; end if;
 update newsletter_private.outbox set provider_id=p_provider,
   delivery_state=case when delivery_state in ('email.bounced','email.complained','email.suppressed') then delivery_state when delivery_state='email.delivered' and p_type in ('email.sent','email.delivery_delayed') then delivery_state else p_type end
   where id=p_request;
 if p_type in ('email.bounced','email.complained','email.suppressed') then
   update newsletter_private.subscribers set state='suppressed',generation=generation+1 where id=j.subscriber_id;
   update newsletter_private.outbox set state='canceled',payload=null where subscriber_id=j.subscriber_id and state in ('sending','retry');
 end if;
 return '{"ok":true}'::jsonb;
end $$;

create function public.newsletter_cleanup() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 update newsletter_private.outbox set payload=null,state=case when state in ('sending','retry') then 'canceled' else state end where expires_at<=now() and payload is not null;
 delete from newsletter_private.subscribers where state='pending' and requested_at<now()-interval '7 days';
 delete from newsletter_private.events where created_at<now()-interval '90 days';
 return '{"ok":true}'::jsonb;
end $$;

-- Even service_role has no direct table grant. Its only path is these exact RPCs.
revoke all on function public.newsletter_health() from public,anon,authenticated;
revoke all on function public.newsletter_request(uuid,text,text,text,jsonb,text) from public,anon,authenticated;
revoke all on function public.newsletter_finish(uuid,uuid,boolean) from public,anon,authenticated;
revoke all on function public.newsletter_confirm(text) from public,anon,authenticated;
revoke all on function public.newsletter_unsubscribe(text) from public,anon,authenticated;
revoke all on function public.newsletter_event(text,uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.newsletter_cleanup() from public,anon,authenticated;
grant execute on function public.newsletter_health() to service_role;
grant execute on function public.newsletter_request(uuid,text,text,text,jsonb,text) to service_role;
grant execute on function public.newsletter_finish(uuid,uuid,boolean) to service_role;
grant execute on function public.newsletter_confirm(text) to service_role;
grant execute on function public.newsletter_unsubscribe(text) to service_role;
grant execute on function public.newsletter_event(text,uuid,uuid,text) to service_role;
grant execute on function public.newsletter_cleanup() to service_role;
