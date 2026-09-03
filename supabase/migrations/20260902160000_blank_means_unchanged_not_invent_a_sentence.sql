-- A validation written for authoring was blocking every edit.
--
-- write_session_version refuses a blank intent, which is right at the moment a
-- session is written and wrong at every moment after. 284 of the 329 versions in
-- this database have no intent — the not-null came off that column back in
-- August — so the rule made 86% of the block unrevisable, including all fourteen
-- operations in the ladder plan. Every one of them would have been refused with
-- "a session needs an intent", about sessions that have never had one.
--
-- The worse half is what the coach does next. Faced with a save that will not go
-- through, they type a sentence to get past it. That is exactly how filler copy
-- is born: prose written for a validator rather than for the athlete, and then
-- delivered to the athlete because the field is what reaches their phone.
--
-- So blank now means unchanged. A revision carries the previous sentence forward;
-- where there never was one it stays silent. Authoring still has to say why the
-- session exists, because that is the moment when someone actually knows.
--
-- Silence beats filler. The rule should not be able to manufacture the filler.

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
  previous_intent text;
  effective_intent text;
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

  select id, intent, version_number + 1 into previous_id, previous_intent, next_number
    from public.planned_session_versions
   where planned_session_id = p_planned_session_id
   order by version_number desc limit 1;
  next_number := coalesce(next_number, 1);

  -- Blank means unchanged. A revision carries the previous sentence forward, and
  -- where there never was one it stays silent rather than inventing prose to get
  -- past a validation. Authoring is the moment a session has to say why it
  -- exists, and that requirement stays exactly where it was.
  effective_intent := coalesce(nullif(btrim(p_intent), ''), previous_intent);
  if next_number = 1 and coalesce(btrim(effective_intent), '') = '' then
    raise exception 'a session needs an intent. It is the part that reaches them.';
  end if;

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
    effective_intent, nullif(btrim(coalesce(p_details, '')), ''),
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
      rpe_low, rpe_high, rpe_source, rpe_default_version,
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
      part->>'rpeDefaultVersion',
      (part->>'repeatMinimum')::smallint,
      (part->>'repeatTarget')::smallint,
      (part->>'repeatProgression')::smallint,
      (part->>'repeatCeiling')::smallint
    from jsonb_array_elements(p_components) with ordinality as t(part, ordinality);
  end if;

  return created_id;
end $$;





comment on function public.write_session_version is
  'Writes a prescription version and its typed components in one transaction. Null components carry the previous version''s anatomy forward; an explicit empty array means the session has no typed structure. A blank intent means unchanged, and a session that never had one is not made to invent one — but authoring requires it. The version number is assigned here, so two coaches revising at once cannot collide.';
