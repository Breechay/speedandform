-- FORM · Authenticated, append-only editorial correction of the 2026-11-07 incident.
-- Only the athlete's active coach and active coaching administrator can publish.
-- This intentionally does not DELETE/UPDATE immutable history or change dose.
-- Review and signed-in coach publication are separate from applying this migration.

CREATE OR REPLACE FUNCTION public.coach_legacy_editorial_queue(p_limit integer DEFAULT 12, p_offset integer DEFAULT 0)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  items jsonb;
BEGIN
  IF actor IS NULL OR NOT public.is_active_coaching_administrator(actor)
    OR NOT public.coaching_sync_enabled() THEN
    RAISE EXCEPTION 'Active coaching administrator required' USING ERRCODE = '42501';
  END IF;
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 25
    OR p_offset IS NULL OR p_offset < 0 OR p_offset > 5000 THEN
    RAISE EXCEPTION 'Queue limit must be between 1 and 25' USING ERRCODE = '22023';
  END IF;

  WITH candidates AS (
    SELECT s.id AS session_id, s.athlete_id, s.scheduled_on,
      a.display_name AS athlete_name, a.slug AS athlete_slug,
      b.name AS block_name, cur.id AS version_id,
      cur.title, cur.intent, cur.details, cur.coach_note,
      prior.id AS original_version_id,
      prior.title AS original_title, prior.intent AS original_intent,
      prior.details AS original_details
    FROM public.planned_sessions s
    JOIN public.training_weeks w ON w.id = s.week_id
    JOIN public.training_blocks b ON b.id = w.block_id
    JOIN public.athletes a ON a.id = s.athlete_id
    JOIN LATERAL (
      SELECT v.* FROM public.planned_session_versions v
      WHERE v.planned_session_id = s.id
      ORDER BY v.version_number DESC LIMIT 1
    ) cur ON TRUE
    JOIN public.planned_session_versions prior
      ON prior.planned_session_id = cur.planned_session_id
     AND prior.version_number = cur.version_number - 1
    WHERE s.state = 'published' AND s.scheduled_on >= CURRENT_DATE
      AND b.status IN ('active', 'scheduled')
      AND cur.change_reason = 'Owner-approved FORM editorial terminology cleanup; prior version preserved'
      AND public.is_coach_member(s.athlete_id)
    ORDER BY s.scheduled_on, s.id
    LIMIT p_limit OFFSET p_offset
  )
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
    'session_id', session_id, 'athlete_id', athlete_id,
    'athlete_name', athlete_name, 'athlete_slug', athlete_slug,
    'scheduled_on', scheduled_on, 'block_name', block_name,
    'expected_version_id', version_id,
    'title', title, 'intent', intent, 'details', details,
    'original_version_id', original_version_id,
    'original_title', original_title, 'original_intent', original_intent,
    'original_details', original_details
  ) ORDER BY scheduled_on, session_id), '[]'::jsonb)
  INTO items FROM candidates;

  RETURN jsonb_build_object('items', items, 'offset', p_offset,
    'native_device_verified', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.coach_publish_legacy_editorial_corrections(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  actor uuid := (SELECT auth.uid());
  item jsonb;
  s public.planned_sessions%ROWTYPE;
  b_status text;
  before_v public.planned_session_versions%ROWTYPE;
  new_id uuid;
  new_title text;
  new_intent text;
  new_details text;
  rationale text;
  seen uuid[] := '{}'::uuid[];
  result_items jsonb := '[]'::jsonb;
  original_components integer;
  new_components integer;
  original_exercises integer;
  new_exercises integer;
BEGIN
  IF actor IS NULL OR NOT public.is_active_coaching_administrator(actor)
    OR NOT public.coaching_sync_enabled() THEN
    RAISE EXCEPTION 'Active coaching administrator required' USING ERRCODE = '42501';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
    OR jsonb_array_length(p_items) NOT BETWEEN 1 AND 10 THEN
    RAISE EXCEPTION 'Submit 1 to 10 individually reviewed corrections' USING ERRCODE = '22023';
  END IF;

  FOR item IN SELECT value FROM jsonb_array_elements(p_items)
  LOOP
    IF jsonb_typeof(item) <> 'object'
      OR NOT (item ? 'session_id' AND item ? 'expected_version_id'
              AND item ? 'title' AND item ? 'intent' AND item ? 'details'
              AND item ? 'rationale' AND item ? 'approved')
      OR item->>'approved' IS DISTINCT FROM 'true' THEN
      RAISE EXCEPTION 'Explicitly reviewed copy and expected version required' USING ERRCODE = '22023';
    END IF;

    IF (item->>'session_id')::uuid = ANY(seen) THEN
      RAISE EXCEPTION 'Duplicate session in correction batch' USING ERRCODE = '22023';
    END IF;
    seen := array_append(seen, (item->>'session_id')::uuid);

    SELECT * INTO s FROM public.planned_sessions
      WHERE id = (item->>'session_id')::uuid FOR UPDATE;
    IF NOT FOUND OR s.state <> 'published' OR s.scheduled_on < CURRENT_DATE
      OR NOT public.is_coach_member(s.athlete_id) THEN
      RAISE EXCEPTION 'Session is no longer future/published or coach authorized' USING ERRCODE = '42501';
    END IF;
    SELECT b.status INTO b_status
      FROM public.training_weeks w
      JOIN public.training_blocks b ON b.id=w.block_id
      WHERE w.id=s.week_id;
    IF b_status IS NULL OR b_status NOT IN ('active', 'scheduled') THEN
      RAISE EXCEPTION 'Cannot edit a closed block' USING ERRCODE = '22023';
    END IF;
    IF EXISTS (SELECT 1 FROM public.session_completions c WHERE c.planned_session_id = s.id) THEN
      RAISE EXCEPTION 'Filed session requires separate protected correction' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO before_v FROM public.planned_session_versions v
      WHERE v.planned_session_id = s.id
      ORDER BY v.version_number DESC LIMIT 1;
    IF NOT FOUND OR before_v.id IS DISTINCT FROM (item->>'expected_version_id')::uuid
      OR before_v.change_reason IS DISTINCT FROM
        'Owner-approved FORM editorial terminology cleanup; prior version preserved' THEN
      RAISE EXCEPTION 'Stale or ineligible session version: reread the coach queue'
        USING ERRCODE = '40001';
    END IF;

    new_title := btrim(item->>'title');
    new_intent := NULLIF(btrim(item->>'intent'), '');
    new_details := NULLIF(btrim(item->>'details'), '');
    rationale := btrim(item->>'rationale');

    IF char_length(new_title) NOT BETWEEN 3 AND 150
      OR new_intent IS NULL OR char_length(new_intent) > 500
      OR char_length(COALESCE(new_details,'')) > 2000
      OR char_length(rationale) NOT BETWEEN 18 AND 400
      OR new_title ~* '(^|[^[:alpha:]])rhythms?([^[:alpha:]]|$)'
      OR new_intent ~* '(^|[^[:alpha:]])rhythms?([^[:alpha:]]|$)'
      OR COALESCE(new_details,'') ~* '(^|[^[:alpha:]])rhythms?([^[:alpha:]]|$)'
      OR COALESCE(new_title,'') ~* '(pending.publication|draft|placeholder|https?://)' THEN
      RAISE EXCEPTION 'Invalid athlete-facing correction or rationale' USING ERRCODE = '22023';
    END IF;
    IF new_title IS NOT DISTINCT FROM before_v.title
      AND new_intent IS NOT DISTINCT FROM before_v.intent
      AND new_details IS NOT DISTINCT FROM before_v.details THEN
      RAISE EXCEPTION 'No contextual copy correction provided' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.planned_session_versions (
      athlete_id,planned_session_id,version_number,title,prescribed_distance,
      distance_unit,prescribed_duration_minutes,intent,details,change_reason,
      authored_by,rpe_low,rpe_high,pace_low,pace_high,shape,coach_note,vault_session_version_id
    ) VALUES (
      before_v.athlete_id,before_v.planned_session_id,before_v.version_number+1,
      new_title,before_v.prescribed_distance,before_v.distance_unit,
      before_v.prescribed_duration_minutes,new_intent,new_details,
      'Coach-authenticated contextual editorial correction: ' || rationale,
      actor,before_v.rpe_low,before_v.rpe_high,before_v.pace_low,
      before_v.pace_high,before_v.shape,before_v.coach_note,
      before_v.vault_session_version_id
    ) RETURNING id INTO new_id;

    INSERT INTO public.planned_session_components (
      athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
      duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,
      rpe_low,rpe_high,repeat_minimum,repeat_target,repeat_progression,
      repeat_ceiling,rpe_source,rpe_default_version,pace_low_seconds,
      pace_high_seconds,counts_toward_mark_id
    )
    SELECT c.athlete_id,new_id,c.position,c.role,c.shape,c.repeat_count,
      c.distance,c.distance_unit,c.duration_seconds,c.recovery_seconds,
      c.recovery_kind,c.pace_low,c.pace_high,c.rpe_low,c.rpe_high,
      c.repeat_minimum,c.repeat_target,c.repeat_progression,c.repeat_ceiling,
      c.rpe_source,c.rpe_default_version,c.pace_low_seconds,c.pace_high_seconds,
      c.counts_toward_mark_id
    FROM public.planned_session_components c WHERE c.version_id=before_v.id;

    INSERT INTO public.planned_session_exercises (
      athlete_id,version_id,position,movement_id,movement_name,sets,rep_low,rep_high,
      rep_unit,target_seconds,target_seconds_high,laterality,side_word,
      rest_seconds,cue,instruction,substitutions
    )
    SELECT e.athlete_id,new_id,e.position,e.movement_id,e.movement_name,e.sets,
      e.rep_low,e.rep_high,e.rep_unit,e.target_seconds,e.target_seconds_high,
      e.laterality,e.side_word,e.rest_seconds,e.cue,e.instruction,e.substitutions
    FROM public.planned_session_exercises e WHERE e.version_id=before_v.id;

    SELECT count(*) INTO original_components FROM public.planned_session_components
      WHERE version_id=before_v.id;
    SELECT count(*) INTO new_components FROM public.planned_session_components
      WHERE version_id=new_id;
    SELECT count(*) INTO original_exercises FROM public.planned_session_exercises
      WHERE version_id=before_v.id;
    SELECT count(*) INTO new_exercises FROM public.planned_session_exercises
      WHERE version_id=new_id;
    IF original_components <> new_components OR original_exercises <> new_exercises THEN
      RAISE EXCEPTION 'Dose/anatomy readback mismatch: aborting entire batch';
    END IF;

    result_items := result_items || jsonb_build_array(jsonb_build_object(
      'session_id',s.id,'date',s.scheduled_on,'prior_version_id',before_v.id,
      'published_version_id',new_id,'version_number',before_v.version_number+1,
      'components',new_components,'exercises',new_exercises));
  END LOOP;

  RETURN jsonb_build_object('published',result_items,
    'source_readback_verified',true,'athlete_feed_verified',false,
    'native_device_verified',false);
END;
$$;

REVOKE ALL ON FUNCTION public.coach_legacy_editorial_queue(integer,integer) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.coach_publish_legacy_editorial_corrections(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.coach_legacy_editorial_queue(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_publish_legacy_editorial_corrections(jsonb) TO authenticated;
