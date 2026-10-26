-- FORM Training Together · Phase 2 backend, staged behind FORM Curated.
-- The coach is the connector. No athlete can browse another athlete's plan,
-- location, availability, identity or message through these tables/functions.

-- A row exists only after the athlete has explicitly opted into matching.
-- This is their preferred TRAINING area, never an inferred home address,
-- device location, GPS coordinate or Strava start point.
create table public.form_match_profiles (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  training_city text not null check (length(btrim(training_city)) between 2 and 80),
  training_area text not null check (length(btrim(training_area)) between 2 and 80),
  preferred_time text not null check (preferred_time in ('early','morning','midday','evening','flexible')),
  lanes text[] not null check (
    cardinality(lanes) between 1 and 5 and
    lanes <@ array['easy','long_run','speed','strength','yoga']::text[]
  ),
  consented_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index form_match_profiles_city on public.form_match_profiles (lower(training_city));

-- An athlete may ask FORM to help find company without naming or seeing peers.
create table public.form_match_requests (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  on_date date not null,
  lane text not null check (lane in ('easy','long_run','speed','strength','yoga')),
  note text not null default '' check (length(note) <= 160),
  created_at timestamptz not null default now(),
  unique (athlete_id,on_date,lane)
);
create index form_match_requests_date on public.form_match_requests (on_date);

-- Every introduction is mediated by the coach. No contact details are
-- exchanged or published automatically, even if both athletes select yes.
create table public.form_match_introductions (
  id uuid primary key default gen_random_uuid(),
  first_athlete_id uuid not null references public.athletes(id) on delete cascade,
  second_athlete_id uuid not null references public.athletes(id) on delete cascade,
  on_date date not null,
  lane text not null check (lane in ('easy','long_run','speed','strength','yoga')),
  note text not null default '' check (length(note) <= 160),
  proposed_by uuid not null references auth.users(id),
  proposed_at timestamptz not null default now(),
  first_answer boolean,
  second_answer boolean,
  first_replied_at timestamptz,
  second_replied_at timestamptz,
  connected_at timestamptz,
  closed_at timestamptz,
  constraint form_match_pair_order check (first_athlete_id < second_athlete_id),
  unique (first_athlete_id,second_athlete_id,on_date,lane)
);
create index form_match_introductions_first on public.form_match_introductions(first_athlete_id,on_date);
create index form_match_introductions_second on public.form_match_introductions(second_athlete_id,on_date);

alter table public.form_match_profiles enable row level security;
alter table public.form_match_requests enable row level security;
alter table public.form_match_introductions enable row level security;
revoke all on public.form_match_profiles from public,anon,authenticated;
revoke all on public.form_match_requests from public,anon,authenticated;
revoke all on public.form_match_introductions from public,anon,authenticated;

-- Owner resolver. A coach-only account cannot impersonate an athlete. If the
-- account has multiple athlete memberships, it must be resolved explicitly
-- in a future account-selector flow; this MVP safely refuses ambiguity.
create or replace function public.form_match_own_athlete()
returns uuid language plpgsql stable security definer set search_path = '' as $$
declare account_id uuid := (select auth.uid()); mine uuid; total integer;
begin
  if account_id is null then return null; end if;
  select count(distinct m.athlete_id) into total
  from public.athlete_memberships m join public.athletes a on a.id=m.athlete_id and a.active
  where m.user_id=account_id and m.role='athlete' and m.status='active';
  if total<>1 then return null; end if;
  select m.athlete_id into mine from public.athlete_memberships m
  join public.athletes a on a.id=m.athlete_id and a.active
  where m.user_id=account_id and m.role='athlete' and m.status='active' limit 1;
  return mine;
end $$;

-- Athlete-controlled, explicit opt in. Training area is supplied, not derived.
create or replace function public.form_match_profile_set(
  p_city text,p_area text,p_preferred_time text,p_lanes text[])
returns void language plpgsql security definer set search_path = '' as $$
declare mine uuid := public.form_match_own_athlete();
begin
  if mine is null then raise exception 'athlete_account_required' using errcode='42501'; end if;
  if p_city is null or p_area is null or p_preferred_time is null or p_lanes is null then
    raise exception 'choose_training_area_and_preferences';
  end if;
  insert into public.form_match_profiles(athlete_id,training_city,training_area,preferred_time,lanes)
  values(mine,btrim(p_city),btrim(p_area),p_preferred_time,
    (select array_agg(distinct lane order by lane) from unnest(p_lanes) as x(lane)))
  on conflict(athlete_id) do update set
    training_city=excluded.training_city,training_area=excluded.training_area,
    preferred_time=excluded.preferred_time,lanes=excluded.lanes,updated_at=now();
end $$;

create or replace function public.form_match_opt_out()
returns void language plpgsql security definer set search_path = '' as $$
declare mine uuid := public.form_match_own_athlete();
begin
  if mine is null then raise exception 'athlete_account_required' using errcode='42501'; end if;
  delete from public.form_match_profiles where athlete_id=mine;
  delete from public.form_match_requests where athlete_id=mine;
  update public.form_match_introductions set closed_at=coalesce(closed_at,now())
  where (first_athlete_id=mine or second_athlete_id=mine) and closed_at is null;
end $$;

-- No browsing: the athlete sees only their own location/preferences and own
-- FORM-mediated invitations or partner-search requests.
create or replace function public.form_match_my()
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare mine uuid := public.form_match_own_athlete(); profile jsonb; requests jsonb; introductions jsonb;
begin
  if mine is null then return jsonb_build_object('enabled',false,'requests','[]'::jsonb,'introductions','[]'::jsonb); end if;
  select jsonb_build_object('city',p.training_city,'area',p.training_area,
    'preferred_time',p.preferred_time,'lanes',p.lanes,'consented_at',p.consented_at)
  into profile from public.form_match_profiles p where p.athlete_id=mine;
  if profile is null then
    return jsonb_build_object('enabled',false,'requests','[]'::jsonb,'introductions','[]'::jsonb);
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'date',r.on_date,'lane',r.lane,'note',r.note
  ) order by r.on_date),'[]'::jsonb) into requests
  from public.form_match_requests r where r.athlete_id=mine and r.on_date>=current_date;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,'date',i.on_date,'lane',i.lane,'note',i.note,
    'my_answer',case when i.first_athlete_id=mine then i.first_answer else i.second_answer end,
    'status',case when i.closed_at is not null then 'closed'
      when i.connected_at is not null then 'connected'
      when i.first_answer=true and i.second_answer=true then 'ready_for_form'
      when i.first_answer=false or i.second_answer=false then 'declined'
      else 'awaiting_replies' end,
    -- No peer identity before both say yes AND the coach closes the loop.
    'partner_name',case when i.connected_at is not null and i.closed_at is null
      and i.first_answer=true and i.second_answer=true and profile is not null
      then (select a.first_name from public.athletes a where a.id=
        case when i.first_athlete_id=mine then i.second_athlete_id else i.first_athlete_id end)
      else null end
  ) order by i.on_date),'[]'::jsonb) into introductions
  from public.form_match_introductions i
  where (i.first_athlete_id=mine or i.second_athlete_id=mine) and i.on_date>=current_date-interval '1 day';
  return jsonb_build_object('enabled',profile is not null,'profile',profile,
    'requests',requests,'introductions',introductions);
