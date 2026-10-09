-- Forge session state and the receipt's exact prescription.
--
-- Three things, all additive, all on top of objects that already exist in the live FORM Athlete
-- System (forge_strength_receipts and submit_forge_native_receipt come from the FORM-iOS native
-- receipt contract; planned_session_versions and planned_session_exercises from this repository):
--
--   1. A receipt can name the immutable session VERSION it was performed against, and the server
--      checks that version really belongs to that athlete. Old receipts and old clients are
--      untouched: no identity in the payload means no link, not an error.
--   2. forge_session_events: meaningful state transitions only (a workout opened, a workout left
--      mid-way). Append-only, idempotent by client event id, written through one validated RPC.
--      Not a stream of taps.
--   3. Read models for the Console, as security-invoker views so the existing row-level security
--      decides who sees what: where an athlete is (last opened, last completed, next session) and,
--      per receipt and movement, what was prescribed beside what was performed.
--
-- Prescription and progress stay separate. Nothing here edits a prescription, and where an athlete
-- is comes from what they did (events and receipts) read against the plan, never from a mutated plan.
begin;

do $$
begin
  if to_regclass('public.forge_strength_receipts') is null then
    raise exception 'forge_strength_receipts must exist (FORM-iOS native receipt contract) before this migration';
  end if;
  if to_regclass('public.planned_session_exercises') is null then
    raise exception 'planned_session_exercises must exist (structured strength migration) before this migration';
  end if;
end $$;

-- ── 1. A receipt names the version it was performed against ────────────────────────────────

alter table public.forge_strength_receipts
  add column planned_session_id uuid references public.planned_sessions(id),
  add column planned_session_version_id uuid references public.planned_session_versions(id);

create index forge_receipts_version_idx
  on public.forge_strength_receipts (planned_session_version_id) where planned_session_version_id is not null;
create index forge_receipts_session_idx
  on public.forge_strength_receipts (athlete_id, planned_session_id) where planned_session_id is not null;

-- Runs after the existing forge_native_receipt_before_insert validator (triggers fire in name
-- order), so the payload is already known to be well formed when this reads it.
create function public.forge_link_receipt_version()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  p jsonb := new.native_payload;
  sid uuid;
  vid uuid;
begin
  if p is null or not (p ? 'plannedSessionVersionId' or p ? 'plannedSessionId') then
    return new;   -- legacy summary writers and clients that predate version identity
  end if;
  begin
    sid := (p->>'plannedSessionId')::uuid;
    vid := (p->>'plannedSessionVersionId')::uuid;
  exception when others then
    raise exception 'Invalid planned version identity' using errcode = '22023';
  end;
  if sid is null or vid is null then
    raise exception 'A receipt names both the planned session and its version, or neither' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.planned_session_versions v
     where v.id = vid and v.planned_session_id = sid and v.athlete_id = new.athlete_id) then
    raise exception 'Receipt names a version that is not this athlete''s' using errcode = '22023';
  end if;
  new.planned_session_id := sid;
  new.planned_session_version_id := vid;
  return new;
end;
$$;
revoke all on function public.forge_link_receipt_version() from public, anon, authenticated;

create trigger forge_native_receipt_link_version
  before insert on public.forge_strength_receipts
  for each row execute function public.forge_link_receipt_version();

-- ── 2. Session state events ─────────────────────────────────────────────────────────────────

create table public.forge_session_events (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  -- The device's own id for the event: a retry sends the same one and stores nothing twice.
  event_id uuid not null,
  kind text not null check (kind in ('opened', 'left')),
  planned_session_id uuid not null references public.planned_sessions(id),
  planned_session_version_id uuid not null references public.planned_session_versions(id),
  program_id text not null check (length(btrim(program_id)) between 1 and 200),
  plan_week_number smallint not null check (plan_week_number between 1 and 52),
  plan_day_index smallint not null check (plan_day_index between 0 and 6),
  occurred_at timestamptz not null,
  -- Sets performed so far, for 'left'. Null for 'opened'.
  completed_set_count integer check (completed_set_count is null or completed_set_count between 0 and 200),
  consent_version text not null,
  submitted_by uuid not null,
  received_at timestamptz not null default now(),
  payload jsonb not null,
  unique (athlete_id, event_id)
);

create index forge_session_events_athlete_time_idx on public.forge_session_events (athlete_id, occurred_at desc);

alter table public.forge_session_events enable row level security;
revoke all on public.forge_session_events from public, anon, authenticated;
grant select on public.forge_session_events to authenticated;

