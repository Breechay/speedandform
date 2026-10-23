-- Frozen contract fixture. NOT a migration of this repository.
-- The Forge native-receipt boundary lives in the live FORM Athlete System; its migration and the
-- pre-existing table shape come from Breechay/FORM-iOS (commit a8a68b1c lineage):
--   backend/forge/tests/native-receipts.test.mjs  (base table as it existed before the migration)
--   backend/forge/supabase/migrations/20260913220047_forge_authenticated_native_receipts.sql
-- Tests here apply it so the receipt link / session-state migration is proven against the real
-- receipt validation trigger and RPC, not a lookalike.

-- == base table ==
create table public.forge_strength_receipts(
      receipt_id text primary key, athlete_id uuid not null references public.athletes(id),
      athlete_label text not null, program_id text not null,
      plan_week_number integer not null check(plan_week_number between 1 and 52),
      plan_day_index integer not null check(plan_day_index between 0 and 6),
      session_name text not null, started_at timestamptz not null,
      completed_at timestamptz not null check(completed_at >= started_at),
      duration_label text, set_count integer not null check(set_count between 1 and 200),
      movement_summary text[] not null default '{}', cohort text, device_key text,
      received_at timestamptz not null default now());
    grant all on public.forge_strength_receipts to anon, authenticated;

-- == 20260913220047_forge_authenticated_native_receipts.sql ==
-- Forge-owned receipt boundary on the existing FORM Athlete System table.
-- Does not create identities, claim invitations, import history, or enable app sync.
begin;

alter table public.forge_strength_receipts
  add column native_payload jsonb,
  add column submitted_by uuid,
  add column consent_version text;

alter table public.forge_strength_receipts enable row level security;
revoke all on public.forge_strength_receipts from anon;
revoke insert, update, delete, truncate, references, trigger on public.forge_strength_receipts from authenticated;
grant select on public.forge_strength_receipts to authenticated;
grant insert (athlete_id, native_payload, consent_version) on public.forge_strength_receipts to authenticated;

create policy forge_receipts_read_related on public.forge_strength_receipts
for select to authenticated using (
  exists (select 1 from public.athlete_memberships m
    where m.athlete_id = forge_strength_receipts.athlete_id
      and m.user_id = (select auth.uid()) and m.status = 'active'
      and m.role in ('athlete', 'coach'))
);

create policy forge_receipts_insert_own on public.forge_strength_receipts
for insert to authenticated with check (
  submitted_by = (select auth.uid()) and native_payload is not null
  and consent_version = 'forge-coach-receipts-v1'
  and exists (select 1 from public.athlete_memberships m
    where m.athlete_id = forge_strength_receipts.athlete_id
      and m.user_id = (select auth.uid()) and m.status = 'active' and m.role = 'athlete')
);

-- Validate at the table boundary as well as the RPC: direct REST INSERT cannot
-- spoof summaries, sender identity, timestamps of receipt, or another athlete.
create function public.forge_validate_native_receipt() returns trigger
language plpgsql security invoker set search_path = '' as $$
declare
  p jsonb := new.native_payload;
  s jsonb;
  session_id uuid;
  start_time timestamptz;
  end_time timestamptz;
  set_time timestamptz;
  n integer;