end $$;

create or replace function public.form_match_request(
  p_on_date date,p_lane text,p_note text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare mine uuid := public.form_match_own_athlete(); result uuid;
begin
  if mine is null or not exists(select 1 from public.form_match_profiles where athlete_id=mine) then
    raise exception 'matching_opt_in_required' using errcode='42501';
  end if;
  if p_on_date is null or p_on_date < current_date or p_on_date > current_date+45
    or p_lane not in ('easy','long_run','speed','strength','yoga') or length(coalesce(p_note,''))>160 then
    raise exception 'invalid_request_date_or_lane';
  end if;
  if not exists(select 1 from public.form_match_profiles p
    where p.athlete_id=mine and p_lane=any(p.lanes)) then
    raise exception 'choose_a_preferred_training_type';
  end if;
  insert into public.form_match_requests(athlete_id,on_date,lane,note)
  values(mine,p_on_date,p_lane,coalesce(p_note,''))
  on conflict(athlete_id,on_date,lane) do update set note=excluded.note
  returning id into result;
  return result;
end $$;

create or replace function public.form_match_request_cancel(p_request_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare mine uuid := public.form_match_own_athlete();
begin
  if mine is null then raise exception 'athlete_account_required' using errcode='42501'; end if;
  delete from public.form_match_requests where id=p_request_id and athlete_id=mine;
end $$;

-- Conservative candidate search for *Brice only*. It intentionally excludes
-- speed workouts and miscellaneous key sessions because matching distances
-- alone would make an unsafe coaching assumption. No candidate goes to peers.
create or replace function public.form_match_coach_candidates(
  p_on_date date,p_limit integer default 50)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare results jsonb;
begin
  perform public.form_miami_ensure_coach();
  if p_on_date is null or p_on_date<current_date or p_on_date>current_date+45
    or p_limit not between 1 and 100 then raise exception 'invalid_date_or_limit'; end if;
  with normalized as (
    select s.athlete_id,a.display_name,a.target_event,p.training_city,p.training_area,p.preferred_time,p.lanes,
      case when s.role='easy' then 'easy'
        when s.role='key' and v.title ~* '(long run|long aerobic)' then 'long_run'
        else null end as lane,
      case when lower(coalesce(v.distance_unit,'mi')) in ('km','kilometer','kilometers')
        then v.prescribed_distance * 0.621371 else v.prescribed_distance end as miles
    from public.planned_sessions s
    join public.athletes a on a.id=s.athlete_id and a.active
    join public.form_match_profiles p on p.athlete_id=s.athlete_id
    join lateral (
      select v.title,v.prescribed_distance,v.distance_unit
      from public.planned_session_versions v where v.planned_session_id=s.id
      order by v.version_number desc,v.created_at desc limit 1
    ) v on true
    where s.scheduled_on=p_on_date and s.state='published'
      and public.is_coach_member(s.athlete_id)
  ), eligible as (
    select distinct on (athlete_id,lane) * from normalized
    where lane is not null and miles is not null and miles>0
      and lane=any(lanes)
    order by athlete_id,lane,miles desc
  ), matches as (
    select a.athlete_id first_id,b.athlete_id second_id,a.display_name first_name,b.display_name second_name,
      a.lane,round(a.miles,1) first_miles,round(b.miles,1) second_miles,
      round(abs(a.miles-b.miles),1) distance_gap_miles,
      a.training_city city,
      (lower(a.training_area)=lower(b.training_area)) same_training_area,
      (a.target_event is not null and b.target_event is not null
        and lower(btrim(a.target_event))=lower(btrim(b.target_event))) same_target_event,
      (case when lower(a.training_area)=lower(b.training_area) then 100 else 70 end
        - (abs(a.miles-b.miles)*5)::integer) ranking
    from eligible a join eligible b on a.athlete_id<b.athlete_id
      and lower(a.training_city)=lower(b.training_city) and a.lane=b.lane
      and abs(a.miles-b.miles)<=3
      and (a.preferred_time=b.preferred_time or a.preferred_time='flexible' or b.preferred_time='flexible')
    where not exists (
      select 1 from public.form_match_introductions i
      where i.first_athlete_id=a.athlete_id and i.second_athlete_id=b.athlete_id
        and i.on_date=p_on_date and i.lane=a.lane
    )
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'first_athlete_id',m.first_id,'second_athlete_id',m.second_id,
    'first_name',m.first_name,'second_name',m.second_name,
    'lane',m.lane,'date',p_on_date,'first_miles',m.first_miles,
    'second_miles',m.second_miles,'distance_gap_miles',m.distance_gap_miles,
    'city',m.city,'same_training_area',m.same_training_area,
    'same_target_event',m.same_target_event,
    'ranking',m.ranking,'pace_checked',false,'coach_review_required',true
  ) order by m.ranking desc,m.distance_gap_miles),'[]'::jsonb) into results
  from (select * from matches order by ranking desc,distance_gap_miles limit p_limit) m;
  return results;
