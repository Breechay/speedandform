-- Single canonical owner. Apple is an athlete-only authenticated alias.
create or replace function public.coaching_athlete_memberships()
returns table(athlete_id uuid, canonical_user_id uuid)
language plpgsql stable security definer set search_path=public,auth,pg_temp as $$
declare caller uuid := auth.uid(); bridge public.coaching_apple_links%rowtype;
begin
  if caller is null then return; end if;
  if not exists(select 1 from auth.users u where u.id=caller and u.deleted_at is null
      and not u.is_anonymous and (u.banned_until is null or u.banned_until<=now()))
     or exists(select 1 from public.account_deletion_requests where user_id=caller and status in('requested','processing','completed')) then return; end if;
  select * into bridge from public.coaching_apple_links where apple_user_id=caller;
  if found then
    if bridge.status<>'active' then return; end if;
    if not exists(select 1 from auth.identities where user_id=caller and provider='apple') then return; end if;
    if not exists(select 1 from auth.users u where u.id=bridge.verified_user_id and u.email_confirmed_at is not null
        and u.deleted_at is null and not u.is_anonymous and (u.banned_until is null or u.banned_until<=now()))
       or exists(select 1 from public.account_deletion_requests where user_id=bridge.verified_user_id and status in('requested','processing','completed')) then return; end if;
    return query select m.athlete_id,m.user_id from public.athlete_memberships m
      join public.athletes a on a.id=m.athlete_id and a.active
      where m.athlete_id=bridge.athlete_id and m.user_id=bridge.verified_user_id and m.role='athlete' and m.status='active';
  else
    return query select m.athlete_id,m.user_id from public.athlete_memberships m
      join public.athletes a on a.id=m.athlete_id and a.active
      where m.user_id=caller and m.role='athlete' and m.status='active';
  end if;
end $$;
revoke all on function public.coaching_athlete_memberships() from public,anon;
grant execute on function public.coaching_athlete_memberships() to authenticated,service_role;

create or replace function public.is_athlete_member(target_athlete_id uuid)
returns boolean language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from public.coaching_athlete_memberships() m where m.athlete_id=target_athlete_id);
$$;

create or replace function public.coaching_access_identity()
returns jsonb language plpgsql stable security definer set search_path=public,auth,pg_temp as $$
declare result jsonb; matches integer;
begin
  if auth.uid() is null then raise exception 'signed_in_account_required' using errcode='42501'; end if;
  select count(*),(jsonb_agg(jsonb_build_object('athlete_id',a.id,'display_name',a.display_name))->0)
    into matches,result from public.coaching_athlete_memberships() m join public.athletes a on a.id=m.athlete_id;
  if matches=0 then raise exception 'athlete_link_required' using errcode='P0002'; end if;
  if matches<>1 then raise exception 'athlete_identity_ambiguous' using errcode='P0003'; end if;
  return result;
end $$;

