-- Linking is a relationship to one existing athlete, not an Auth-user merge.
-- Only the edge function, after verifying BOTH credentials, may call the writer.
create table public.coaching_apple_links (
  apple_user_id uuid primary key references auth.users(id) on delete cascade,
  verified_user_id uuid not null references auth.users(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  status text not null default 'active' check (status in ('active','revoked')),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  check (apple_user_id <> verified_user_id)
);
create index coaching_apple_links_source_idx on public.coaching_apple_links(verified_user_id,athlete_id);
alter table public.coaching_apple_links enable row level security;
revoke all on public.coaching_apple_links from public,anon,authenticated;
grant select,insert,update,delete on public.coaching_apple_links to service_role;
comment on table public.coaching_apple_links is 'Private dual-proof Apple-to-athlete bindings. No tokens, email strings or inferred ownership. Revocations propagate from the verified membership.';

create table public.coaching_apple_link_attempts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 1 check (attempts > 0)
);
alter table public.coaching_apple_link_attempts enable row level security;
revoke all on public.coaching_apple_link_attempts from public,anon,authenticated;
grant select,insert,update,delete on public.coaching_apple_link_attempts to service_role;

create or replace function public.coaching_apple_link_admit(p_user_id uuid)
returns boolean language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare n integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_only' using errcode='42501'; end if;
  insert into public.coaching_apple_link_attempts(user_id) values(p_user_id)
  on conflict(user_id) do update set
    window_started_at=case when coaching_apple_link_attempts.window_started_at < now()-interval '10 minutes' then now() else coaching_apple_link_attempts.window_started_at end,
    attempts=case when coaching_apple_link_attempts.window_started_at < now()-interval '10 minutes' then 1 else coaching_apple_link_attempts.attempts+1 end
  where coaching_apple_link_attempts.window_started_at < now()-interval '10 minutes' or coaching_apple_link_attempts.attempts < 10;
  get diagnostics n = row_count;
  return n=1;
end $$;
revoke all on function public.coaching_apple_link_admit(uuid) from public,anon,authenticated;
grant execute on function public.coaching_apple_link_admit(uuid) to service_role;