end $$;

create or replace function public.form_match_coach_propose(
  p_first_athlete_id uuid,p_second_athlete_id uuid,p_on_date date,p_lane text,p_note text default '')
returns uuid language plpgsql security definer set search_path = '' as $$
declare first_id uuid;second_id uuid;result uuid;
begin
  perform public.form_miami_ensure_coach();
  if p_first_athlete_id is null or p_second_athlete_id is null or p_first_athlete_id=p_second_athlete_id
    or p_on_date is null or p_on_date<current_date or p_on_date>current_date+45
    or p_lane not in ('easy','long_run','speed','strength','yoga') or length(coalesce(p_note,''))>160 then
    raise exception 'invalid_introduction';
  end if;
  if not public.is_coach_member(p_first_athlete_id) or not public.is_coach_member(p_second_athlete_id)
    or not exists(select 1 from public.athletes a where a.id=p_first_athlete_id and a.active)
    or not exists(select 1 from public.athletes a where a.id=p_second_athlete_id and a.active)
    or not exists(select 1 from public.form_match_profiles where athlete_id=p_first_athlete_id)
    or not exists(select 1 from public.form_match_profiles p
      where p.athlete_id=p_second_athlete_id and p_lane=any(p.lanes))
    or not exists(select 1 from public.form_match_profiles p
      where p.athlete_id=p_first_athlete_id and p_lane=any(p.lanes)) then
    raise exception 'both_athletes_must_opt_in' using errcode='42501';
  end if;
  first_id:=least(p_first_athlete_id,p_second_athlete_id);
  second_id:=greatest(p_first_athlete_id,p_second_athlete_id);
  insert into public.form_match_introductions(
    first_athlete_id,second_athlete_id,on_date,lane,note,proposed_by)
  values(first_id,second_id,p_on_date,p_lane,coalesce(p_note,''),(select auth.uid()))
  on conflict(first_athlete_id,second_athlete_id,on_date,lane) do nothing
  returning id into result;
  if result is null then
    select id into result from public.form_match_introductions
    where first_athlete_id=first_id and second_athlete_id=second_id
      and on_date=p_on_date and lane=p_lane;
  end if;
  return result;
