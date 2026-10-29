-- The Athletic Life: private experiment register, not an athlete record or event system.
-- No records, invitations, media permissions or future commitments are seeded.
BEGIN;

CREATE TABLE public.athletic_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  idea_number smallint CHECK (idea_number BETWEEN 1 AND 20),
  title text NOT NULL CHECK (length(trim(title)) BETWEEN 1 AND 240),
  category text NOT NULL CHECK (category IN ('experience','connection','development','creative','commercial','product')),
  hypothesis text NOT NULL CHECK (length(trim(hypothesis)) BETWEEN 1 AND 4000),
  next_test text NOT NULL DEFAULT '' CHECK (length(next_test) <= 3000),
  beneficiary_note text NOT NULL DEFAULT '' CHECK (length(beneficiary_note) <= 2000),
  next_action text NOT NULL DEFAULT '' CHECK (length(next_action) <= 2000),
  status text NOT NULL DEFAULT 'candidate'
    CHECK (status IN ('candidate','ready','active','completed','parked')),
  estimated_hours numeric(7,2) CHECK (estimated_hours BETWEEN 0 AND 9999),
  estimated_cost_usd numeric(12,2) CHECK (estimated_cost_usd BETWEEN 0 AND 9999999),
  review_on date,
  approval_note text NOT NULL DEFAULT '' CHECK (length(approval_note) <= 2000),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  started_at timestamptz,
  closed_at timestamptz,
  evidence text NOT NULL DEFAULT '' CHECK (length(evidence) <= 6000),
  learning text NOT NULL DEFAULT '' CHECK (length(learning) <= 4000),
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs)='array'),
  revision integer NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((approved_by IS NULL) = (approved_at IS NULL)),
  CHECK (status NOT IN ('ready','active') OR
    (approved_by IS NOT NULL AND length(trim(approval_note)) > 0
      AND length(trim(next_test)) > 0 AND estimated_hours IS NOT NULL
      AND estimated_cost_usd IS NOT NULL)),
  CHECK (status <> 'completed' OR
    (length(trim(evidence)) > 0 AND length(trim(learning)) > 0))
);

COMMENT ON TABLE public.athletic_opportunities IS
  'Private coach-owned experiment decisions. Activities, RSVP, athlete records, permissions, payments and media are owned by their existing systems; nothing here executes them.';
CREATE INDEX athletic_opportunities_owner_status
  ON public.athletic_opportunities(owner_id,status,review_on,updated_at DESC);

ALTER TABLE public.athletic_opportunities ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.athletic_opportunities FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE ON public.athletic_opportunities TO authenticated;
GRANT ALL ON public.athletic_opportunities TO service_role;

CREATE POLICY athletic_opportunities_read ON public.athletic_opportunities
  FOR SELECT TO authenticated
  USING (owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY athletic_opportunities_insert ON public.athletic_opportunities
  FOR INSERT TO authenticated
  WITH CHECK (owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY athletic_opportunities_update ON public.athletic_opportunities
  FOR UPDATE TO authenticated
  USING (owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())))
  WITH CHECK (owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));