create or replace function public.coaching_connect_apple(p_verified_user_id uuid,p_apple_user_id uuid,p_expected_athlete_id uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare source_user auth.users%rowtype; apple_user auth.users%rowtype;
  target_id uuid; target_name text; source_count integer;
  old_link public.coaching_apple_links%rowtype;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service_only' using errcode='42501'; end if;
  if p_verified_user_id is null or p_apple_user_id is null then raise exception 'invalid_request' using errcode='22023'; end if;
  perform id from auth.users where id in(p_verified_user_id,p_apple_user_id) order by id for update;
  select * into source_user from auth.users where id=p_verified_user_id;
  select * into apple_user from auth.users where id=p_apple_user_id;
  if source_user.id is null or source_user.email is null or source_user.email='' or source_user.email_confirmed_at is null
     or source_user.deleted_at is not null or source_user.is_anonymous or source_user.is_sso_user or source_user.banned_until > now() then
    raise exception 'verified_email_required' using errcode='42501';
  end if;
  if apple_user.id is null or apple_user.deleted_at is not null or apple_user.is_anonymous or apple_user.is_sso_user
     or apple_user.banned_until > now() or not exists(select 1 from auth.identities where user_id=p_apple_user_id and provider='apple') then
    raise exception 'apple_proof_required' using errcode='42501';
  end if;
  if exists(select 1 from public.account_deletion_requests where user_id in(p_verified_user_id,p_apple_user_id) and status in('requested','processing','completed')) then
    raise exception 'account_unavailable' using errcode='42501';
  end if;
  if exists(select 1 from public.coaching_apple_links where apple_user_id=p_verified_user_id) then
    raise exception 'original_account_required' using errcode='42501';
  end if;
  perform 1 from public.athlete_memberships where user_id in(p_verified_user_id,p_apple_user_id) order by athlete_id,user_id,role for update;
  select count(*) into source_count from public.athlete_memberships m join public.athletes a on a.id=m.athlete_id
    where m.user_id=p_verified_user_id and m.role='athlete' and m.status='active' and a.active;
  if source_count<>1 then raise exception 'one_athlete_required' using errcode='42501'; end if;
  select a.id,a.display_name into target_id,target_name from public.athlete_memberships m join public.athletes a on a.id=m.athlete_id
    where m.user_id=p_verified_user_id and m.role='athlete' and m.status='active' and a.active;
  if target_id is distinct from p_expected_athlete_id then raise exception 'athlete_changed' using errcode='23505'; end if;
  if p_verified_user_id=p_apple_user_id then
    return jsonb_build_object('athlete_id',target_id,'display_name',target_name,'status','already_connected');
  end if;
  if exists(select 1 from public.athlete_memberships where user_id=p_apple_user_id)
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
  return jsonb_build_object('athlete_id',target_id,'display_name',target_name,'status','connected');
end $$;

drop trigger coaching_apple_link_revocation on public.coaching_apple_links;
drop function public.coaching_apple_link_revoke_access();
create or replace function public.coaching_apple_membership_guard()
returns trigger language plpgsql security definer set search_path=public,auth,pg_temp as $$
begin
  if new.status='active' and exists(select 1 from public.coaching_apple_links where apple_user_id=new.user_id) then
    raise exception 'apple_alias_is_not_a_second_owner' using errcode='42501';
  end if;
  return new;
end $$;
comment on table public.coaching_apple_links is 'Private dual-proof Apple aliases of a single canonical athlete owner. Athlete-only permission; no duplicate owner, coach privilege, commerce merge, tokens or email strings. Revocation follows the source membership.';

create or replace function public.record_session_from_form_impl(p_evidence_id text,p_status text,p_planned_session_id uuid default null,p_actual_distance numeric default null,p_distance_unit text default 'mi',p_duration_seconds integer default null,p_rpe integer default null,p_athlete_note text default null,p_symptoms text default null,p_surface text default null,p_conditions text default null,p_filed_at timestamptz default null,p_pieces jsonb default '[]'::jsonb,p_planned_session_version_id uuid default null)
returns uuid language plpgsql security definer set search_path=public,pg_temp as $$
declare athlete uuid; memberships integer; existing public.session_completions;
  new_id uuid; session_owner uuid; version_owner uuid;
begin
  select count(*) into memberships from public.coaching_athlete_memberships();
  if memberships=0 then raise exception 'Only an athlete files through this door'; end if;
  if memberships>1 then raise exception 'This account is an athlete on more than one record'; end if;
  select athlete_id into athlete from public.coaching_athlete_memberships();
  if coalesce(btrim(p_evidence_id),'')='' then raise exception 'A filing carries the receipt id it came from'; end if;
  if coalesce(p_status,'') not in('completed','partial','changed','skipped') then raise exception 'Unknown status: %',coalesce(p_status,'missing'); end if;
  if p_rpe is not null and (p_rpe<1 or p_rpe>10) then raise exception 'A reported effort is 1 to 10, not %',p_rpe; end if;
  if p_planned_session_id is null then
    if p_planned_session_version_id is not null then raise exception 'A session version cannot be filed without its planned session'; end if;
  else
    if p_planned_session_version_id is null then raise exception 'A planned FORM filing must carry the exact session version it rendered'; end if;
    select athlete_id into session_owner from public.planned_sessions where id=p_planned_session_id;
    if session_owner is distinct from athlete then raise exception 'That session belongs to a different athlete'; end if;
    select athlete_id into version_owner from public.planned_session_versions where id=p_planned_session_version_id and planned_session_id=p_planned_session_id;
    if version_owner is distinct from athlete then raise exception 'That session version does not belong to this athlete and session'; end if;
  end if;
  if coalesce(p_filed_at,now())>now()+interval '1 day' then raise exception 'A session cannot be filed in the future'; end if;
  select * into existing from public.session_completions where athlete_id=athlete and evidence_id=p_evidence_id;
  if existing.id is not null then
    if existing.planned_session_id is distinct from p_planned_session_id or existing.planned_session_version_id is distinct from p_planned_session_version_id then
      raise exception 'That receipt already belongs to a different prescription';
    end if;
    if (p_rpe is not null and existing.rpe is distinct from p_rpe)
       or (p_symptoms is not null and existing.symptoms is distinct from p_symptoms)
       or (p_athlete_note is not null and existing.athlete_note is distinct from p_athlete_note) then
      update public.session_completions set rpe=coalesce(p_rpe,rpe),symptoms=coalesce(p_symptoms,symptoms),athlete_note=coalesce(p_athlete_note,athlete_note),updated_at=now() where id=existing.id;
    end if;
    return existing.id;
  end if;
  insert into public.session_completions(athlete_id,planned_session_id,planned_session_version_id,status,actual_distance,distance_unit,duration_seconds,rpe,surface,conditions,athlete_note,symptoms,evidence_id,source,filed_by,filed_at)
  values(athlete,p_planned_session_id,p_planned_session_version_id,p_status,p_actual_distance,coalesce(p_distance_unit,'mi'),p_duration_seconds,p_rpe,p_surface,p_conditions,p_athlete_note,p_symptoms,p_evidence_id,'form',auth.uid(),coalesce(p_filed_at,now())) returning id into new_id;
  perform public.write_pieces(athlete,new_id,p_pieces);
  return new_id;
end $$;
