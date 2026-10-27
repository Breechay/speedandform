-- Revising a strength session: a new immutable version with its structured exercises.
--
-- write_session_version / revise_session revise RUNNING work: they carry running components
-- forward and know nothing of exercises, so using them on a strength session would leave the new
-- version with the wrong shape and no exercises. This is the strength counterpart, with the same
-- rules:
--   * only a coach on that athlete may author it;
--   * a revision always needs a reason (it is the part still legible in six weeks);
--   * it appends a version, never edits one. Nothing the athlete already opened or performed
--     changes: their workout is frozen on the version it was opened on, and their receipt names it;
--   * the readable `details` text is generated from the same exercises that are stored, in the
--     format the live versions already use, so the two can never disagree.
-- Applying this publishes nothing by itself. A coach calls it, and the athlete's app takes the new
-- version for unopened work the next time it reads its feed.
begin;

do $$
begin
  if to_regclass('public.planned_session_exercises') is null then
    raise exception 'planned_session_exercises must exist (structured strength migration) before this migration';
  end if;
end $$;

create function public.revise_strength_session(
  p_planned_session_id uuid,
  p_title text,
  p_intent text,
  p_change_reason text,
  p_exercises jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  owner_id uuid;
  prev record;
  next_number integer;
  created_id uuid;
  ex jsonb;
  n integer := 0;
  details text := '';
  target text;
  line text;
  k text;
  allowed constant text[] := array[
    'movementId', 'movementName', 'sets', 'repLow', 'repHigh', 'repUnit', 'targetSeconds',
    'targetSecondsHigh', 'laterality', 'sideWord', 'restSeconds', 'cue', 'instruction', 'substitutions'];
begin
  select athlete_id into owner_id from public.planned_sessions where id = p_planned_session_id;
  if owner_id is null then raise exception 'no such session'; end if;
  if not public.is_coach_member(owner_id) then
    raise exception 'only a coach on this athlete may author their work';
  end if;

  select v.id, v.version_number, v.shape, v.intent into prev
    from public.planned_session_versions v
   where v.planned_session_id = p_planned_session_id
   order by v.version_number desc limit 1;
  if prev.id is null or prev.shape is distinct from 'strength' then
    raise exception 'only a strength session is revised here';
  end if;
  next_number := prev.version_number + 1;

  if coalesce(btrim(p_title), '') = '' then raise exception 'a session needs a title'; end if;
  if coalesce(btrim(p_change_reason), '') = '' then
    raise exception 'a revision needs a reason. It is the part that is still legible in six weeks.';
  end if;
  if jsonb_typeof(p_exercises) is distinct from 'array' or jsonb_array_length(p_exercises) not between 1 and 30 then
    raise exception 'a strength revision carries between 1 and 30 exercises';
  end if;

  -- Validate and render the readable text first; nothing is written until every exercise is sound.
  for ex in select value from jsonb_array_elements(p_exercises)
  loop
    n := n + 1;
    if jsonb_typeof(ex) is distinct from 'object' then raise exception 'exercise % is not an object', n; end if;
    for k in select jsonb_object_keys(ex) loop
      if not (k = any (allowed)) then raise exception 'unknown exercise key "%" (exercise %)', k, n; end if;
    end loop;
    if coalesce(btrim(ex->>'movementName'), '') = '' or coalesce(btrim(ex->>'movementId'), '') = '' then
      raise exception 'exercise % needs a movementId and a movementName', n;
    end if;
    begin
      if ex->>'targetSeconds' is not null then
        target := (ex->>'targetSeconds')::integer::text
          || case when ex->>'targetSecondsHigh' is not null
                       and (ex->>'targetSecondsHigh')::integer <> (ex->>'targetSeconds')::integer
                  then '–' || (ex->>'targetSecondsHigh')::integer::text else '' end
          || ' sec';
      else
        target := (ex->>'repLow')::integer::text
          || case when (ex->>'repHigh')::integer <> (ex->>'repLow')::integer
                  then '–' || (ex->>'repHigh')::integer::text else '' end
          || case when nullif(btrim(coalesce(ex->>'repUnit', '')), '') is not null
                  then ' ' || btrim(ex->>'repUnit') else '' end;
      end if;
      line := btrim(ex->>'movementName') || ' — ' || (ex->>'sets')::integer::text || ' × ' || target
        || case when ex->>'laterality' = 'per_side' then ' / ' || coalesce(nullif(btrim(coalesce(ex->>'sideWord', '')), ''), 'side') else '' end
        || case when nullif(btrim(coalesce(ex->>'instruction', '')), '') is not null then ' · ' || btrim(ex->>'instruction') else '' end;
    exception when others then
      raise exception 'exercise % is incomplete or malformed', n;
    end;
    if target is null or line is null then raise exception 'exercise % is incomplete or malformed', n; end if;
    details := details || case when details = '' then '' else E'\n' end || line;
  end loop;

  insert into public.planned_session_versions (
    athlete_id, planned_session_id, version_number, title, intent, details, shape, change_reason, authored_by
  ) values (
    owner_id, p_planned_session_id, next_number, btrim(p_title),
    coalesce(nullif(btrim(coalesce(p_intent, '')), ''), prev.intent),
    details, 'strength', btrim(p_change_reason), auth.uid()
  ) returning id into created_id;

  n := 0;
  for ex in select value from jsonb_array_elements(p_exercises)
  loop
    n := n + 1;
    begin
      insert into public.planned_session_exercises (
        athlete_id, version_id, position, movement_id, movement_name, sets,
        rep_low, rep_high, rep_unit, target_seconds, target_seconds_high,
        laterality, side_word, rest_seconds, cue, instruction, substitutions
      ) values (
        owner_id, created_id, n, btrim(ex->>'movementId'), btrim(ex->>'movementName'), (ex->>'sets')::smallint,
        (ex->>'repLow')::smallint, (ex->>'repHigh')::smallint, nullif(btrim(coalesce(ex->>'repUnit', '')), ''),
        (ex->>'targetSeconds')::integer, (ex->>'targetSecondsHigh')::integer,
        ex->>'laterality',
        case when ex->>'laterality' = 'per_side' then coalesce(nullif(btrim(coalesce(ex->>'sideWord', '')), ''), 'side') end,
        (ex->>'restSeconds')::integer, nullif(btrim(coalesce(ex->>'cue', '')), ''),
        nullif(btrim(coalesce(ex->>'instruction', '')), ''), ex->'substitutions');
    exception
      when check_violation or not_null_violation or invalid_text_representation or numeric_value_out_of_range then
        raise exception 'exercise % is not a valid prescription (%)', n, sqlerrm;
    end;
  end loop;

  return created_id;
end $$;

revoke all on function public.revise_strength_session(uuid, text, text, text, jsonb) from public, anon;
grant execute on function public.revise_strength_session(uuid, text, text, text, jsonb) to authenticated;

comment on function public.revise_strength_session is
  'Appends an immutable strength version with its structured exercises. Coach-only; a reason is required; details text is generated from the stored exercises so the two cannot differ.';

commit;
