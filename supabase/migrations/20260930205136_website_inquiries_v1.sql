-- Website inquiries v1: a constrained public write into the existing private
-- operating console. No new lead table, private reads, or customer-chosen owner.
BEGIN;
CREATE SCHEMA IF NOT EXISTS website_intake;
REVOKE ALL ON SCHEMA website_intake FROM PUBLIC;
GRANT USAGE ON SCHEMA website_intake TO anon,authenticated,service_role;

CREATE FUNCTION website_intake.submit(p_submission_id uuid,p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE
  v_owner uuid; v_owners integer; v_offer text; v_label text;
  v_name text; v_email text; v_location text; v_message text;
  v_refs jsonb; v_now timestamptz:=now();
BEGIN
  IF p_submission_id IS NULL OR jsonb_typeof(p_payload) IS DISTINCT FROM 'object'
     OR octet_length(p_payload::text)>7000 THEN
    RAISE EXCEPTION 'Invalid inquiry' USING ERRCODE='22023';
  END IF;
  IF coalesce(p_payload->>'company_website','')<>'' THEN
    RAISE EXCEPTION 'Invalid inquiry' USING ERRCODE='22023';
  END IF;
  v_offer:=p_payload->>'offer';
  v_label:=CASE v_offer WHEN 'run' THEN 'Run Development' WHEN 'both' THEN 'Run + Strength'
    WHEN 'remote' THEN 'Remote Run Development' WHEN 'strength' THEN 'Strength coaching'
    WHEN 'strength-first' THEN 'Strength first session' WHEN 'analysis' THEN 'FORM Analysis'
    WHEN 'photo' THEN 'Fitness photography' WHEN 'ai' THEN 'AI operations setup' ELSE NULL END;
  v_name:=trim(coalesce(p_payload->>'name',''));
  v_email:=lower(trim(coalesce(p_payload->>'email','')));
  v_location:=trim(coalesce(p_payload->>'location',''));
  v_message:=trim(coalesce(p_payload->>'message',''));
  IF v_label IS NULL OR length(v_name)>120 OR length(v_email)>254
     OR v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
     OR length(v_location) NOT BETWEEN 1 AND 240
     OR length(v_message) NOT BETWEEN 3 AND 3000 THEN
    RAISE EXCEPTION 'Check your email, location and inquiry' USING ERRCODE='22023';
  END IF;
  SELECT count(*) INTO v_owners FROM public.operating_sources s
    WHERE s.source_key='website-inquiries-v1' AND s.state='live'
      AND public.is_active_coaching_administrator(s.owner_id);
  IF v_owners<>1 THEN RAISE EXCEPTION 'Inquiry unavailable; please email Brice' USING ERRCODE='55000'; END IF;
  SELECT s.owner_id INTO v_owner FROM public.operating_sources s
    WHERE s.source_key='website-inquiries-v1' AND s.state='live'
      AND public.is_active_coaching_administrator(s.owner_id);
  -- Serializes retries and rate checks without exposing prior records.
  PERFORM pg_catalog.pg_advisory_xact_lock(173204,1);
  IF EXISTS(SELECT 1 FROM public.operating_items WHERE owner_id=v_owner
      AND item_key='website-inquiry:'||p_submission_id::text) THEN
    RETURN jsonb_build_object('accepted',true,'submission_id',p_submission_id,'version',1);
  END IF;
  IF (SELECT count(*) FROM public.operating_items WHERE owner_id=v_owner
      AND item_key LIKE 'website-inquiry:%' AND created_at>v_now-interval '1 hour')>=40
     OR (SELECT count(*) FROM public.operating_items WHERE owner_id=v_owner
      AND item_key LIKE 'website-inquiry:%' AND created_at>v_now-interval '24 hours'
      AND source_refs->0->>'email'=v_email)>=5 THEN
    RAISE EXCEPTION 'Please email Brice to continue this inquiry' USING ERRCODE='P0001';
  END IF;
  v_refs:=jsonb_build_array(jsonb_build_object('type','website-inquiry','schema_version',1,
    'submission_id',p_submission_id,'offer',v_offer,'email',v_email,
    'landing_path',left(coalesce(p_payload->>'landing_path',''),240),
    'utm_source',left(coalesce(p_payload->>'utm_source',''),120),
    'utm_medium',left(coalesce(p_payload->>'utm_medium',''),120),
    'utm_campaign',left(coalesce(p_payload->>'utm_campaign',''),120),
    'utm_content',left(coalesce(p_payload->>'utm_content',''),120)));
  INSERT INTO public.operating_items(owner_id,item_key,kind,area,title,body,next_action,
    status,actor,priority,due_on,review_on,source_refs,observed_at)
  VALUES(v_owner,'website-inquiry:'||p_submission_id::text,'task',
    CASE WHEN v_offer IN ('photo','ai') THEN 'money' ELSE 'coaching' END,
    v_label||' inquiry'||CASE WHEN v_name<>'' THEN ': '||v_name ELSE '' END,
    'WEBSITE INQUIRY · '||v_label||E'\nName: '||v_name||E'\nEmail: '||v_email||
    E'\nLocation: '||v_location||E'\n\n'||v_message||E'\n\nInquiry only. No payment, booking, or athlete membership created.',
    'Reply to the inquiry, confirm fit and availability, then agree on scope and any travel/access cost before payment.',
    'queued','brice',25,(v_now AT TIME ZONE 'America/New_York')::date+1,
    (v_now AT TIME ZONE 'America/New_York')::date+1,v_refs,v_now);
  RETURN jsonb_build_object('accepted',true,'submission_id',p_submission_id,'version',1);
END $$;
REVOKE ALL ON FUNCTION website_intake.submit(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION website_intake.submit(uuid,jsonb) TO anon,authenticated,service_role;

CREATE FUNCTION public.submit_website_inquiry(p_submission_id uuid,p_payload jsonb)
RETURNS jsonb LANGUAGE sql SECURITY INVOKER SET search_path=''
AS $$ SELECT website_intake.submit(p_submission_id,p_payload); $$;
REVOKE ALL ON FUNCTION public.submit_website_inquiry(uuid,jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_website_inquiry(uuid,jsonb) TO anon,authenticated,service_role;
COMMENT ON FUNCTION public.submit_website_inquiry(uuid,jsonb) IS 'Website inquiry v1. Validated create-only receipt into an explicitly configured private operating console; no lead reads, owner selection or payment.';
COMMIT;