end $$;

create or replace function public.form_match_reply(p_introduction_id uuid,p_accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
declare mine uuid := public.form_match_own_athlete();
begin
  if mine is null or p_accept is null then raise exception 'athlete_account_required' using errcode='42501'; end if;
  if not exists(select 1 from public.form_match_profiles where athlete_id=mine) then
    raise exception 'matching_opt_in_required' using errcode='42501';
  end if;
  update public.form_match_introductions i set
    first_answer=case when i.first_athlete_id=mine then p_accept else i.first_answer end,
    second_answer=case when i.second_athlete_id=mine then p_accept else i.second_answer end,
    first_replied_at=case when i.first_athlete_id=mine then now() else i.first_replied_at end,
    second_replied_at=case when i.second_athlete_id=mine then now() else i.second_replied_at end,
    closed_at=case when p_accept=false then now() else i.closed_at end
  where i.id=p_introduction_id and (i.first_athlete_id=mine or i.second_athlete_id=mine)
    and i.closed_at is null and i.on_date>=current_date;
  if not found then raise exception 'invitation_not_available' using errcode='42501'; end if;
end $$;

create or replace function public.form_match_coach_connect(p_introduction_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  perform public.form_miami_ensure_coach();
  update public.form_match_introductions i set connected_at=coalesce(i.connected_at,now())
  where i.id=p_introduction_id and i.closed_at is null and i.on_date>=current_date
    and i.first_answer=true and i.second_answer=true
    and public.is_coach_member(i.first_athlete_id) and public.is_coach_member(i.second_athlete_id)
    and exists(select 1 from public.athletes a where a.id=i.first_athlete_id and a.active)
    and exists(select 1 from public.athletes a where a.id=i.second_athlete_id and a.active)
    and exists(select 1 from public.form_match_profiles p where p.athlete_id=i.first_athlete_id)
    and exists(select 1 from public.form_match_profiles p where p.athlete_id=i.second_athlete_id);
  if not found then raise exception 'both_athletes_must_agree' using errcode='42501'; end if;
end $$;

create or replace function public.form_match_coach_queue(
  p_limit integer default 100,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare requests jsonb;introductions jsonb;
begin
  perform public.form_miami_ensure_coach();
  if p_limit not between 1 and 200 or p_offset not between 0 and 100000 then
    raise exception 'invalid_page';
  end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,'athlete_id',r.athlete_id,'athlete_name',a.display_name,
    'date',r.on_date,'lane',r.lane,'note',r.note,
    'city',p.training_city,'area',p.training_area
  ) order by r.on_date),'[]'::jsonb) into requests
  from (
    select * from public.form_match_requests r
    where r.on_date>=current_date and public.is_coach_member(r.athlete_id)
    order by r.on_date,r.created_at,r.id limit p_limit offset p_offset
  ) r
  join public.athletes a on a.id=r.athlete_id
  join public.form_match_profiles p on p.athlete_id=r.athlete_id;
  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,'date',i.on_date,'lane',i.lane,
    'first_athlete_id',i.first_athlete_id,'second_athlete_id',i.second_athlete_id,
    'first_name',a.display_name,'second_name',b.display_name,
    'first_answer',i.first_answer,'second_answer',i.second_answer,
    'connected',i.connected_at is not null,'closed',i.closed_at is not null
  ) order by i.on_date),'[]'::jsonb) into introductions
  from (
    select * from public.form_match_introductions i
    where i.on_date>=current_date-interval '1 day'
      and public.is_coach_member(i.first_athlete_id)
      and public.is_coach_member(i.second_athlete_id)
    order by i.on_date,i.proposed_at,i.id limit p_limit offset p_offset
  ) i
  join public.athletes a on a.id=i.first_athlete_id
  join public.athletes b on b.id=i.second_athlete_id;
  return jsonb_build_object('requests',requests,'introductions',introductions,
    'limit',p_limit,'offset',p_offset);
