-- The report is fixed; the workflow around it is a ledger.
--
-- 20260829260000 was applied before it was ready, by me: db push takes every
-- pending file and I left a held one on disk. It carried no rows, so nothing an
-- athlete said was written and this reshapes an empty table rather than migrating
-- data. It is dropped and rebuilt rather than patched, because the shape of the
-- thing changes and there is nothing to preserve.
--
-- What was wrong: status was updated in place, so an "append only" report could
-- still be walked through states with no record of who did it or why. And source
-- conflated two different facts: whose words these are, and who typed them in.
-- Jose reported the chest discomfort; Brice or an agent recorded it. Both belong.
--
-- Idempotency is the third thing. The router that turns a filing into an
-- exception will be retried, and a retry must not put the same report in the
-- queue twice.

drop table if exists public.session_exceptions cascade;
drop function if exists public.session_exception_detail_is_immutable();

create table public.session_exceptions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  completion_id uuid references public.session_completions(id) on delete cascade,
  planned_session_id uuid references public.planned_sessions(id) on delete cascade,
  -- Whose fact this is. Never who entered it.
  source text not null check (source in ('athlete_reported', 'coach_observed', 'system_detected')),
  -- Who entered it. An athlete's report recorded by the coach is still the
  -- athlete's report, and the record says both.
  recorded_by uuid references auth.users(id) on delete set null,
  kind text not null check (kind in ('symptom', 'stopped_early', 'context', 'evidence_gap')),
  -- Their words, not a summary of them. No severity field and no diagnosis
  -- field: the system does not decide how bad chest discomfort is.
  detail text not null check (length(btrim(detail)) > 0),
  -- Stable reference to the thing that caused this. A retry of the router
  -- computes the same key and is rejected rather than queued twice.
  evidence_key text not null check (length(btrim(evidence_key)) > 0),
  created_at timestamptz not null default now(),
  constraint exception_names_a_session
    check (completion_id is not null or planned_session_id is not null),
  constraint exception_is_idempotent unique (athlete_id, evidence_key)
);

create index session_exceptions_athlete_idx on public.session_exceptions (athlete_id, created_at desc);
create index session_exceptions_completion_idx on public.session_exceptions (completion_id);

-- Append only in the strict sense: no update policy and no delete policy exist,
-- so the report cannot be edited by anyone through the API.
alter table public.session_exceptions enable row level security;
create policy exceptions_member_read on public.session_exceptions
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy exceptions_coach_insert on public.session_exceptions
  for insert to authenticated with check (public.is_coach_member(athlete_id));

create trigger session_exceptions_immutable
  before update or delete on public.session_exceptions
  for each row execute function public.prevent_immutable_change();

-- Workflow lives here, and every move names who made it and why.
create table public.session_exception_status_changes (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  exception_id uuid not null references public.session_exceptions(id) on delete cascade,
  previous_status text not null check (previous_status in ('open', 'reviewed', 'closed')),
  resulting_status text not null check (resulting_status in ('open', 'reviewed', 'closed')),
  reason text not null check (length(btrim(reason)) > 0),
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint status_actually_changed check (previous_status <> resulting_status)
);

create index exception_status_changes_idx
  on public.session_exception_status_changes (exception_id, created_at desc);

alter table public.session_exception_status_changes enable row level security;
create policy exception_status_read on public.session_exception_status_changes
  for select to authenticated using (public.can_read_athlete(athlete_id));
-- Review and closure are the coach's, and only the coach's.
create policy exception_status_coach_insert on public.session_exception_status_changes
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and changed_by = auth.uid());

create trigger exception_status_changes_immutable
  before update or delete on public.session_exception_status_changes
  for each row execute function public.prevent_immutable_change();

-- Current status is the newest change, and open until something says otherwise.
create or replace view public.session_exception_state
with (security_invoker = true) as
select e.*,
       coalesce((select s.resulting_status
                   from public.session_exception_status_changes s
                  where s.exception_id = e.id
                  order by s.created_at desc, s.id desc
                  limit 1), 'open') as status
  from public.session_exceptions e;

grant select on public.session_exception_state to authenticated;

-- ── The sanctioned way in ───────────────────────────────────────────────────
--
-- Not an insert from a migration and not a raw insert from a client. A retry
-- returns the id it made the first time, so the router is safe to run again.

create or replace function public.raise_session_exception(
  p_athlete_id uuid, p_source text, p_kind text, p_detail text,
  p_evidence_key text, p_completion_id uuid default null,
  p_planned_session_id uuid default null
) returns uuid language plpgsql security invoker as $$
declare existing uuid; created uuid;
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'only a coach on this athlete may record an exception';
  end if;

  select id into existing from public.session_exceptions
   where athlete_id = p_athlete_id and evidence_key = p_evidence_key;
  if existing is not null then return existing; end if;

  insert into public.session_exceptions
    (athlete_id, completion_id, planned_session_id, source, recorded_by, kind, detail, evidence_key)
  values (p_athlete_id, p_completion_id, p_planned_session_id, p_source, auth.uid(),
          p_kind, p_detail, p_evidence_key)
  returning id into created;
  return created;
