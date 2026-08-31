-- Operational authority is deliberately separate from ordinary coaching
-- membership. The migration seeds exactly one existing active coach, only when
-- production has exactly one, so no email or user id is embedded in source.

create table public.coaching_administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.coaching_administrator_events (
  id uuid primary key default gen_random_uuid(),
  administrator_user_id uuid references auth.users(id) on delete set null,
  prior_status text,
  resulting_status text not null check (resulting_status in ('active', 'revoked')),
  actor uuid references auth.users(id) on delete set null,
  reason text not null,
  at timestamptz not null default now()
);

alter table public.coaching_administrators enable row level security;
alter table public.coaching_administrator_events enable row level security;
revoke all on table public.coaching_administrators from public, anon, authenticated;
revoke all on table public.coaching_administrator_events from public, anon, authenticated;

create trigger coaching_administrator_events_immutable
  before update or delete on public.coaching_administrator_events
  for each row execute function public.prevent_immutable_change();

do $$
declare
  sole_coach uuid;
  coach_count integer;
begin
  select count(*), (array_agg(user_id))[1] into coach_count, sole_coach
    from (select distinct user_id from public.athlete_memberships where role = 'coach' and status = 'active') coaches;
  if coach_count <> 1 then
    raise exception 'protected administrator bootstrap requires exactly one active coach; found %', coach_count;
  end if;
  insert into public.coaching_administrators (user_id) values (sole_coach);
  insert into public.coaching_administrator_events
    (administrator_user_id, prior_status, resulting_status, actor, reason)
  values (sole_coach, null, 'active', sole_coach, 'initial protected administrator bootstrap');
end $$;

create or replace function public.is_active_coaching_administrator(p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path = public, pg_temp
as $$
  select p_user_id is not null and exists (
    select 1 from public.coaching_administrators
     where user_id = p_user_id and status = 'active'
  );
$$;

create or replace function public.set_coaching_administrator(
  p_user_id uuid,
  p_active boolean,
  p_reason text
) returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  previous text;
  resulting text := case when p_active then 'active' else 'revoked' end;
begin
  if not public.is_active_coaching_administrator(auth.uid()) then
    raise exception 'only an active protected administrator changes administrator access';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'administrator changes require a reason';
  end if;
  select status into previous from public.coaching_administrators where user_id = p_user_id for update;
  if previous is null then
    if not p_active then raise exception 'administrator is not active'; end if;
    insert into public.coaching_administrators (user_id, status) values (p_user_id, 'active');
  elsif previous <> resulting then
    update public.coaching_administrators set status = resulting, updated_at = now() where user_id = p_user_id;
  else
    return;
  end if;
  insert into public.coaching_administrator_events
    (administrator_user_id, prior_status, resulting_status, actor, reason)
  values (p_user_id, previous, resulting, auth.uid(), p_reason);
end;
$$;

create or replace function public.set_coaching_sync(p_enabled boolean, p_reason text)
returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if not public.is_active_coaching_administrator(auth.uid()) then
    raise exception 'only an active protected administrator changes coaching sync';
  end if;
  if not p_enabled and length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'pausing sync carries a reason the athletes can be told';
  end if;
  update public.coaching_sync_state
     set enabled = p_enabled, paused_reason = case when p_enabled then null else p_reason end,
         changed_by = auth.uid(), changed_at = now()
   where id;
  insert into public.coaching_sync_events (enabled, reason, actor) values (p_enabled, p_reason, auth.uid());
end;
$$;

create or replace function public.complete_account_deletion(p_request_id uuid, p_reason text)
returns jsonb
language plpgsql security definer set search_path = public, auth, pg_temp
as $$
declare request_row public.account_deletion_requests; athlete_ids uuid[];
begin
  if not public.is_active_coaching_administrator(auth.uid()) then
    raise exception 'A protected coaching administrator is required';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then raise exception 'A completion reason is required'; end if;
  select * into request_row from public.account_deletion_requests where id = p_request_id for update;
  if request_row.id is null then raise exception 'Deletion request not found'; end if;
  if request_row.status = 'completed' then return jsonb_build_object('request_id', request_row.id, 'status', 'completed'); end if;
  if request_row.status not in ('requested', 'processing') then raise exception 'Deletion request cannot be completed from %', request_row.status; end if;
  update public.account_deletion_requests set status = 'processing' where id = request_row.id and status = 'requested';
  if request_row.status = 'requested' then
    insert into public.account_deletion_events (request_id, prior_status, resulting_status, reason, actor)
    values (request_row.id, 'requested', 'processing', 'protected administrator began deletion', auth.uid());
  end if;
  select array_agg(athlete_id) into athlete_ids from public.athlete_memberships where user_id = request_row.user_id and role = 'athlete';
  delete from public.athletes where id = any(coalesce(athlete_ids, '{}'));
  update public.account_deletion_requests set status = 'completed', completed_at = now(), completion_reason = p_reason where id = request_row.id;
  insert into public.account_deletion_events (request_id, prior_status, resulting_status, reason, actor)
  values (request_row.id, 'processing', 'completed', p_reason, auth.uid());
  delete from public.profiles where user_id = request_row.user_id;
  delete from auth.users where id = request_row.user_id;
  return jsonb_build_object('request_id', request_row.id, 'status', 'completed');
end;
$$;

drop policy if exists sync_events_read on public.coaching_sync_events;
revoke all on table public.coaching_sync_events from public, anon, authenticated;
revoke all on function public.is_active_coaching_administrator(uuid) from public, anon, authenticated;
revoke all on function public.set_coaching_administrator(uuid, boolean, text) from public, anon;
grant execute on function public.set_coaching_administrator(uuid, boolean, text) to authenticated;
