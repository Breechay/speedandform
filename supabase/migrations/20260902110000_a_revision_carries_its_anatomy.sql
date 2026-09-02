-- A revision carries its anatomy.
--
-- `planned_session_components` is the prescription. It is also the only part of a
-- session that no JavaScript in this repository has ever written: all fourteen
-- inserts live in migrations, which is why authoring a block is a hundred and
-- fifty hand-written sessions and why it happens four times a year instead of on
-- a Sunday.
--
-- The Console's session form writes a version row and stops. So a revision that
-- says "3 × 2 mi" instead of "4 × 1 mi" writes the new title and leaves the typed
-- components exactly as they were — and every surface that renders structure from
-- components (structureOf, the plan feed, the app) keeps describing the old work
-- under the new name. Nothing errors. That is the shape of the bug.
--
-- Two doors, one writer. Both are transactions: a version and its components
-- arrive together or neither does.
--
-- The version number is computed here rather than read and incremented by the
-- caller. A client that reads max(version_number) and then inserts loses a race
-- to a concurrent revision, and the unique constraint turns that into an error
-- the coach sees as "saving failed" with no idea why.

-- ── the wire ────────────────────────────────────────────────────────────────
--
-- Named, so that refusing an unknown key is a decision. A misspelled band is an
-- error, never a session quietly authored without one.
--
-- Pace travels as SECONDS. The text columns are still written, derived here, so
-- that everything reading pace_low keeps working — but seconds are the fact and
-- the string is a rendering of it, and a caller cannot send the two disagreeing.
create or replace function public.component_wire_keys()
returns table (key text, kind text)
language sql immutable as $$
  values
    ('role',              'canonical'),
    ('shape',             'canonical'),
    ('repeatCount',       'canonical'),
    ('distance',          'canonical'),
    ('distanceUnit',      'canonical'),
    ('durationSeconds',   'canonical'),
    ('recoverySeconds',   'canonical'),
    ('recoveryKind',      'canonical'),
    ('paceLowSeconds',    'canonical'),
    ('paceHighSeconds',   'canonical'),
    ('rpeLow',            'canonical'),
    ('rpeHigh',           'canonical'),
    ('rpeSource',         'canonical'),
    ('repeatMinimum',     'canonical'),
    ('repeatTarget',      'canonical'),
    ('repeatProgression', 'canonical'),
    ('repeatCeiling',     'canonical'),
    -- Order in the array is the order of the work. A caller may send position
    -- and it is accepted and ignored, so that ignoring it is deliberate.
    ('position',          'accepted_ignored');
$$;

comment on function public.component_wire_keys is
  'The complete set of keys a prescribed component may carry. Anything else is refused rather than dropped. Pace is sent in seconds; pace_low and pace_high text are derived server-side so one fact has one source.';

create or replace function public.clock_from_seconds(p_seconds integer)
returns text language sql immutable as $$
  select case when p_seconds is null then null
              else (p_seconds / 60)::text || ':' || lpad((p_seconds % 60)::text, 2, '0') end;
$$;

