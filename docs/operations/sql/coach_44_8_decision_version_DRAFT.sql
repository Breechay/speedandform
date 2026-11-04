-- DRAFT ONLY. Codex must generate a numbered migration and independently
-- verify FK, RLS, cross-athlete denial, idempotency and immutable history.
begin;

create table public.coach_decision_version_links (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references public.decisions(id),
  planned_session_version_id uuid not null references public.planned_session_versions(id),
  role text not null check (role in ('before','after')),
  reason text not null check (length(trim(reason)) between 1 and 2000),
  authored_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default now(),
  unique(decision_id,planned_session_version_id,role)
);
create index coach_decision_links_decision on public.coach_decision_version_links(decision_id,created_at desc);
alter table public.coach_decision_version_links enable row level security;
revoke all on public.coach_decision_version_links from public,anon,authenticated;
grant select,insert on public.coach_decision_version_links to authenticated;
grant all on public.coach_decision_version_links to service_role;

-- Strict cross-record identity even for a privileged writer. Existing version
-- and planned-session athlete IDs must agree with the linked decision.
create function public.coach_decision_link_identity_guard() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare valid boolean;
begin
  select (d.athlete_id=v.athlete_id and v.athlete_id=s.athlete_id)
    into valid from public.decisions d
    join public.planned_session_versions v on v.id=new.planned_session_version_id
    join public.planned_sessions s on s.id=v.planned_session_id
    where d.id=new.decision_id;
  if not coalesce(valid,false) then
    raise exception 'Decision, version and session must belong to the same athlete' using errcode='23514';
  end if;
  return new;
end $$;
revoke all on function public.coach_decision_link_identity_guard() from public,anon,authenticated;
create trigger coach_decision_link_identity before insert on public.coach_decision_version_links
  for each row execute function public.coach_decision_link_identity_guard();

create policy coach_decision_link_read on public.coach_decision_version_links
  for select to authenticated using (
    public.operating_console_owner() and exists (
      select 1 from public.decisions d where d.id=decision_id and public.is_coach_member(d.athlete_id)
    )
  );
create policy coach_decision_link_insert on public.coach_decision_version_links
  for insert to authenticated with check (
    authored_by=(select auth.uid()) and public.operating_console_owner() and exists (
      select 1 from public.decisions d where d.id=decision_id and public.is_coach_member(d.athlete_id)
    )
  );
commit;
