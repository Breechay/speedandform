-- A withdrawn session is a coach decision, not an empty template slot.
-- Routine template re-imports must not recreate it. Historical sessions and
-- filed completions are never deleted by this guard.

create table if not exists public.session_republication_approvals (
  id uuid primary key default gen_random_uuid(),
  withdrawn_session_id uuid not null references public.planned_sessions(id),
  athlete_id uuid not null references public.athletes(id),
  block_id uuid not null references public.training_blocks(id),
  scheduled_on date not null,
  reason text not null check (length(btrim(reason)) >= 15),
  approved_by uuid not null,
  approved_at timestamptz not null default now(),
  consumed_by_session_id uuid,
  consumed_at timestamptz,
  constraint session_republication_approval_consistent_consumption
    check ((consumed_by_session_id is null) = (consumed_at is null))
);

create unique index if not exists one_pending_session_republication_approval
  on public.session_republication_approvals(withdrawn_session_id)
  where consumed_at is null;

create index if not exists session_republication_approval_athlete_lookup
  on public.session_republication_approvals(athlete_id, block_id, scheduled_on);

create index if not exists withdrawn_session_publication_lookup
  on public.planned_sessions(athlete_id, scheduled_on, role)
  where state = 'cancelled' and withdrawn_at is not null;

alter table public.session_republication_approvals enable row level security;
revoke all on public.session_republication_approvals from anon, authenticated;
grant select on public.session_republication_approvals to authenticated;
create policy "coaches can read their reinstatement receipts"
  on public.session_republication_approvals for select to authenticated
  using (public.is_coach_member(athlete_id));

-- An override is a separate, explicit coach action. Merely republishing an old
-- plan version does not create approval, and the reason remains in the ledger.
create or replace function public.approve_withdrawn_session_republication(
  p_withdrawn_session_id uuid,
  p_reason text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  withdrawn record;
  v_block_id uuid;
  v_approval_id uuid;
begin
  select ps.* into withdrawn from public.planned_sessions ps
  where ps.id = p_withdrawn_session_id for update;

  if not found or withdrawn.state <> 'cancelled' or withdrawn.withdrawn_at is null then
    raise exception 'Select a previously withdrawn session for coach review';
  end if;
  if not public.is_coach_member(withdrawn.athlete_id) then
    raise exception 'Only an assigned coach may approve a withdrawn session';
  end if;
  if length(btrim(coalesce(p_reason, ''))) < 15 then
    raise exception 'Explain the change to the previous withdrawal in at least 15 characters';
  end if;
  select w.block_id into v_block_id from public.training_weeks w where w.id=withdrawn.week_id;
  if v_block_id is null or withdrawn.scheduled_on is null then
    raise exception 'A dated block is required for reinstatement';
  end if;

  insert into public.session_republication_approvals
    (withdrawn_session_id, athlete_id, block_id, scheduled_on, reason, approved_by)
  values (withdrawn.id, withdrawn.athlete_id, v_block_id,
          withdrawn.scheduled_on, btrim(p_reason), auth.uid())
  on conflict (withdrawn_session_id) where consumed_at is null do update
    set reason=excluded.reason, approved_by=excluded.approved_by, approved_at=now()
  returning id into v_approval_id;
  return v_approval_id;
end;
$$;

revoke all on function public.approve_withdrawn_session_republication(uuid,text) from public, anon;
grant execute on function public.approve_withdrawn_session_republication(uuid,text) to authenticated;

create or replace function public.guard_withdrawn_session_republication()
returns trigger
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  previous_withdrawal record;
  new_block_id uuid;
  approval_id uuid;
begin
  if new.state <> 'published' or new.scheduled_on is null then return new; end if;
  -- A change of key or state is the only possible reopening. Innocent metadata
  -- updates to an existing published session must continue to work.
  if tg_op = 'UPDATE' then
    if old.state = 'published'
      and (old.athlete_id, old.week_id, old.scheduled_on, old.role)
        is not distinct from (new.athlete_id, new.week_id, new.scheduled_on, new.role)
    then return new; end if;
  end if;

  select w.block_id into new_block_id from public.training_weeks w where w.id=new.week_id;
  if new_block_id is null then return new; end if;

  -- Administrative "Superseded by ..." entries are version-cutover history,
  -- not holds: the replacement may already be published. All other withdrawals
  -- keep their slot closed. A rest-day withdrawal protects every role, even if
  -- an importer renames the work from support to key/easy.
  select prior.id,prior.withdrawn_reason into previous_withdrawal
  from public.planned_sessions prior
  join public.training_weeks w on w.id=prior.week_id
  where prior.athlete_id=new.athlete_id
    and w.block_id=new_block_id
    and prior.scheduled_on=new.scheduled_on
    and prior.state='cancelled' and prior.withdrawn_at is not null
    and coalesce(prior.withdrawn_reason,'') !~* '^Superseded by '
    and (prior.role=new.role or prior.withdrawn_reason ~* '(^|[^a-z])rest([^a-z]|$)')
  order by prior.withdrawn_at desc,prior.id limit 1;
  if not found then return new; end if;

  select a.id into approval_id
  from public.session_republication_approvals a
  where a.withdrawn_session_id=previous_withdrawal.id
    and a.athlete_id=new.athlete_id
    and a.block_id=new_block_id
    and a.scheduled_on=new.scheduled_on
    and a.consumed_at is null
  for update;
  if approval_id is null then
    raise exception 'Coach review required: a session was withdrawn on this date. Approve an explicit reinstatement with a reason before publishing.'
      using errcode='P0001';
  end if;

  update public.session_republication_approvals
    set consumed_at=now(),consumed_by_session_id=new.id
  where id=approval_id;
  return new;
end;
$$;

drop trigger if exists guard_withdrawn_session_republication on public.planned_sessions;
create trigger guard_withdrawn_session_republication
before insert or update of state, athlete_id, week_id, scheduled_on, role
on public.planned_sessions
for each row execute function public.guard_withdrawn_session_republication();

revoke all on function public.guard_withdrawn_session_republication() from public, anon, authenticated;

comment on table public.session_republication_approvals is
  'Private one-time coach reinstatement receipt. A normal template republish cannot clear a withdrawn session.';
