-- José October 13 evidence-led revision. Run once or safely retry.
-- Original versions remain intact; no change to the six-mile continuous race-pace mark.
DO $$
DECLARE
  athlete uuid := (SELECT id FROM public.athletes WHERE slug='jose');
  coach uuid := '79d1520c-7c7c-4cd2-bd31-229a3cc56158';
  sess uuid;
  ver uuid;
  completed uuid;
  rec record;
BEGIN
  IF athlete IS NULL THEN RAISE EXCEPTION 'Jose athlete absent'; END IF;

  -- Tuesday's original five-mile prescription was replaced by the agreed 20-minute
  -- continuous tempo / speed-development assessment.
  SELECT id INTO STRICT sess FROM public.planned_sessions
    WHERE athlete_id=athlete AND scheduled_on='2026-10-13' AND state='published';
  SELECT id INTO ver FROM public.planned_session_versions
    WHERE planned_session_id=sess AND change_reason='FORM-JOSE-OCT13-20261013: swapped with Thursday; actual 20-minute continuous speed assessment'
    LIMIT 1;
  IF ver IS NULL THEN
    INSERT INTO public.planned_session_versions
     (athlete_id,planned_session_id,version_number,title,prescribed_duration_minutes,intent,details,change_reason,rpe_low,rpe_high,authored_by,shape)
    VALUES (athlete,sess,
      (SELECT max(version_number)+1 FROM public.planned_session_versions WHERE planned_session_id=sess),
      '20 min continuous · tempo development',50,
      'Controlled continuous speed-development assessment, not a required threshold or maximum-effort verdict.',
      '20 min easy warm-up, 20 min continuous by effort, 10 min easy cooldown. No assigned pace floor. Keep the actual Garmin work interval separate from warm-up, cooldown and the automatically detected 5K best effort.',
      'FORM-JOSE-OCT13-20261013: swapped with Thursday; actual 20-minute continuous speed assessment',
      6,7,coach,'20 min easy + 20 min continuous + 10 min easy')
    RETURNING id INTO ver;
    INSERT INTO public.planned_session_components
      (athlete_id,version_id,position,role,shape,duration_seconds)
    VALUES
      (athlete,ver,1,'warm_up','continuous',1200),
      (athlete,ver,2,'work','continuous',1200),
      (athlete,ver,3,'cool_down','continuous',600);
  END IF;
  UPDATE public.planned_sessions SET override_reason='October 13 coach-approved Tuesday/Thursday swap and Garmin completion'
   WHERE id=sess AND override_reason IS DISTINCT FROM 'October 13 coach-approved Tuesday/Thursday swap and Garmin completion';

  -- File only screenshot-supported data. A Garmin 5K best effort inside this run is NOT a separate race.
  SELECT id INTO completed FROM public.session_completions
    WHERE athlete_id=athlete AND planned_session_id=sess
    ORDER BY filed_at DESC LIMIT 1;
  IF completed IS NULL THEN
    INSERT INTO public.session_completions
      (athlete_id,planned_session_id,planned_session_version_id,status,actual_distance,distance_unit,duration_seconds,continuous,surface,conditions,athlete_note,source,filed_by)
    VALUES
      (athlete,sess,ver,'completed',7.02,'mi',3071,true,'track',
       'Cooler and breezier conditions according to athlete; actual temperature not supplied.',
       'Garmin screenshot: 20:00 warm-up / 2.43 mi / 8:15 per mi; 20:00 continuous work / 3.28 mi / 6:06 per mi; 11:10.9 cooldown / 1.32 mi / 8:29 per mi; total 51:10.9 / 7.02 mi / 7:17 per mi. Garmin best-effort panel reported new 18:56 5K PR on Oct 13, previous 19:31. Athlete described opening around 6:20 per mi, gradual acceleration to approximately 6:05 then 6:00/5:50 near the finish; breathing felt controlled mid-run and legs felt fresh shortly afterward. These are athlete reports, not verified splits or lactate measurements. Athlete also reported a hard lower-body workout Oct 12 and expects soreness; recovery not yet verified.',
       'coach_import',coach)
    RETURNING id INTO completed;
  END IF;

  -- Structured segments preserve exact Garmin work versus warmup/cooldown.
  IF NOT EXISTS (SELECT 1 FROM public.session_pieces WHERE completion_id=completed) THEN
    INSERT INTO public.session_pieces
      (athlete_id,completion_id,position,kind,distance,distance_unit,duration_seconds,pace_seconds,duration_seconds_exact)
    VALUES
      (athlete,completed,1,'warmup',2.43,'mi',1200,495,1200.0),
      (athlete,completed,2,'rep',3.28,'mi',1200,366,1200.0),
      (athlete,completed,3,'cooldown',1.32,'mi',671,509,670.9);
  END IF;

  -- Thursday now carries the previously prescribed five-mile controlled race-pace work.
  SELECT id INTO STRICT sess FROM public.planned_sessions
    WHERE athlete_id=athlete AND scheduled_on='2026-10-15' AND state='published';
  SELECT id INTO ver FROM public.planned_session_versions
    WHERE planned_session_id=sess AND change_reason='FORM-JOSE-OCT13-20261013: swap Thursday to five continuous controlled race-pace miles'
    LIMIT 1;
  IF ver IS NULL THEN
    INSERT INTO public.planned_session_versions
     (athlete_id,planned_session_id,version_number,title,intent,details,change_reason,rpe_low,rpe_high,authored_by,shape)
    VALUES (athlete,sess,
      (SELECT max(version_number)+1 FROM public.planned_session_versions WHERE planned_session_id=sess),
      '5 mi continuous at race pace · if recovered',
      'Practice a steady half-marathon rhythm after Tuesday; a durability check, not an all-out 5K or punishment.',
      'If legs and easy running feel normal after Tuesday and Monday leg strength: 20 min easy, then 5 continuous miles at 6:40–6:45/mi, followed by 10 min easy. Start around 6:45, no fast finish or catch-up surges. Ask about leg effort, breathing, drift and next-day recovery. If sore or unusually taxed, replace with 40 min easy or rest. Do not add miles to compensate for the missed weekend long run.',
      'FORM-JOSE-OCT13-20261013: swap Thursday to five continuous controlled race-pace miles',
      6,7,coach,'20 min easy + 5 mi continuous + 10 min easy')
    RETURNING id INTO ver;
    INSERT INTO public.planned_session_components
      (athlete_id,version_id,position,role,shape,duration_seconds,distance,distance_unit,pace_low,pace_high,pace_low_seconds,pace_high_seconds)
    VALUES
      (athlete,ver,1,'warm_up','continuous',1200,null,null,null,null,null,null),
      (athlete,ver,2,'work','continuous',null,5,'mi','6:40','6:45',400,405),
      (athlete,ver,3,'cool_down','continuous',600,null,null,null,null,null,null);
  END IF;
  UPDATE public.planned_sessions SET override_reason='October 13 approved swap: five-mile continuous race-pace session on Thursday, recovery gated'
    WHERE id=sess AND override_reason IS DISTINCT FROM 'October 13 approved swap: five-mile continuous race-pace session on Thursday, recovery gated';

  -- Easy days are recovery space, not seven-mile obligations in the agreed down week.
  FOR rec IN SELECT p.id,p.scheduled_on,v.version_number
    FROM public.planned_sessions p JOIN LATERAL
    (SELECT version_number FROM public.planned_session_versions v WHERE v.planned_session_id=p.id ORDER BY version_number DESC LIMIT 1) v ON true
    WHERE p.athlete_id=athlete AND p.state='published' AND p.scheduled_on IN ('2026-10-14','2026-10-16')
  LOOP
    IF NOT EXISTS (SELECT 1 FROM public.planned_session_versions
                   WHERE planned_session_id=rec.id AND change_reason='FORM-JOSE-OCT13-20261013: down-week optional recovery') THEN
      INSERT INTO public.planned_session_versions
        (athlete_id,planned_session_id,version_number,title,prescribed_duration_minutes,intent,details,change_reason,rpe_low,rpe_high,authored_by)
      VALUES (athlete,rec.id,rec.version_number+1,'Easy recovery · 40 min or rest',40,
        'Absorb quality and keep the down week honest.',
        '40 minutes very easy, or rest if sore or tired. Conversational, no faster than 8:00/mi as an upper pace limit, not a pace to chase. No added volume for Saturday.',
        'FORM-JOSE-OCT13-20261013: down-week optional recovery',2,4,coach)
      RETURNING id INTO ver;
      INSERT INTO public.planned_session_components(athlete_id,version_id,position,role,shape,duration_seconds)
      VALUES(athlete,ver,1,'work','continuous',2400);
    END IF;
  END LOOP;

  -- José and Brice agreed Saturday is off for travel. Preserve its historical version.
  UPDATE public.planned_sessions
    SET state='cancelled',withdrawn_reason='Oct 13 agreed consolidation week: anniversary trip; Saturday long run removed without make-up',withdrawn_at=now(),withdrawn_by=coach,
        override_reason='No Saturday long run; recovery and travel week'
    WHERE athlete_id=athlete AND scheduled_on='2026-10-17' AND state='published';

  IF NOT EXISTS (SELECT 1 FROM public.athlete_observations WHERE athlete_id=athlete
    AND observation LIKE 'FORM-JOSE-OCT13-20261013-RESULT.%') THEN
    INSERT INTO public.athlete_observations
      (athlete_id,facet,source,observation,direction,observed_on,authored_by,evidence_completion_ids)
    VALUES
      (athlete,'practice','coach_observed',
      'FORM-JOSE-OCT13-20261013-RESULT. Garmin screenshots provided by coach show 20:00 continuous work, 3.28 mi at displayed 6:06/mi, plus 20:00 / 2.43 mi warm-up and 11:10.9 / 1.32 mi cooldown; total 7.02 mi in 51:10.9. Garmin marked 18:56 as an all-time 5K best effort compared with prior 19:31. This is a detected effort nested in the workout, not a separately raced 5K. José reports negative progression within the 20 minutes, unexpectedly controlled breathing, improved confidence, favorable weather and fresh legs shortly after; also did strenuous leg work Oct 12 and anticipates soreness. Athlete report is not independently verified pace splits or a measured threshold. Outcome strengthens evidence of present sustained speed but cannot isolate effects of training, continuity, weather, effort, shoes, electrolytes or recovery. Latest six-mile continuous half-marathon race-pace mark remains six miles; speed workout does not increment that mark.',
      'no_clear_change','2026-10-13',coach,ARRAY[completed]);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.athlete_observations WHERE athlete_id=athlete
    AND observation LIKE 'FORM-JOSE-OCT13-20261013-DECISION.%') THEN
    INSERT INTO public.athlete_observations
      (athlete_id,facet,source,observation,direction,observed_on,authored_by,evidence_completion_ids)
    VALUES
      (athlete,'practice','coach_observed',
      'FORM-JOSE-OCT13-20261013-DECISION. Owner-approved Tuesday/Thursday swap: Oct 13 20-minute continuous speed-development session completed; Oct 15 five continuous miles at 6:40–6:45/mi only with normal legs and recovery; Wed/Fri 40 min optional easy or rest; Oct 17 thirteen-mile long run cancelled due anniversary travel and deload, no replacement mileage. Oct 20 eight continuous race-pace miles remains a conditional checkpoint, not newly earned by today. Preserve RPD band and six-mile ownership mark. Future block may explore 5:50/mi tempo speed only after repeatability and recovery; not a current required target. Review Thursday leg vs breathing effort and recovery before advancing.',
      'no_clear_change','2026-10-13',coach,ARRAY[completed]);
  END IF;
  -- Reconcile the older RPD mark against the already documented Sep 29 six-mile
  -- continuous evidence. Today's 20-minute speed effort does not advance this mark.
  UPDATE public.athlete_marks
    SET current_value=6,
        current_question='Can José hold eight uninterrupted miles at 6:40–6:45/mi with controlled effort and normal recovery?',
        next_test='Eight continuous miles at race pace on October 20, only if recovered; no catch-up surges.',
        claim_note='Sep 29 coach-documented Garmin result: six continuous miles in 39:16.0 at 6:33/mi. Oct 13 faster 20-minute tempo and 18:56 Garmin 5K best effort are separate capacity evidence.'
    WHERE athlete_id=athlete AND active AND label='continuous at race pace'
      AND current_value < 6;

END $$;