create or replace function public.coaching_connect_apple(p_verified_user_id uuid,p_apple_user_id uuid,p_expected_athlete_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare
  source_user auth.users%rowtype;
  apple_user auth.users%rowtype;
  target_id uuid;
  target_name text;
  source_count integer;
  old_link public.coaching_apple_links%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_only' using errcode='42501'; end if;
  if p_verified_user_id is null or p_apple_user_id is null then raise exception 'invalid_request' using errcode='22023'; end if;
  -- Stable lock order serializes concurrent attempts for the same two identities.
  perform id from auth.users where id in(p_verified_user_id,p_apple_user_id) order by id for update;
  select * into source_user from auth.users where id=p_verified_user_id;
  select * into apple_user from auth.users where id=p_apple_user_id;
  if source_user.id is null or source_user.email is null or source_user.email='' or source_user.email_confirmed_at is null
     or source_user.deleted_at is not null or source_user.is_anonymous or source_user.is_sso_user
     or source_user.banned_until > now() then
    raise exception 'verified_email_required' using errcode='42501';
  end if;
  if apple_user.id is null or apple_user.deleted_at is not null or apple_user.is_anonymous or apple_user.is_sso_user
     or apple_user.banned_until > now()
     or not exists(select 1 from auth.identities where user_id=p_apple_user_id and provider='apple') then
    raise exception 'apple_proof_required' using errcode='42501';
  end if;
  if exists(select 1 from public.account_deletion_requests where user_id in(p_verified_user_id,p_apple_user_id) and status in('requested','processing')) then
    raise exception 'account_unavailable' using errcode='42501';
  end if;
  -- An alias cannot mint another alias. The original verified membership owns access.
  if exists(select 1 from public.coaching_apple_links where apple_user_id=p_verified_user_id) then
    raise exception 'original_account_required' using errcode='42501';
  end if;
  perform 1 from public.athlete_memberships where user_id in(p_verified_user_id,p_apple_user_id) order by athlete_id,user_id,role for update;
  select count(*) into source_count from public.athlete_memberships m join public.athletes a on a.id=m.athlete_id
    where m.user_id=p_verified_user_id and m.role='athlete' and m.status='active' and a.active;
  if source_count <> 1 then raise exception 'one_athlete_required' using errcode='42501'; end if;
  select a.id,a.display_name into target_id,target_name from public.athlete_memberships m join public.athletes a on a.id=m.athlete_id
    where m.user_id=p_verified_user_id and m.role='athlete' and m.status='active' and a.active;
  if target_id is distinct from p_expected_athlete_id then raise exception 'athlete_changed' using errcode='23505'; end if;
  if p_verified_user_id=p_apple_user_id then
    return jsonb_build_object('athlete_id',target_id,'display_name',target_name,'status','already_connected');
  end if;
  -- Never move another athlete's identity, reactivate a revoked grant, or grant coach access.
  if exists(select 1 from public.athlete_memberships where user_id=p_apple_user_id and (athlete_id<>target_id or role<>'athlete' or status<>'active'))
     or exists(select 1 from public.coaching_administrators where user_id=p_apple_user_id) then
    raise exception 'apple_account_conflict' using errcode='23505';
  end if;
  select * into old_link from public.coaching_apple_links where apple_user_id=p_apple_user_id for update;
  if found and (old_link.verified_user_id<>p_verified_user_id or old_link.athlete_id<>target_id or old_link.status<>'active') then
    raise exception 'apple_account_conflict' using errcode='23505';
  end if;
  insert into public.coaching_apple_links(apple_user_id,verified_user_id,athlete_id)
    values(p_apple_user_id,p_verified_user_id,target_id) on conflict(apple_user_id) do nothing;
  insert into public.profiles(user_id,display_name) values(p_apple_user_id,target_name) on conflict(user_id) do nothing;
  insert into public.athlete_memberships(athlete_id,user_id,role,status)
    values(target_id,p_apple_user_id,'athlete','active') on conflict(athlete_id,user_id,role) do nothing;
  return jsonb_build_object('athlete_id',target_id,'display_name',target_name,'status','connected');
end $$;
revoke all on function public.coaching_connect_apple(uuid,uuid,uuid) from public,anon,authenticated;
grant execute on function public.coaching_connect_apple(uuid,uuid,uuid) to service_role;

-- Revoking either membership revokes the bridge. Re-enabling a source never
-- silently re-enables Apple. Removing a source Auth user also closes its bridge.
create or replace function public.coaching_apple_link_revoke_membership()
returns trigger language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  if old.role='athlete' and (tg_op='DELETE' or new.status<>'active' or new.role<>old.role or new.user_id<>old.user_id or new.athlete_id<>old.athlete_id) then
    update public.coaching_apple_links set status='revoked',revoked_at=coalesce(revoked_at,now())
    where status='active' and athlete_id=old.athlete_id and (verified_user_id=old.user_id or apple_user_id=old.user_id);
  end if;
  return null;
end $$;
revoke all on function public.coaching_apple_link_revoke_membership() from public,anon,authenticated;
create trigger coaching_apple_membership_revocation after update or delete on public.athlete_memberships
  for each row execute function public.coaching_apple_link_revoke_membership();

create or replace function public.coaching_apple_link_revoke_access()
returns trigger language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  if tg_op='DELETE' or new.status<>'active' then
    update public.athlete_memberships set status='inactive'
    where athlete_id=old.athlete_id and user_id=old.apple_user_id and role='athlete' and status='active';
  end if;
  return null;
end $$;
revoke all on function public.coaching_apple_link_revoke_access() from public,anon,authenticated;
create trigger coaching_apple_link_revocation after update of status or delete on public.coaching_apple_links
  for each row execute function public.coaching_apple_link_revoke_access();

-- A revoked bridge cannot be reactivated merely by another invitation claim.
create or replace function public.coaching_apple_membership_guard()
returns trigger language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare bridge public.coaching_apple_links%rowtype;
begin
  if new.status='active' then
    select * into bridge from public.coaching_apple_links where apple_user_id=new.user_id;
    if found and (new.role<>'athlete' or new.athlete_id<>bridge.athlete_id or bridge.status<>'active'
      or not exists(select 1 from public.athlete_memberships m where m.athlete_id=bridge.athlete_id and m.user_id=bridge.verified_user_id and m.role='athlete' and m.status='active')) then
      raise exception 'apple_link_revoked' using errcode='42501';
    end if;
  end if;
  return new;
end $$;
revoke all on function public.coaching_apple_membership_guard() from public,anon,authenticated;
create trigger coaching_apple_membership_guard before insert or update on public.athlete_memberships
  for each row execute function public.coaching_apple_membership_guard();

-- Backward-compatible response, typed failure instead of an arbitrary LIMIT 1.
create or replace function public.coaching_access_identity()
returns jsonb language plpgsql stable security definer set search_path=public,auth,pg_temp as $$
declare result jsonb; matches integer;
begin
  if auth.uid() is null then raise exception 'signed_in_account_required' using errcode='42501'; end if;
  if exists(select 1 from public.account_deletion_requests where user_id=auth.uid() and status in('requested','processing')) then
    raise exception 'account_unavailable' using errcode='42501';
  end if;
  select count(*),(jsonb_agg(jsonb_build_object('athlete_id',a.id,'display_name',a.display_name))->0)
    into matches,result from public.athlete_memberships m join public.athletes a on a.id=m.athlete_id
    where m.user_id=auth.uid() and m.role='athlete' and m.status='active' and a.active;
  if matches=0 then raise exception 'athlete_link_required' using errcode='P0002'; end if;
  if matches<>1 then raise exception 'athlete_identity_ambiguous' using errcode='P0003'; end if;
  return result;
end $$;
