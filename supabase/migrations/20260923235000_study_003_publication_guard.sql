-- Follow-up to applied migration 20260923233811_simon_study_003_evidence_revision_r2.
-- This schema migration does not grant access to arbitrary plans or private filings.
-- A published study projection is valid only while its approved template matches
-- the actual assigned session set, dates and latest semantic prescription.
CREATE OR REPLACE FUNCTION public.study_003_plan()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $projection$
DECLARE
 pub public.plan_publications%ROWTYPE;
 b public.training_blocks%ROWTYPE;
 reason text;
BEGIN
 SELECT * INTO pub FROM public.plan_publications
 WHERE slug='simon-ceiling-durability-01' AND published_at IS NOT NULL AND revoked_at IS NULL
 ORDER BY published_at DESC LIMIT 1;
 IF pub.id IS NULL THEN RETURN jsonb_build_object('state','unavailable'); END IF;
 SELECT x.* INTO b FROM public.training_blocks x JOIN public.athletes a ON a.id=x.athlete_id
 WHERE a.slug='simon' AND x.status='active';
 IF b.id IS NULL OR b.plan_version_id IS DISTINCT FROM pub.plan_version_id
 OR b.starts_on IS DISTINCT FROM pub.starts_on
 OR NOT EXISTS(SELECT 1 FROM public.plan_assignments pa WHERE pa.block_id=b.id AND pa.athlete_id=b.athlete_id AND pa.plan_version_id=pub.plan_version_id AND pa.starts_on=pub.starts_on)
 THEN reason:='assignment'; END IF;
 IF reason IS NULL AND (
  (SELECT count(*) FROM public.planned_sessions ps JOIN public.training_weeks w ON w.id=ps.week_id WHERE w.block_id=b.id)
    <> (SELECT count(*) FROM public.training_plan_sessions s WHERE s.version_id=pub.plan_version_id)
  OR EXISTS(
   SELECT 1 FROM public.training_plan_sessions s WHERE s.version_id=pub.plan_version_id
   AND (SELECT count(*) FROM public.planned_sessions ps JOIN public.training_weeks w ON w.id=ps.week_id WHERE w.block_id=b.id AND ps.plan_session_id=s.id)<>1
  )
 ) THEN reason:='session_set'; END IF;
 IF reason IS NULL AND EXISTS(
  SELECT 1 FROM public.planned_sessions ps
  JOIN public.training_weeks w ON w.id=ps.week_id
  LEFT JOIN public.training_plan_sessions s ON s.id=ps.plan_session_id
  LEFT JOIN public.training_plan_weeks tw ON tw.id=s.plan_week_id
  LEFT JOIN LATERAL(
   SELECT v.* FROM public.planned_session_versions v WHERE v.planned_session_id=ps.id ORDER BY v.version_number DESC LIMIT 1
  ) v ON true
  WHERE w.block_id=b.id AND (
   ps.state NOT IN ('published','completed','changed') OR s.id IS NULL OR v.id IS NULL
   OR s.version_id IS DISTINCT FROM pub.plan_version_id OR tw.week_number IS DISTINCT FROM w.week_number
   OR ps.day_label IS DISTINCT FROM s.day_of_week
   OR ps.scheduled_on IS DISTINCT FROM (pub.starts_on+(tw.week_number-1)*7+array_position(ARRAY['MON','TUE','WED','THU','FRI','SAT','SUN'],s.day_of_week)-1)
   OR (v.title,v.intent,v.details,v.prescribed_distance,v.distance_unit,ps.role) IS DISTINCT FROM (s.title,s.intent,s.details,s.prescribed_distance,s.distance_unit,s.role)
   OR (SELECT jsonb_agg(jsonb_build_array(c.role,c.shape,c.repeat_count,c.distance,c.distance_unit,c.duration_seconds,c.recovery_seconds,c.recovery_kind,c.pace_low_seconds,c.pace_high_seconds,c.rpe_low,c.rpe_high,c.counts_toward_mark_id IS NOT NULL) ORDER BY c.position) FROM public.planned_session_components c WHERE c.version_id=v.id)
    IS DISTINCT FROM (SELECT jsonb_agg(jsonb_build_array(c.role,c.shape,c.repeat_count,c.distance,CASE WHEN c.distance IS NULL THEN NULL ELSE c.distance_unit END,c.duration_seconds,c.recovery_seconds,c.recovery_kind,c.pace_low_seconds,c.pace_high_seconds,c.rpe_low,c.rpe_high,c.counts_toward_mark) ORDER BY c.position) FROM public.training_plan_components c WHERE c.plan_session_id=s.id)
  )
 ) THEN reason:='prescription'; END IF;
 IF reason IS NOT NULL THEN RETURN jsonb_build_object('state','review_required','message','The public plan awaits coach publication. Follow the assigned FORM plan.'); END IF;
 RETURN jsonb_build_object('state','published','schema_version',1,'revision','SIMON-003-R2-20260923','distance_unit','km','pace_seconds_unit','mi','payload',public.public_plan(pub.slug));
END $projection$;
REVOKE ALL ON FUNCTION public.study_003_plan() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.study_003_plan() TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.study_003_plan() IS 'Approved Study 003 publication only. No arbitrary slug, private athlete identity, or unapproved filing access. Fails closed on assignment/publication drift. See docs/studies/SIMON-STUDY-003.md.';
DO $verify$ BEGIN
 IF public.study_003_plan()->>'state'<>'published' THEN RAISE EXCEPTION 'Study 003 publication and assigned plan differ'; END IF;
 IF has_function_privilege('anon','public.public_plan(text)','execute') THEN RAISE EXCEPTION 'Generic full-plan access must remain closed'; END IF;
END $verify$;