end $$;

-- Functions are the only Data API contract; not one new table is directly
-- readable or writable by an authenticated client or anonymous visitor.
revoke all on function public.form_match_own_athlete() from public,anon,authenticated;
revoke all on function public.form_match_profile_set(text,text,text,text[]) from public,anon,authenticated;
revoke all on function public.form_match_opt_out() from public,anon,authenticated;
revoke all on function public.form_match_my() from public,anon,authenticated;
revoke all on function public.form_match_request(date,text,text) from public,anon,authenticated;
revoke all on function public.form_match_request_cancel(uuid) from public,anon,authenticated;
revoke all on function public.form_match_coach_candidates(date,integer) from public,anon,authenticated;
revoke all on function public.form_match_coach_propose(uuid,uuid,date,text,text) from public,anon,authenticated;
revoke all on function public.form_match_reply(uuid,boolean) from public,anon,authenticated;
revoke all on function public.form_match_coach_connect(uuid) from public,anon,authenticated;
revoke all on function public.form_match_coach_queue(integer,integer) from public,anon,authenticated;
grant execute on function public.form_match_profile_set(text,text,text,text[]) to authenticated;
grant execute on function public.form_match_opt_out() to authenticated;
grant execute on function public.form_match_my() to authenticated;
grant execute on function public.form_match_request(date,text,text) to authenticated;
grant execute on function public.form_match_request_cancel(uuid) to authenticated;
grant execute on function public.form_match_coach_candidates(date,integer) to authenticated;
grant execute on function public.form_match_coach_propose(uuid,uuid,date,text,text) to authenticated;
grant execute on function public.form_match_reply(uuid,boolean) to authenticated;
grant execute on function public.form_match_coach_connect(uuid) to authenticated;
grant execute on function public.form_match_coach_queue(integer,integer) to authenticated;
