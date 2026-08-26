-- What the athlete reported, kept apart from what the system noticed.
--
-- Jose stopped his second session of 25 August with stomach cramping, heat and
-- sharp chest discomfort. That is not a number, it does not belong in a pace
-- column, and it must not touch confidence: nothing about it says he lost
-- capability. It also must not disappear into a note nobody is routed to.
--
-- So it is its own object. An exception is a fact about a session that needs a
-- person, carrying who said it and in their words. coach_attention reads it, so
-- it reaches the queue without the queue having to invent it. Append only,
-- because an exception that can be edited afterwards is not a report.
--
-- Deliberately absent: severity, and any field that would invite a diagnosis. The
-- system does not decide how bad chest discomfort is. It carries the sentence to
-- the coach and gets out of the way.

create table public.session_exceptions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  completion_id uuid references public.session_completions(id) on delete cascade,
  planned_session_id uuid references public.planned_sessions(id) on delete cascade,
  -- Who this came from. An athlete's report and a rule's finding are different
  -- kinds of fact and are never flattened into one.
  source text not null check (source in ('athlete_reported', 'coach_observed', 'system_detected')),
  kind text not null check (kind in ('symptom', 'stopped_early', 'context', 'evidence_gap')),
  -- Their words, not a summary of them.
  detail text not null check (length(btrim(detail)) > 0),
  status text not null default 'open' check (status in ('open', 'reviewed', 'closed')),
  raised_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint exception_names_a_session check (completion_id is not null or planned_session_id is not null)
);

create index session_exceptions_open_idx
  on public.session_exceptions (athlete_id, status, created_at desc);
create index session_exceptions_completion_idx
  on public.session_exceptions (completion_id);

alter table public.session_exceptions enable row level security;

create policy exceptions_member_read on public.session_exceptions
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy exceptions_coach_insert on public.session_exceptions
  for insert to authenticated with check (public.is_coach_member(athlete_id));
-- Status is the one thing that moves, so an exception can be worked through
-- without the report itself ever changing.
create policy exceptions_coach_update on public.session_exceptions
  for update to authenticated
  using (public.is_coach_member(athlete_id)) with check (public.is_coach_member(athlete_id));

create or replace function public.session_exception_detail_is_immutable()
returns trigger language plpgsql as $$
begin
  if new.detail is distinct from old.detail
     or new.source is distinct from old.source
     or new.completion_id is distinct from old.completion_id then
    raise exception 'an exception records what was reported; only its status may change';
  end if;
  return new;
end $$;

create trigger session_exceptions_report_is_fixed
  before update on public.session_exceptions
  for each row execute function public.session_exception_detail_is_immutable();

comment on table public.session_exceptions is
  'A fact about a session that needs a person. Carries the source and the verbatim report, never a severity and never a diagnosis. Read by coach_attention. Confidence never reads it: a symptom is context, not evidence that capability was lost.';

-- ── The queue picks it up ───────────────────────────────────────────────────
--
-- Appended to the existing view rather than replacing its logic. Priority 5 puts
-- an open athlete report above the recovery flag, because someone telling you
-- their chest hurt outranks a number that looks wrong.

create or replace view public.coach_attention
with (security_invoker = true) as

select
  e.athlete_id,
  'athlete_report'::text as kind,
  5                      as priority,
  case e.kind
    when 'symptom' then 'Reported something during the session'
    when 'stopped_early' then 'Stopped before the end'
    when 'evidence_gap' then 'Evidence is missing'
    else 'Context worth reading'
  end::text              as title,
  e.detail::text         as summary,
  coalesce(e.completion_id, e.planned_session_id) as subject_id,
  case when e.completion_id is not null then 'completion' else 'planned_session' end::text as subject_kind,
  e.created_at           as occurred_at
from public.session_exceptions e
where e.status = 'open' and e.source = 'athlete_reported'

union all

select
  c.athlete_id,
  'recovery_flag'::text  as kind,
  10                     as priority,
  'Recovery did not settle'::text as title,
  ('The next day was not normal after ' ||
    coalesce(to_char(c.actual_distance, 'FM999999.0') || ' ' || coalesce(c.distance_unit, ''), c.status)
  )::text                as summary,
  c.id                   as subject_id,
  'completion'::text     as subject_kind,
  c.filed_at             as occurred_at
from public.session_completions c
where c.recovered_next_day is false

union all

select
  t.athlete_id, 'authored', 15, t.title, t.summary, t.id, 'task', t.created_at
from public.coach_tasks t
where t.resolved_at is null
  and t.state in ('needs_you', 'ready_to_publish', 'plan_changed')

union all

select
  c.athlete_id, 'unread_session', 20,
  'Waiting on your reply',
  (initcap(c.status) ||
    coalesce(' · ' || to_char(c.actual_distance, 'FM999999.0') || ' ' || coalesce(c.distance_unit, ''), '')
  )::text,
  c.id, 'completion', c.filed_at
from public.session_completions c
where c.recovered_next_day is distinct from false
  and not exists (
    select 1
    from public.read_completions rc
    join public.reads r on r.id = rc.read_id
    where rc.completion_id = c.id
      and r.delivery_state in ('published', 'delivered_externally')
  )

union all

select
  p.athlete_id, 'missing_direction', 30,
  'No instructions yet',
  (p.day_label || ' is due without instructions')::text,
  p.id, 'planned_session',
  (p.scheduled_on::timestamptz)
from public.planned_sessions p
where p.state = 'published'
  and p.scheduled_on is not null
  and p.scheduled_on <= current_date + 2;

do $$
declare bad integer;
begin
  select count(*) into bad from pg_trigger
   where tgname = 'session_exceptions_report_is_fixed' and not tgisinternal;
  if bad <> 1 then raise exception 'the report is editable; only status may change'; end if;
  select count(*) into bad from pg_views where schemaname='public' and viewname='coach_attention';
  if bad <> 1 then raise exception 'coach_attention did not survive'; end if;
end $$;