end $$;

create or replace function public.set_exception_status(
  p_exception_id uuid, p_status text, p_reason text
) returns void language plpgsql security invoker as $$
declare owner_id uuid; current_status text;
begin
  select e.athlete_id, s.status into owner_id, current_status
    from public.session_exception_state s
    join public.session_exceptions e on e.id = s.id
   where s.id = p_exception_id;
  if owner_id is null then raise exception 'no such exception'; end if;
  if not public.is_coach_member(owner_id) then
    raise exception 'only a coach on this athlete may review an exception';
  end if;
  insert into public.session_exception_status_changes
    (athlete_id, exception_id, previous_status, resulting_status, reason, changed_by)
  values (owner_id, p_exception_id, current_status, p_status, p_reason, auth.uid());
end $$;

revoke all on function public.raise_session_exception(uuid, text, text, text, text, uuid, uuid) from public;
grant execute on function public.raise_session_exception(uuid, text, text, text, text, uuid, uuid) to authenticated;
revoke all on function public.set_exception_status(uuid, text, text) from public;
grant execute on function public.set_exception_status(uuid, text, text) to authenticated;

comment on table public.session_exceptions is
  'A fact about a session that needs a person, immutable once recorded. source is whose fact it is; recorded_by is who entered it. evidence_key makes the router idempotent. No severity and no diagnosis: the system carries the sentence to the coach and gets out of the way. Confidence never reads this table.';

-- ── The queue, reading current status ───────────────────────────────────────

create or replace view public.coach_attention
with (security_invoker = true) as

select
  e.athlete_id, 'athlete_report'::text as kind, 5 as priority,
  case e.kind
    when 'symptom' then 'Reported something during the session'
    when 'stopped_early' then 'Stopped before the end'
    when 'evidence_gap' then 'Evidence is missing'
    else 'Context worth reading'
  end::text as title,
  e.detail::text as summary,
  coalesce(e.completion_id, e.planned_session_id) as subject_id,
  case when e.completion_id is not null then 'completion' else 'planned_session' end::text as subject_kind,
  e.created_at as occurred_at
from public.session_exception_state e
where e.status = 'open' and e.source = 'athlete_reported'

union all
select c.athlete_id, 'recovery_flag'::text, 10,
  'Recovery did not settle'::text,
  ('The next day was not normal after ' ||
    coalesce(to_char(c.actual_distance, 'FM999999.0') || ' ' || coalesce(c.distance_unit, ''), c.status))::text,
  c.id, 'completion'::text, c.filed_at
from public.session_completions c where c.recovered_next_day is false

union all
select t.athlete_id, 'authored', 15, t.title, t.summary, t.id, 'task', t.created_at
from public.coach_tasks t
where t.resolved_at is null and t.state in ('needs_you', 'ready_to_publish', 'plan_changed')

union all
select c.athlete_id, 'unread_session', 20, 'Waiting on your reply',
  (initcap(c.status) || coalesce(' · ' || to_char(c.actual_distance, 'FM999999.0') || ' ' || coalesce(c.distance_unit, ''), ''))::text,
  c.id, 'completion', c.filed_at
from public.session_completions c
where c.recovered_next_day is distinct from false
  and not exists (
    select 1 from public.read_completions rc
    join public.reads r on r.id = rc.read_id
    where rc.completion_id = c.id and r.delivery_state in ('published', 'delivered_externally'))

union all
select p.athlete_id, 'missing_direction', 30, 'No instructions yet',
  (p.day_label || ' is due without instructions')::text,
  p.id, 'planned_session', (p.scheduled_on::timestamptz)
from public.planned_sessions p
where p.state = 'published' and p.scheduled_on is not null
  and p.scheduled_on <= current_date + 2;

do $$
declare bad integer;
begin
  select count(*) into bad from pg_policies
   where schemaname='public' and tablename='session_exceptions' and cmd in ('UPDATE','DELETE');
  if bad > 0 then raise exception 'the report is editable through % policies', bad; end if;

  select count(*) into bad from pg_constraint where conname = 'exception_is_idempotent';
  if bad <> 1 then raise exception 'the idempotency constraint is missing'; end if;

  select count(*) into bad from pg_views where schemaname='public' and viewname='coach_attention';
  if bad <> 1 then raise exception 'coach_attention did not survive'; end if;
end $$;