CREATE FUNCTION public.athletic_opportunity_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE active_count integer;
BEGIN
  IF TG_OP='INSERT' AND NEW.status<>'candidate' THEN
    RAISE EXCEPTION 'New opportunities must begin as candidates' USING ERRCODE='23514';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
      (OLD.status='candidate' AND NEW.status IN ('ready','parked')) OR
      (OLD.status='ready' AND NEW.status IN ('candidate','active','parked')) OR
      (OLD.status='active' AND NEW.status IN ('completed','parked')) OR
      (OLD.status='parked' AND NEW.status='candidate')
    ) THEN RAISE EXCEPTION 'Invalid opportunity state transition' USING ERRCODE='23514'; END IF;
    -- Changes to the proposed work must go back through explicit approval.
    IF (NEW.title,NEW.category,NEW.hypothesis,NEW.next_test,NEW.beneficiary_note,NEW.estimated_hours,NEW.estimated_cost_usd,NEW.approval_note)
      IS DISTINCT FROM
       (OLD.title,OLD.category,OLD.hypothesis,OLD.next_test,OLD.beneficiary_note,OLD.estimated_hours,OLD.estimated_cost_usd,OLD.approval_note)
      AND OLD.approved_at IS NOT NULL THEN
      IF NEW.status IN ('ready','active') THEN
        RAISE EXCEPTION 'Scope changed. Return to candidate before seeking approval again' USING ERRCODE='23514';
      END IF;
      NEW.approved_by:=NULL; NEW.approved_at:=NULL;
    END IF;
    IF NEW.status='candidate' AND OLD.status<>'candidate' THEN
      NEW.approved_by:=NULL; NEW.approved_at:=NULL;
    END IF;
  END IF;

  IF NEW.approved_at IS NOT NULL AND current_user NOT IN ('postgres','service_role')
    AND NEW.approved_by IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Approval must come from the signed-in owner' USING ERRCODE='42501';
  END IF;

  IF NEW.status='active' AND (TG_OP='INSERT' OR OLD.status<>'active') THEN
    -- Serialize two simultaneous Start clicks for this owner.
    PERFORM pg_advisory_xact_lock(hashtextextended(NEW.owner_id::text,20261029));
    SELECT count(*) INTO active_count FROM public.athletic_opportunities o
      WHERE o.owner_id=NEW.owner_id AND o.status='active' AND o.id<>NEW.id;
    IF active_count>=2 THEN
      RAISE EXCEPTION 'Two experiments are already active. Complete or park one first' USING ERRCODE='23514';
    END IF;
    NEW.started_at:=now();
  END IF;
  IF NEW.status IN ('completed','parked') AND (TG_OP='INSERT' OR OLD.status<>NEW.status)
    THEN NEW.closed_at:=now();
  ELSIF NEW.status IN ('candidate','ready','active') THEN NEW.closed_at:=NULL;
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.athletic_opportunity_guard() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER athletic_opportunity_guard_before
  BEFORE INSERT OR UPDATE ON public.athletic_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.athletic_opportunity_guard();
CREATE TRIGGER athletic_opportunity_stamp_before
  BEFORE INSERT OR UPDATE ON public.athletic_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.operating_record_stamp();
CREATE TRIGGER athletic_opportunity_audit_after
  AFTER INSERT OR UPDATE ON public.athletic_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.operating_record_audit();

CREATE FUNCTION public.athletic_opportunities_read(
  p_owner_id uuid DEFAULT auth.uid()
) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
  IF p_owner_id IS NULL OR NOT public.is_active_coaching_administrator(p_owner_id) THEN
    RAISE EXCEPTION 'Private coach access required' USING ERRCODE='42501';
  END IF;
  IF current_user NOT IN ('postgres','service_role') AND p_owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Private coach access required' USING ERRCODE='42501';
  END IF;
  RETURN jsonb_build_object(
    'schema_version',1,
    'read_at',now(),
    'items',coalesce((
      SELECT jsonb_agg(to_jsonb(o) ORDER BY
        CASE o.status WHEN 'active' THEN 0 WHEN 'ready' THEN 1 WHEN 'candidate' THEN 2 ELSE 3 END,
        o.review_on NULLS LAST,o.updated_at DESC)
      FROM public.athletic_opportunities o WHERE o.owner_id=p_owner_id
    ),'[]'::jsonb)
  );
END $$;
REVOKE ALL ON FUNCTION public.athletic_opportunities_read(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.athletic_opportunities_read(uuid) TO authenticated,service_role;
COMMENT ON FUNCTION public.athletic_opportunities_read(uuid) IS
  'Authorized private opportunity register. Read-only; does not authorize outreach, bookings, spending, athlete changes or publication.';
COMMIT;