begin
  -- Existing privileged summary writers keep their existing format. RLS and
  -- column grants prevent authenticated clients from using this legacy path.
  if p is null then return new; end if;
  if auth.uid() is null or not exists (
    select 1 from public.athlete_memberships m
    where m.athlete_id = new.athlete_id and m.user_id = auth.uid()
      and m.role = 'athlete' and m.status = 'active'
  ) then raise exception 'Active athlete membership required' using errcode = '42501'; end if;
  if new.consent_version is distinct from 'forge-coach-receipts-v1' then
    raise exception 'Explicit receipt consent required' using errcode = '22023';
  end if;
  if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text) > 262144
    or p ? 'reportedHistorySource' or p ? 'isBackfilled' then
    raise exception 'Invalid native receipt envelope' using errcode = '22023';
  end if;
  session_id := (p->>'id')::uuid;
  if session_id is null
    or jsonb_typeof(p->'programId') is distinct from 'string'
    or length(btrim(p->>'programId')) not between 1 and 200
    or jsonb_typeof(p->'sessionName') is distinct from 'string'
    or length(btrim(p->>'sessionName')) not between 1 and 300
    or jsonb_typeof(p->'planWeekNumber') is distinct from 'number'
    or coalesce(p->>'planWeekNumber','') !~ '^[0-9]+$'
    or (p->>'planWeekNumber')::integer not between 1 and 52
    or jsonb_typeof(p->'planDayIndex') is distinct from 'number'
    or coalesce(p->>'planDayIndex','') !~ '^[0-9]+$'
    or (p->>'planDayIndex')::integer not between 0 and 6 then
    raise exception 'Invalid session coordinates' using errcode = '22023';
  end if;
  -- Native records require actual timestamps with an explicit timezone.
  if coalesce(p->>'startedAt','') !~ 'T.*(Z|[+-][0-9]{2}:[0-9]{2})$'
    or coalesce(p->>'completedAt','') !~ 'T.*(Z|[+-][0-9]{2}:[0-9]{2})$' then
    raise exception 'Native timestamps required' using errcode = '22023';
  end if;
  start_time := (p->>'startedAt')::timestamptz;
  end_time := (p->>'completedAt')::timestamptz;
  if not isfinite(start_time) or not isfinite(end_time) or end_time < start_time then
    raise exception 'Invalid session chronology' using errcode = '22023';
  end if;
  if p->'durationSeconds' is not null and p->'durationSeconds' <> 'null'::jsonb then
    if jsonb_typeof(p->'durationSeconds') <> 'number'
      or (p->>'durationSeconds') !~ '^[0-9]+$' then
      raise exception 'Invalid duration' using errcode = '22023';
    end if;
  end if;
  if p->'feedback' is not null and p->'feedback' <> 'null'::jsonb then
    if jsonb_typeof(p->'feedback') <> 'string' or length(p->>'feedback') > 4000 then
      raise exception 'Invalid feedback' using errcode = '22023';
    end if;
  end if;
  if jsonb_typeof(p->'sets') is distinct from 'array' then
    raise exception 'Performed sets required' using errcode = '22023';
  end if;
  n := jsonb_array_length(p->'sets');
  if n not between 1 and 200 then
    raise exception 'Invalid set count' using errcode = '22023';
  end if;
  for s in select value from jsonb_array_elements(p->'sets') loop
    if jsonb_typeof(s) is distinct from 'object'
      or jsonb_typeof(s->'id') is distinct from 'string' or length(btrim(s->>'id')) not between 1 and 500
      or jsonb_typeof(s->'movementId') is distinct from 'string' or length(btrim(s->>'movementId')) not between 1 and 200
      or jsonb_typeof(s->'movementName') is distinct from 'string' or length(btrim(s->>'movementName')) not between 1 and 300
      or jsonb_typeof(s->'setIndex') is distinct from 'number'
      or coalesce(s->>'setIndex','') !~ '^[0-9]+$'
      or (s->>'setIndex')::integer not between 0 and 200 then
      raise exception 'Invalid performed set' using errcode = '22023';
    end if;
    if s->'weight' is not null and s->'weight' <> 'null'::jsonb then
      if jsonb_typeof(s->'weight') <> 'number' or (s->>'weight')::numeric < 0 then
        raise exception 'Invalid load' using errcode = '22023';
      end if;
    end if;
    if s->'reps' is not null and s->'reps' <> 'null'::jsonb then
      if jsonb_typeof(s->'reps') <> 'number' or (s->>'reps') !~ '^[0-9]+$' then
        raise exception 'Invalid reps' using errcode = '22023';
      end if;
    end if;
    if s->'seconds' is not null and s->'seconds' <> 'null'::jsonb then
      if jsonb_typeof(s->'seconds') <> 'number' or (s->>'seconds') !~ '^[0-9]+$' then
        raise exception 'Invalid time work' using errcode = '22023';
      end if;
    end if;
    if coalesce(s->>'completedAt','') !~ 'T.*(Z|[+-][0-9]{2}:[0-9]{2})$' then
      raise exception 'Set timestamp required' using errcode = '22023';
    end if;
    set_time := (s->>'completedAt')::timestamptz;
    if not isfinite(set_time) or set_time < start_time or set_time > end_time then
      raise exception 'Set outside session interval' using errcode = '22023';
    end if;
  end loop;
  if (select count(distinct value->>'id') from jsonb_array_elements(p->'sets')) <> n then
    raise exception 'Duplicate set identity' using errcode = '22023';
  end if;
  new.receipt_id := new.athlete_id::text || ':' || session_id::text;
  new.submitted_by := auth.uid();
  select a.display_name into strict new.athlete_label from public.athletes a where a.id = new.athlete_id;
  new.program_id := p->>'programId';
  new.plan_week_number := (p->>'planWeekNumber')::integer;
  new.plan_day_index := (p->>'planDayIndex')::integer;
  new.session_name := p->>'sessionName';
  new.started_at := start_time;
  new.completed_at := end_time;
  new.duration_label := null; -- no rounded/inferred duration asserted by the receiver
  new.set_count := n;
  select array_agg(line order by first_set) into new.movement_summary from (
    select (value->>'movementName') || ' · ' || count(*)::text || ' sets' as line,
      min(ordinality) as first_set
    from jsonb_array_elements(p->'sets') with ordinality
    group by value->>'movementId', value->>'movementName'
  ) summaries;
  new.cohort := null;
  new.device_key := null;
  new.received_at := statement_timestamp();
  return new;
end;
$$;
revoke all on function public.forge_validate_native_receipt() from public, anon, authenticated;
create trigger forge_native_receipt_before_insert before insert on public.forge_strength_receipts
for each row execute function public.forge_validate_native_receipt();

create function public.submit_forge_native_receipt(p_athlete_id uuid, p_session jsonb, p_consent_version text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  rid text;
  stored jsonb;
  inserted_id text;
begin
  -- Check before conflict/read too: revoked members cannot replay old requests.
  if auth.uid() is null or not exists (
    select 1 from public.athlete_memberships m where m.athlete_id = p_athlete_id
      and m.user_id = auth.uid() and m.status = 'active' and m.role = 'athlete'
  ) then raise exception 'Active athlete membership required' using errcode = '42501'; end if;
  rid := p_athlete_id::text || ':' || ((p_session->>'id')::uuid)::text;
  insert into public.forge_strength_receipts (athlete_id, native_payload, consent_version)
  values (p_athlete_id, p_session, p_consent_version)
  on conflict (receipt_id) do nothing returning receipt_id into inserted_id;
  if inserted_id is not null then
    return jsonb_build_object('receiptId', inserted_id, 'status', 'stored');
  end if;
  select native_payload into stored from public.forge_strength_receipts where receipt_id = rid;
  if stored is distinct from p_session then
    raise exception 'Receipt already exists with different work' using errcode = '23505';
  end if;
  return jsonb_build_object('receiptId', rid, 'status', 'already_stored');
end;
$$;
revoke all on function public.submit_forge_native_receipt(uuid,jsonb,text) from public, anon;
grant execute on function public.submit_forge_native_receipt(uuid,jsonb,text) to authenticated;
commit;