-- ── the writer ──────────────────────────────────────────────────────────────
--
-- p_components null means "I did not touch the structure": the components of the
-- version being superseded are carried forward, so a coach fixing a typo in a
-- title does not silently strip a session's anatomy. An explicit '[]' means the
-- session has no typed structure, which is a different statement and is honoured.
create or replace function public.write_session_version(
  p_planned_session_id uuid,
  p_title text,
  p_intent text,
  p_prescribed_distance numeric,
  p_distance_unit text,
  p_prescribed_duration_minutes integer,
  p_rpe_low smallint,
  p_rpe_high smallint,
  p_change_reason text,
  p_components jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  previous_id uuid;
  next_number integer;
  created_id uuid;
  bad text;
begin
  select athlete_id into owner_id from public.planned_sessions where id = p_planned_session_id;
  if owner_id is null then raise exception 'no such session'; end if;
  if not public.is_coach_member(owner_id) then
    raise exception 'only a coach on this athlete may author their work';
  end if;
  if coalesce(btrim(p_title), '') = '' then raise exception 'a session needs a title'; end if;
  if coalesce(btrim(p_intent), '') = '' then raise exception 'a session needs an intent. It is the part that reaches them.'; end if;

  select id, version_number + 1 into previous_id, next_number
    from public.planned_session_versions
   where planned_session_id = p_planned_session_id
   order by version_number desc limit 1;
  next_number := coalesce(next_number, 1);

  if next_number > 1 and coalesce(btrim(p_change_reason), '') = '' then
    raise exception 'a revision needs a reason. It is the part that is still legible in six weeks.';
  end if;

  if p_components is not null then
    if jsonb_typeof(p_components) <> 'array' then
      raise exception 'components must be an array';
    end if;
    select string_agg(k, ', ') into bad
      from (select distinct jsonb_object_keys(part) as k
              from jsonb_array_elements(p_components) as part) candidate
     where k not in (select key from public.component_wire_keys());
    if bad is not null then
      raise exception 'unknown component key(s): %. The accepted set is component_wire_keys().', bad;
    end if;
    if exists (select 1 from jsonb_array_elements(p_components) as part
                where part ? 'paceLow' or part ? 'paceHigh') then
      raise exception 'pace travels in seconds. Send paceLowSeconds and paceHighSeconds.';
    end if;
  end if;

  insert into public.planned_session_versions (
    athlete_id, planned_session_id, version_number, title,
    prescribed_distance, distance_unit, prescribed_duration_minutes,
    intent, change_reason, rpe_low, rpe_high, authored_by
  ) values (
    owner_id, p_planned_session_id, next_number, btrim(p_title),
    p_prescribed_distance,
    case when p_prescribed_distance is null then null else coalesce(p_distance_unit, 'mi') end,
    p_prescribed_duration_minutes,
    btrim(p_intent), nullif(btrim(coalesce(p_change_reason, '')), ''), p_rpe_low, p_rpe_high, auth.uid()
  ) returning id into created_id;

  if p_components is null then
    -- Carried forward, not restated. The previous version's anatomy is the
    -- anatomy until someone says otherwise.
    insert into public.planned_session_components (
      athlete_id, version_id, position, role, shape, repeat_count,
      distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
      pace_low, pace_high, pace_low_seconds, pace_high_seconds,
      rpe_low, rpe_high, rpe_source, rpe_default_version,
      repeat_minimum, repeat_target, repeat_progression, repeat_ceiling
    )
    select athlete_id, created_id, position, role, shape, repeat_count,
           distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
           pace_low, pace_high, pace_low_seconds, pace_high_seconds,
           rpe_low, rpe_high, rpe_source, rpe_default_version,
           repeat_minimum, repeat_target, repeat_progression, repeat_ceiling
      from public.planned_session_components
     where version_id = previous_id;
  else
    insert into public.planned_session_components (
      athlete_id, version_id, position, role, shape, repeat_count,
      distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
      pace_low, pace_high, pace_low_seconds, pace_high_seconds,
      rpe_low, rpe_high, rpe_source,
      repeat_minimum, repeat_target, repeat_progression, repeat_ceiling
    )
    select
      owner_id, created_id, ordinality::smallint,
      part->>'role',
      part->>'shape',
      (part->>'repeatCount')::smallint,
      (part->>'distance')::numeric,
      case when part->>'distance' is null then null else coalesce(part->>'distanceUnit', 'mi') end,
      (part->>'durationSeconds')::integer,
      (part->>'recoverySeconds')::integer,
      part->>'recoveryKind',
      public.clock_from_seconds((part->>'paceLowSeconds')::integer),
      public.clock_from_seconds((part->>'paceHighSeconds')::integer),
      (part->>'paceLowSeconds')::integer,
      (part->>'paceHighSeconds')::integer,
      (part->>'rpeLow')::smallint,
      (part->>'rpeHigh')::smallint,
      part->>'rpeSource',
      (part->>'repeatMinimum')::smallint,
      (part->>'repeatTarget')::smallint,
      (part->>'repeatProgression')::smallint,
      (part->>'repeatCeiling')::smallint
    from jsonb_array_elements(p_components) with ordinality as t(part, ordinality);
  end if;

  return created_id;
end $$;

comment on function public.write_session_version is
  'Writes a prescription version and its typed components in one transaction. Null components carry the previous version''s anatomy forward; an explicit empty array means the session has no typed structure. The version number is assigned here, so two coaches revising at once cannot collide.';

-- ── the two doors ───────────────────────────────────────────────────────────

create or replace function public.revise_session(
  p_planned_session_id uuid,
  p_title text,
  p_intent text,
  p_change_reason text,
  p_prescribed_distance numeric default null,
  p_distance_unit text default null,
  p_prescribed_duration_minutes integer default null,
  p_rpe_low smallint default null,
  p_rpe_high smallint default null,
  p_components jsonb default null
) returns uuid
language sql
security invoker
set search_path = public, pg_temp
as $$
  select public.write_session_version(
    p_planned_session_id, p_title, p_intent, p_prescribed_distance, p_distance_unit,
    p_prescribed_duration_minutes, p_rpe_low, p_rpe_high, p_change_reason, p_components);
$$;

create or replace function public.author_session(
  p_athlete_id uuid,
  p_week_id uuid,
  p_day_label text,
  p_title text,
  p_intent text,
  p_scheduled_on date default null,
  p_position smallint default null,
  p_prescribed_distance numeric default null,
  p_distance_unit text default null,
  p_prescribed_duration_minutes integer default null,
  p_rpe_low smallint default null,
  p_rpe_high smallint default null,
  p_components jsonb default null
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  created_session uuid;
  slot smallint;
begin
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'only a coach on this athlete may author their work';
  end if;
  if not exists (select 1 from public.training_weeks where id = p_week_id and athlete_id = p_athlete_id) then
    raise exception 'that week belongs to a different athlete';
  end if;

  -- The next free slot, computed here. A client counting the sessions it can see
  -- picks a taken position the moment two weeks are authored side by side.
  select coalesce(max(position), 0) + 1 into slot
    from public.planned_sessions where week_id = p_week_id;

  insert into public.planned_sessions (athlete_id, week_id, scheduled_on, day_label, position, state, created_by)
  values (p_athlete_id, p_week_id, p_scheduled_on, p_day_label, coalesce(p_position, slot), 'published', auth.uid())
  returning id into created_session;

  perform public.write_session_version(
    created_session, p_title, p_intent, p_prescribed_distance, p_distance_unit,
    p_prescribed_duration_minutes, p_rpe_low, p_rpe_high, null,
    -- A new session with no components stated has no anatomy to carry forward,
    -- so null and '[]' mean the same thing here and both are honest.
    coalesce(p_components, '[]'::jsonb));

  return created_session;
end $$;

comment on function public.author_session is
  'Creates a planned session with version 1 and its components, in one transaction. Position is assigned server-side.';

revoke all on function public.write_session_version(uuid, text, text, numeric, text, integer, smallint, smallint, text, jsonb) from public;
revoke all on function public.revise_session(uuid, text, text, text, numeric, text, integer, smallint, smallint, jsonb) from public;
revoke all on function public.author_session(uuid, uuid, text, text, text, date, smallint, numeric, text, integer, smallint, smallint, jsonb) from public;
grant execute on function public.write_session_version(uuid, text, text, numeric, text, integer, smallint, smallint, text, jsonb) to authenticated;
grant execute on function public.revise_session(uuid, text, text, text, numeric, text, integer, smallint, smallint, jsonb) to authenticated;
grant execute on function public.author_session(uuid, uuid, text, text, text, date, smallint, numeric, text, integer, smallint, smallint, jsonb) to authenticated;
grant execute on function public.component_wire_keys() to authenticated;
grant execute on function public.clock_from_seconds(integer) to authenticated;