-- Same visibility as receipts: the athlete and the coach on that athlete, nobody else.
create policy forge_events_read_related on public.forge_session_events
  for select to authenticated using (
    exists (select 1 from public.athlete_memberships m
             where m.athlete_id = forge_session_events.athlete_id
               and m.user_id = (select auth.uid()) and m.status = 'active'
               and m.role in ('athlete', 'coach')));

create trigger forge_session_events_immutable
  before update or delete on public.forge_session_events
  for each row execute function public.prevent_immutable_change();

create function public.submit_forge_session_event(p_athlete_id uuid, p_event jsonb, p_consent_version text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  eid uuid;
  k text;
  sid uuid;
  vid uuid;
  at_time timestamptz;
  wk integer;
  dy integer;
  sets integer;
  existing jsonb;
  inserted uuid;
begin
  -- Checked before anything else, and again on a replay: a revoked athlete cannot resend old events.
  if uid is null or not exists (
    select 1 from public.athlete_memberships m
     where m.athlete_id = p_athlete_id and m.user_id = uid and m.status = 'active' and m.role = 'athlete'
  ) then raise exception 'Active athlete membership required' using errcode = '42501'; end if;
  if p_consent_version is distinct from 'forge-coach-receipts-v1' then
    raise exception 'Explicit sharing consent required' using errcode = '22023';
  end if;
  if jsonb_typeof(p_event) is distinct from 'object' or octet_length(p_event::text) > 4096 then
    raise exception 'Invalid session event' using errcode = '22023';
  end if;

  begin
    eid := (p_event->>'id')::uuid;
    sid := (p_event->>'plannedSessionId')::uuid;
    vid := (p_event->>'plannedSessionVersionId')::uuid;
    wk := (p_event->>'planWeekNumber')::integer;
    dy := (p_event->>'planDayIndex')::integer;
    if coalesce(p_event->>'occurredAt', '') !~ 'T.*(Z|[+-][0-9]{2}:[0-9]{2})$' then
      raise exception 'timestamp';
    end if;
    at_time := (p_event->>'occurredAt')::timestamptz;
    sets := nullif(p_event->>'completedSetCount', '')::integer;
  exception when others then
    raise exception 'Invalid session event' using errcode = '22023';
  end;
  k := p_event->>'kind';
  if eid is null or sid is null or vid is null or k is null or k not in ('opened', 'left')
     or wk is null or dy is null
     or jsonb_typeof(p_event->'programId') is distinct from 'string'
     or length(btrim(p_event->>'programId')) not between 1 and 200
     or wk not between 1 and 52 or dy not between 0 and 6
     or (k = 'opened' and sets is not null)
     or (k = 'left' and (sets is null or sets not between 0 and 200)) then
    raise exception 'Invalid session event' using errcode = '22023';
  end if;
  -- A device clock that is wildly wrong is not evidence of when something happened.
  if not isfinite(at_time) or at_time > now() + interval '10 minutes' or at_time < now() - interval '45 days' then
    raise exception 'Implausible event time' using errcode = '22023';
  end if;
  if not exists (
    select 1 from public.planned_session_versions v
     where v.id = vid and v.planned_session_id = sid and v.athlete_id = p_athlete_id) then
    raise exception 'Event names a version that is not this athlete''s' using errcode = '22023';
  end if;

  insert into public.forge_session_events (
    athlete_id, event_id, kind, planned_session_id, planned_session_version_id, program_id,
    plan_week_number, plan_day_index, occurred_at, completed_set_count, consent_version, submitted_by, payload)
  values (p_athlete_id, eid, k, sid, vid, p_event->>'programId', wk, dy, at_time, sets, p_consent_version, uid, p_event)
  on conflict (athlete_id, event_id) do nothing
  returning id into inserted;

  if inserted is not null then
    return jsonb_build_object('eventId', eid, 'status', 'stored');
  end if;
  select payload into existing from public.forge_session_events where athlete_id = p_athlete_id and event_id = eid;
  if existing is distinct from p_event then
    raise exception 'Event already exists with different content' using errcode = '23505';
  end if;
  return jsonb_build_object('eventId', eid, 'status', 'already_stored');
end;
$$;
revoke all on function public.submit_forge_session_event(uuid, jsonb, text) from public, anon;
grant execute on function public.submit_forge_session_event(uuid, jsonb, text) to authenticated;

-- ── 3. Read models for the Console ──────────────────────────────────────────────────────────
--
-- security_invoker: these views read as the caller, so the policies on the underlying tables
-- (athlete, coach, nobody else) apply unchanged.

create view public.forge_athlete_state with (security_invoker = true) as
select
  a.id as athlete_id,
  lo.occurred_at as last_opened_at,
  lo.planned_session_id as last_opened_session_id,
  lo.planned_session_version_id as last_opened_version_id,
  lo.plan_week_number as last_opened_week,
  lo.plan_day_index as last_opened_day,
  ll.occurred_at as last_left_at,
  ll.completed_set_count as last_left_set_count,
  lc.completed_at as last_completed_at,
  lc.planned_session_id as last_completed_session_id,
  lc.planned_session_version_id as last_completed_version_id,
  lc.plan_week_number as last_completed_week,
  lc.plan_day_index as last_completed_day,
  (select count(*) from public.forge_strength_receipts r where r.athlete_id = a.id and r.native_payload is not null) as receipts_filed,
  nx.id as next_session_id,
  nx.scheduled_on as next_session_on
from public.athletes a
left join lateral (
  select e.* from public.forge_session_events e
   where e.athlete_id = a.id and e.kind = 'opened' order by e.occurred_at desc limit 1) lo on true
left join lateral (
  select e.* from public.forge_session_events e
   where e.athlete_id = a.id and e.kind = 'left' order by e.occurred_at desc limit 1) ll on true
left join lateral (
  select r.* from public.forge_strength_receipts r
   where r.athlete_id = a.id and r.native_payload is not null order by r.completed_at desc limit 1) lc on true
left join lateral (
  -- The earliest published session from today on that has no receipt filed against it.
  select ps.id, ps.scheduled_on from public.planned_sessions ps
   where ps.athlete_id = a.id and ps.state = 'published' and ps.scheduled_on is not null
     and ps.scheduled_on >= current_date
     and not exists (select 1 from public.forge_strength_receipts r
                      where r.athlete_id = a.id and r.planned_session_id = ps.id)
   order by ps.scheduled_on limit 1) nx on true;

-- Per receipt and movement: the work performed, beside the prescription it was performed against.
create view public.forge_receipt_movements with (security_invoker = true) as
select
  r.receipt_id,
  r.athlete_id,
  r.planned_session_id,
  r.planned_session_version_id,
  r.completed_at,
  r.session_name,
  r.plan_week_number,
  r.plan_day_index,
  s."movementId" as movement_id,
  min(s."movementName") as movement_name,
  count(*)::integer as performed_sets,
  jsonb_agg(jsonb_build_object(
    'set_index', s."setIndex", 'weight', s.weight, 'reps', s.reps, 'seconds', s.seconds, 'completed_at', s."completedAt")
    order by s."setIndex") as performed,
  e.position as prescribed_position,
  e.sets as prescribed_sets,
  e.rep_low, e.rep_high, e.rep_unit,
  e.target_seconds, e.target_seconds_high,
  e.laterality, e.side_word, e.instruction
from public.forge_strength_receipts r
cross join lateral jsonb_to_recordset(r.native_payload->'sets') as s(
  "movementId" text, "movementName" text, "setIndex" integer, weight numeric, reps integer,
  seconds integer, "completedAt" timestamptz)
left join public.planned_session_exercises e
  on e.version_id = r.planned_session_version_id and e.movement_id = s."movementId"
where r.native_payload is not null
group by r.receipt_id, r.athlete_id, r.planned_session_id, r.planned_session_version_id, r.completed_at,
         r.session_name, r.plan_week_number, r.plan_day_index, s."movementId",
         e.id, e.position, e.sets, e.rep_low, e.rep_high, e.rep_unit, e.target_seconds,
         e.target_seconds_high, e.laterality, e.side_word, e.instruction;

revoke all on public.forge_athlete_state, public.forge_receipt_movements from public, anon;
grant select on public.forge_athlete_state, public.forge_receipt_movements to authenticated;

comment on table public.forge_session_events is
  'Meaningful athlete-state transitions (a workout opened, left mid-way). Append-only; written only through submit_forge_session_event.';
comment on view public.forge_athlete_state is
  'Where an athlete is, from what they did read against the plan: last opened / left / completed and the next unfinished session. Never written; never edits a prescription.';
comment on view public.forge_receipt_movements is
  'Per receipt and movement: performed sets beside the exact prescription (the receipt''s own version) they were performed against.';

commit;
