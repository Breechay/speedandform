-- The Console types into a details field, and the RPC was dropping it.
--
-- `planned_session_versions.details` is stored prose that duplicates what the
-- typed components now say, and item 73 has it marked for deletion. Until that
-- happens it is a field a coach fills in and expects to keep, and a writer that
-- silently discards it is worse than the duplication it was avoiding.
--
-- Passed straight through, not carried forward: a revision states the version
-- whole, and a prose field that quietly reappears from three versions ago is a
-- rule nobody would remember. When item 73 lands, this parameter goes with it.
--
-- The three functions are dropped and recreated rather than overloaded. An
-- overload set where one signature silently drops a field is exactly the trap
-- this migration exists to close.

drop function if exists public.revise_session(uuid, text, text, text, numeric, text, integer, smallint, smallint, jsonb);
drop function if exists public.author_session(uuid, uuid, text, text, text, date, smallint, numeric, text, integer, smallint, smallint, jsonb);
drop function if exists public.write_session_version(uuid, text, text, numeric, text, integer, smallint, smallint, text, jsonb);

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
  p_components jsonb,
  p_details text
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
    if exists (select 1 from jsonb_array_elements(p_components) as part
                where part ? 'paceLow' or part ? 'paceHigh') then
      raise exception 'pace travels in seconds. Send paceLowSeconds and paceHighSeconds.';
    end if;
    select string_agg(k, ', ') into bad
      from (select distinct jsonb_object_keys(part) as k
              from jsonb_array_elements(p_components) as part) candidate
     where k not in (select key from public.component_wire_keys());
    if bad is not null then
      raise exception 'unknown component key(s): %. The accepted set is component_wire_keys().', bad;
    end if;
  end if;

  insert into public.planned_session_versions (
    athlete_id, planned_session_id, version_number, title,
    prescribed_distance, distance_unit, prescribed_duration_minutes,
    intent, details, change_reason, rpe_low, rpe_high, authored_by
  ) values (
    owner_id, p_planned_session_id, next_number, btrim(p_title),
    p_prescribed_distance,
    case when p_prescribed_distance is null then null else coalesce(p_distance_unit, 'mi') end,
    p_prescribed_duration_minutes,
    btrim(p_intent), nullif(btrim(coalesce(p_details, '')), ''),
    nullif(btrim(coalesce(p_change_reason, '')), ''), p_rpe_low, p_rpe_high, auth.uid()
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
  p_components jsonb default null,
  p_details text default null
) returns uuid
language sql
security invoker
set search_path = public, pg_temp
as $$
  select public.write_session_version(
    p_planned_session_id, p_title, p_intent, p_prescribed_distance, p_distance_unit,
    p_prescribed_duration_minutes, p_rpe_low, p_rpe_high, p_change_reason, p_components, p_details);
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
  p_components jsonb default null,
  p_details text default null
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
    coalesce(p_components, '[]'::jsonb), p_details);

  return created_session;
end $$;


comment on function public.author_session is
  'Creates a planned session with version 1 and its components, in one transaction. Position is assigned server-side.';

revoke all on function public.write_session_version(uuid, text, text, numeric, text, integer, smallint, smallint, text, jsonb, text) from public;
revoke all on function public.revise_session(uuid, text, text, text, numeric, text, integer, smallint, smallint, jsonb, text) from public;
revoke all on function public.author_session(uuid, uuid, text, text, text, date, smallint, numeric, text, integer, smallint, smallint, jsonb, text) from public;
grant execute on function public.write_session_version(uuid, text, text, numeric, text, integer, smallint, smallint, text, jsonb, text) to authenticated;
grant execute on function public.revise_session(uuid, text, text, text, numeric, text, integer, smallint, smallint, jsonb, text) to authenticated;
grant execute on function public.author_session(uuid, uuid, text, text, text, date, smallint, numeric, text, integer, smallint, smallint, jsonb, text) to authenticated;
