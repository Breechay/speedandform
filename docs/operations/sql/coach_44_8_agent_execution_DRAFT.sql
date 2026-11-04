-- DRAFT ONLY. Do not apply directly. Codex must generate a numbered migration,
-- verify constraints/RLS against the actual schema, and run Supabase advisors.
begin;

create table public.coach_agent_execution_receipts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id),
  athlete_id uuid references public.athletes(id),
  run_id uuid not null,
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 200),
  lane text not null check (length(trim(lane)) between 1 and 100),
  requested_action text not null check (length(trim(requested_action)) between 1 and 2000),
  authority text not null check (length(trim(authority)) between 1 and 2000),
  owning_record_ids jsonb not null check (jsonb_typeof(owning_record_ids)='array'),
  source_read_at timestamptz,
  source_as_of timestamptz,
  action_taken text not null check (length(trim(action_taken)) between 1 and 4000),
  readback jsonb not null check (jsonb_typeof(readback)='object'),
  external_visibility jsonb not null check (jsonb_typeof(external_visibility)='object'),
  uncertainty text not null check (length(trim(uncertainty)) between 1 and 2000),
  status text not null check (status in ('observed','drafted','saved','published','delivered','native_verified','blocked')),
  created_at timestamptz not null default now(),
  unique(owner_id,idempotency_key),
  check (status not in ('saved','published','delivered','native_verified') or
    (readback->>'verified'='true' and nullif(readback->>'source_id','') is not null
      and nullif(readback->>'checked_at','') is not null)),
  check (status<>'delivered' or (external_visibility->>'delivered'='true' and
    nullif(external_visibility->>'evidence_id','') is not null)),
  check (status<>'native_verified' or (external_visibility->>'native_verified'='true' and
    nullif(external_visibility->>'evidence_id','') is not null))
);
create index coach_agent_exec_owner_recent on public.coach_agent_execution_receipts(owner_id,created_at desc);
create index coach_agent_exec_athlete_recent on public.coach_agent_execution_receipts(athlete_id,created_at desc) where athlete_id is not null;
alter table public.coach_agent_execution_receipts enable row level security;
revoke all on public.coach_agent_execution_receipts from public,anon,authenticated;
grant select,insert on public.coach_agent_execution_receipts to authenticated;
grant all on public.coach_agent_execution_receipts to service_role;
create policy coach_agent_exec_owner_read on public.coach_agent_execution_receipts
  for select to authenticated using (owner_id=(select auth.uid()) and public.operating_console_owner()
    and (athlete_id is null or public.is_coach_member(athlete_id)));
create policy coach_agent_exec_owner_insert on public.coach_agent_execution_receipts
  for insert to authenticated with check (owner_id=(select auth.uid()) and public.operating_console_owner()
    and (athlete_id is null or public.is_coach_member(athlete_id)));

-- No UPDATE/DELETE policy or grant. Database administrators are separately privileged;
-- application code must never use privileged credentials to impersonate the coach.
commit;
