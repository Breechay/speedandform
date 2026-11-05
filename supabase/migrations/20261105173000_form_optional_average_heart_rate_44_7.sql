-- 44.7 · Optional athlete-entered average heart rate.
-- Additive only; no production apply until the 44.7 backend/native gate is approved.
-- Old installed clients retain their existing RPC signatures.
-- New clients ALWAYS include p_average_heart_rate_bpm (a number or JSON null).
-- No HealthKit, derived zone, or interpretation; this is a raw athlete-reported fact.

ALTER TABLE public.session_completions
  ADD COLUMN IF NOT EXISTS average_heart_rate_bpm smallint;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'session_completions_average_hr_range'
      AND conrelid = 'public.session_completions'::regclass
  ) THEN
    ALTER TABLE public.session_completions
      ADD CONSTRAINT session_completions_average_hr_range
      CHECK (average_heart_rate_bpm IS NULL OR average_heart_rate_bpm BETWEEN 25 AND 240);
  END IF;
END $$;

-- The HR parameter is REQUIRED in this overload, but may be null. This ensures
-- PostgREST routes old clients to the original RPC and new ones here without
-- changing or dropping the original functions.
CREATE OR REPLACE FUNCTION public.record_session_from_form(
    p_evidence_id text,
    p_status text,
    p_average_heart_rate_bpm integer,
    p_planned_session_id uuid DEFAULT NULL::uuid,
    p_actual_distance numeric DEFAULT NULL::numeric,
    p_distance_unit text DEFAULT 'mi'::text,
    p_duration_seconds integer DEFAULT NULL::integer,
    p_rpe integer DEFAULT NULL::integer,
    p_athlete_note text DEFAULT NULL::text,
    p_symptoms text DEFAULT NULL::text,
    p_surface text DEFAULT NULL::text,
    p_conditions text DEFAULT NULL::text,
    p_filed_at timestamptz DEFAULT NULL::timestamptz,
    p_pieces jsonb DEFAULT '[]'::jsonb,
    p_planned_session_version_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $hr_filing$
DECLARE
    v_completion_id uuid;
BEGIN
    IF p_average_heart_rate_bpm IS NOT NULL
       AND p_average_heart_rate_bpm NOT BETWEEN 25 AND 240 THEN
        RAISE EXCEPTION 'Average heart rate must be 25–240 bpm or null'
            USING ERRCODE = '22023';
    END IF;

    -- The original door retains identity, ownership, idempotency, and piece checks.
    -- Named arguments intentionally exclude the new HR field, avoiding an
    -- overloaded positional call.
    v_completion_id := public.record_session_from_form(
        p_evidence_id => p_evidence_id,
        p_status => p_status,
        p_planned_session_id => p_planned_session_id,
        p_actual_distance => p_actual_distance,
        p_distance_unit => p_distance_unit,
        p_duration_seconds => p_duration_seconds,
        p_rpe => p_rpe,
        p_athlete_note => p_athlete_note,
        p_symptoms => p_symptoms,
        p_surface => p_surface,
        p_conditions => p_conditions,
        p_filed_at => p_filed_at,
        p_pieces => p_pieces,
        p_planned_session_version_id => p_planned_session_version_id
    );

    -- A delayed original retry must never erase a later athlete correction.
    IF NOT EXISTS (
        SELECT 1 FROM public.athlete_filing_corrections c
        WHERE c.completion_id = v_completion_id
    ) THEN
        UPDATE public.session_completions
           SET average_heart_rate_bpm =
                   COALESCE(p_average_heart_rate_bpm, average_heart_rate_bpm)
         WHERE id = v_completion_id;
    END IF;
    RETURN v_completion_id;
END;
$hr_filing$;

CREATE OR REPLACE FUNCTION public.record_session_correction_from_form(
    p_evidence_id text,
    p_receipt_revision integer,
    p_status text,
    p_average_heart_rate_bpm integer,
    p_planned_session_id uuid DEFAULT NULL::uuid,
    p_actual_distance numeric DEFAULT NULL::numeric,
    p_distance_unit text DEFAULT 'mi'::text,
    p_duration_seconds integer DEFAULT NULL::integer,
    p_rpe integer DEFAULT NULL::integer,
    p_athlete_note text DEFAULT NULL::text,
    p_symptoms text DEFAULT NULL::text,
    p_surface text DEFAULT NULL::text,
    p_conditions text DEFAULT NULL::text,
    p_filed_at timestamptz DEFAULT NULL::timestamptz,
    p_pieces jsonb DEFAULT '[]'::jsonb,
    p_planned_session_version_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $hr_correction$
DECLARE
    v_completion_id uuid;
BEGIN
    IF p_average_heart_rate_bpm IS NOT NULL
       AND p_average_heart_rate_bpm NOT BETWEEN 25 AND 240 THEN
        RAISE EXCEPTION 'Average heart rate must be 25–240 bpm or null'
            USING ERRCODE = '22023';
    END IF;

    v_completion_id := public.record_session_correction_from_form(
        p_evidence_id => p_evidence_id,
        p_receipt_revision => p_receipt_revision,
        p_status => p_status,
        p_planned_session_id => p_planned_session_id,
        p_actual_distance => p_actual_distance,
        p_distance_unit => p_distance_unit,
        p_duration_seconds => p_duration_seconds,
        p_rpe => p_rpe,
        p_athlete_note => p_athlete_note,
        p_symptoms => p_symptoms,
        p_surface => p_surface,
        p_conditions => p_conditions,
        p_filed_at => p_filed_at,
        p_pieces => p_pieces,
        p_planned_session_version_id => p_planned_session_version_id
    );

    -- A stale correction retry cannot overwrite HR from a newer accepted
    -- receipt. Unlike an initial filing, the newest correction can clear HR.
    IF EXISTS (
        SELECT 1 FROM public.athlete_filing_corrections c
        WHERE c.completion_id = v_completion_id
          AND c.receipt_revision = p_receipt_revision
          AND c.receipt_revision = (
              SELECT max(newest.receipt_revision)
              FROM public.athlete_filing_corrections newest
              WHERE newest.completion_id = v_completion_id
          )
    ) THEN
        UPDATE public.session_completions
           SET average_heart_rate_bpm = p_average_heart_rate_bpm
         WHERE id = v_completion_id;
    END IF;
    RETURN v_completion_id;
END;
$hr_correction$;

REVOKE ALL ON FUNCTION public.record_session_from_form(
  text,text,integer,uuid,numeric,text,integer,integer,text,text,text,text,timestamptz,jsonb,uuid
) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.record_session_correction_from_form(
  text,integer,text,integer,uuid,numeric,text,integer,integer,text,text,text,text,timestamptz,jsonb,uuid
) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_session_from_form(
  text,text,integer,uuid,numeric,text,integer,integer,text,text,text,text,timestamptz,jsonb,uuid
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_session_correction_from_form(
  text,integer,text,integer,uuid,numeric,text,integer,integer,text,text,text,text,timestamptz,jsonb,uuid
) TO authenticated;

COMMENT ON COLUMN public.session_completions.average_heart_rate_bpm
  IS 'Optional athlete-reported session average bpm (25–240); no inferred heart-rate zones.';
-- Ensure PostgREST discovers the new named-argument overload before the 44.7 app ships.
NOTIFY pgrst, 'reload schema';
