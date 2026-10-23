CREATE OR REPLACE FUNCTION public.athlete_plan_feed(p_athlete_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
declare
  payload jsonb;
begin
  -- Preserve the existing membership / sync-switch / active-plan authority.
  payload := public.athlete_plan_feed_before_exercises(p_athlete_id);
  if payload is null or jsonb_typeof(payload->'sessions') is distinct from 'array' then
    return payload;
  end if;

  -- Preserve the structured-strength augmentation already shipped.
  payload := jsonb_set(payload, '{sessions}', coalesce((
    select jsonb_agg(
             case when ex.exercises is null then s.value
                  else s.value || jsonb_build_object('exercises', ex.exercises) end
             order by s.ord)
      from jsonb_array_elements(payload->'sessions') with ordinality as s(value, ord)
      left join lateral (
        select jsonb_agg(jsonb_build_object(
                 'position', e.position,
                 'movement_id', e.movement_id,
                 'movement_name', e.movement_name,
                 'sets', e.sets,
                 'rep_low', e.rep_low, 'rep_high', e.rep_high, 'rep_unit', e.rep_unit,
                 'target_seconds', e.target_seconds, 'target_seconds_high', e.target_seconds_high,
                 'laterality', e.laterality, 'side_word', e.side_word,
                 'rest_seconds', e.rest_seconds,
                 'cue', e.cue,
                 'instruction', e.instruction,
                 'substitutions', e.substitutions)
               order by e.position) as exercises
          from public.planned_session_exercises e
         where e.athlete_id = p_athlete_id
           and e.version_id = (s.value->'version'->>'id')::uuid
      ) ex on true
  ), '[]'::jsonb));

  -- Own-athlete canonical evidence. This is deliberately historical across blocks,
  -- not only the active plan. Limit is a transport bound, not deletion: Postgres
  -- remains the durable record.
  payload := jsonb_set(payload, '{completions}', coalesce((
    select jsonb_agg(row_payload order by sort_date desc, sort_time desc)
      from (
        select
          coalesce(ps.scheduled_on, sc.filed_at::date) as sort_date,
          sc.filed_at as sort_time,
          jsonb_strip_nulls(jsonb_build_object(
            'id', sc.id,
            'planned_session_id', sc.planned_session_id,
            'planned_session_version_id', sc.planned_session_version_id,
            'status', sc.status,
            'actual_distance', sc.actual_distance,
            'distance_unit', sc.distance_unit,
            'duration_seconds', sc.duration_seconds,
            'rpe', sc.rpe,
            'athlete_note', sc.athlete_note,
            'symptoms', sc.symptoms,
            'surface', sc.surface,
            'conditions', sc.conditions,
            'source', sc.source,
            'evidence_id', sc.evidence_id,
            'filed_at', sc.filed_at,
            'updated_at', sc.updated_at,
            'scheduled_on', ps.scheduled_on,
            'day_label', ps.day_label,
            'title', coalesce(exact_v.title, latest_v.title),
            'pieces', coalesce((
              select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                       'position', sp.position,
                       'kind', sp.kind,
                       'distance', sp.distance,
                       'distance_unit', sp.distance_unit,
                       'duration_seconds', sp.duration_seconds,
                       'duration_seconds_exact', sp.duration_seconds_exact,
                       'pace_seconds', sp.pace_seconds
                     )) order by sp.position)
                from public.session_pieces sp
               where sp.completion_id=sc.id
            ), '[]'::jsonb)
          )) as row_payload
        from public.session_completions sc
        left join public.planned_sessions ps
          on ps.id=sc.planned_session_id and ps.athlete_id=sc.athlete_id
        left join public.planned_session_versions exact_v
          on exact_v.id=sc.planned_session_version_id
         and exact_v.planned_session_id=sc.planned_session_id
         and exact_v.athlete_id=sc.athlete_id
        left join lateral (
          select v.title
            from public.planned_session_versions v
           where v.planned_session_id=sc.planned_session_id
             and v.athlete_id=sc.athlete_id
           order by v.version_number desc
           limit 1
        ) latest_v on true
        where sc.athlete_id=p_athlete_id
        order by coalesce(ps.scheduled_on, sc.filed_at::date) desc, sc.filed_at desc
        limit 250
      ) bounded
  ), '[]'::jsonb));

  -- Final athlete-data boundary. Coaching rationale is private even when a
  -- session version stores it; no native build may accidentally render it.
  -- This projection leaves all prescriptions, exercises and filings unchanged.
  payload := jsonb_set(
    payload, '{sessions}',
    coalesce((
      select jsonb_agg(s.value #- '{version,coach_note}' order by s.ord)
        from jsonb_array_elements(payload->'sessions') with ordinality as s(value, ord)
    ), '[]'::jsonb)
  );

  return payload;
end
$function$
;
