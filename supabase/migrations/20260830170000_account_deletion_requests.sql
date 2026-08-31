-- Account deletion is a two-phase server workflow. The athlete requests it with
-- their authenticated session; access ends in the same transaction. A coach who
-- is actively assigned to that athlete completes the irreversible server erasure
-- later. The durable audit deliberately keeps no session content or reusable
-- identity once completion has removed the auth user.

create table public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  requested_at timestamptz not null default now(),
  status text not null default 'requested'
    check (status in ('requested', 'processing', 'completed', 'cancelled')),
  completed_at timestamptz,
  completion_reason text
);

create unique index account_deletion_one_open_request
  on public.account_deletion_requests (user_id)
  where status in ('requested', 'processing');

create table public.account_deletion_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.account_deletion_requests(id) on delete cascade,
  prior_status text,
  resulting_status text not null check (resulting_status in ('requested', 'processing', 'completed', 'cancelled')),
  reason text,
  actor uuid references auth.users(id) on delete set null,
  at timestamptz not null default now()
);

alter table public.account_deletion_requests enable row level security;
alter table public.account_deletion_events enable row level security;

create trigger account_deletion_events_immutable
  before update or delete on public.account_deletion_events
  for each row execute function public.prevent_immutable_change();

create or replace function public.request_account_deletion()
returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  caller uuid := auth.uid();
  request_id uuid;
begin
  if caller is null then
    raise exception 'A signed-in account is required';
  end if;

  select id into request_id
    from public.account_deletion_requests
   where user_id = caller and status in ('requested', 'processing')
   order by requested_at desc
   limit 1;

  if request_id is null then
    insert into public.account_deletion_requests (user_id)
    values (caller)
    returning id into request_id;

    insert into public.account_deletion_events
      (request_id, prior_status, resulting_status, reason, actor)
    values
      (request_id, null, 'requested', 'athlete requested account deletion', caller);
  end if;

  -- Revoke every coaching role immediately. Historical training data remains
  -- inaccessible while the operational deletion is completed under the published
  -- 72-hour support commitment.
  update public.athlete_memberships
     set status = 'inactive'
   where user_id = caller and status = 'active';

  return jsonb_build_object('request_id', request_id, 'status', 'requested');
end;
$$;

-- This is not an athlete RPC: a currently assigned coach completes the deletion
-- under server authority. The target comes from the request, never from a client
-- supplied athlete id. Deleting the athlete cascades all coaching rows, including
-- completions, pieces, evidence, plans, proposals, notes, attention and invites.
create or replace function public.complete_account_deletion(
  p_request_id uuid,
  p_reason text
) returns jsonb
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  request_row public.account_deletion_requests;
  athlete_ids uuid[];
begin
  if auth.uid() is null then
    raise exception 'A signed-in coach is required';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'A completion reason is required';
  end if;

  select * into request_row
    from public.account_deletion_requests
   where id = p_request_id
   for update;
  if request_row.id is null then
    raise exception 'Deletion request not found';
  end if;
  if request_row.status = 'completed' then
    return jsonb_build_object('request_id', request_row.id, 'status', 'completed');
  end if;
  if request_row.status not in ('requested', 'processing') then
    raise exception 'Deletion request cannot be completed from %', request_row.status;
  end if;
  if not exists (
    select 1
      from public.athlete_memberships coach
      join public.athlete_memberships athlete
        on athlete.athlete_id = coach.athlete_id
     where coach.user_id = auth.uid()
       and coach.role = 'coach' and coach.status = 'active'
       and athlete.user_id = request_row.user_id
       and athlete.role = 'athlete'
  ) then
    raise exception 'Only the athlete''s active coach may complete deletion';
  end if;

  update public.account_deletion_requests
     set status = 'processing'
   where id = request_row.id and status = 'requested';
  if request_row.status = 'requested' then
    insert into public.account_deletion_events
      (request_id, prior_status, resulting_status, reason, actor)
    values (request_row.id, 'requested', 'processing', 'coach began deletion', auth.uid());
  end if;

  select array_agg(athlete_id) into athlete_ids
    from public.athlete_memberships
   where user_id = request_row.user_id and role = 'athlete';

  delete from public.athletes where id = any(coalesce(athlete_ids, '{}'));

  update public.account_deletion_requests
     set status = 'completed',
         completed_at = now(),
         completion_reason = p_reason
   where id = request_row.id;
  insert into public.account_deletion_events
    (request_id, prior_status, resulting_status, reason, actor)
  values (request_row.id, 'processing', 'completed', p_reason, auth.uid());

  -- Remove the account's linkage only after the durable completion audit exists.
  delete from public.profiles where user_id = request_row.user_id;
  delete from auth.users where id = request_row.user_id;

  return jsonb_build_object('request_id', request_row.id, 'status', 'completed');
end;
$$;

revoke all on table public.account_deletion_requests from public, anon, authenticated;
revoke all on table public.account_deletion_events from public, anon, authenticated;
grant select on table public.account_deletion_requests to authenticated;
revoke all on function public.request_account_deletion() from public, anon;
grant execute on function public.request_account_deletion() to authenticated;
revoke all on function public.complete_account_deletion(uuid, text) from public, anon;
grant execute on function public.complete_account_deletion(uuid, text) to authenticated;

comment on table public.account_deletion_requests is
  'Durable deletion state. Access ends immediately; server coaching records are erased within 30 days. Completion leaves only non-content audit metadata.';
