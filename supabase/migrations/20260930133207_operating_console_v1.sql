-- Private operating work. Athlete prescriptions and evidence remain in existing FORM tables.
-- No personal data is seeded by this migration. The browser uses the existing FORM auth session.
BEGIN;
CREATE TABLE public.operating_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  item_key text NOT NULL,
  kind text NOT NULL DEFAULT 'task' CHECK (kind IN ('task','context','receipt')),
  area text NOT NULL CHECK (area IN ('training','coaching','money','form','home','learning')),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 240),
  body text NOT NULL DEFAULT '' CHECK (length(body)<=12000),
  next_action text NOT NULL DEFAULT '' CHECK (length(next_action)<=2000),
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','active','waiting','done','cancelled')),
  actor text NOT NULL DEFAULT 'brice' CHECK (actor IN ('brice','agent','other')),
  priority smallint NOT NULL DEFAULT 50 CHECK (priority BETWEEN 1 AND 100),
  focus_on date,
  due_on date,
  review_on date,
  waiting_on text,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(source_refs)='array'),
  observed_at timestamptz,
  expires_at timestamptz,
  revision integer NOT NULL DEFAULT 1 CHECK (revision>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(owner_id,item_key),
  CHECK (status <> 'waiting' OR length(trim(coalesce(waiting_on,'')))>0)
);
CREATE INDEX operating_items_owner_state ON public.operating_items(owner_id,status,priority);
CREATE TABLE public.operating_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id),
  source_key text NOT NULL,
  label text NOT NULL,
  authority text NOT NULL,
  locator text NOT NULL,
  state text NOT NULL CHECK (state IN ('live','snapshot','conflict','unavailable','pending')),
  detail text NOT NULL DEFAULT '',
  observed_at timestamptz,
  source_as_of timestamptz,
  expires_at timestamptz,
  revision integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(owner_id,source_key)
);
CREATE TABLE public.operating_changes (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  record_table text NOT NULL,
  record_id uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by uuid,
  operation text NOT NULL,
  before_record jsonb,
  after_record jsonb NOT NULL
);
CREATE INDEX operating_changes_owner_time ON public.operating_changes(owner_id,changed_at DESC);

ALTER TABLE public.operating_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.operating_items, public.operating_sources, public.operating_changes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.operating_items, public.operating_sources TO authenticated;
GRANT SELECT ON public.operating_changes TO authenticated;
GRANT ALL ON public.operating_items, public.operating_sources, public.operating_changes TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.operating_changes_id_seq TO service_role;

CREATE POLICY operating_items_read ON public.operating_items FOR SELECT TO authenticated
  USING(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY operating_items_insert ON public.operating_items FOR INSERT TO authenticated
  WITH CHECK(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY operating_items_update ON public.operating_items FOR UPDATE TO authenticated
  USING(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())))
  WITH CHECK(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY operating_sources_read ON public.operating_sources FOR SELECT TO authenticated
  USING(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY operating_sources_insert ON public.operating_sources FOR INSERT TO authenticated
  WITH CHECK(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY operating_sources_update ON public.operating_sources FOR UPDATE TO authenticated
  USING(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())))
  WITH CHECK(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));
CREATE POLICY operating_changes_read ON public.operating_changes FOR SELECT TO authenticated
  USING(owner_id=(SELECT auth.uid()) AND public.is_active_coaching_administrator((SELECT auth.uid())));

CREATE FUNCTION public.operating_record_stamp() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
  IF TG_OP='UPDATE' THEN
    IF NEW.owner_id IS DISTINCT FROM OLD.owner_id OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'Operating record identity cannot change' USING ERRCODE='42501';
    END IF;
    NEW.revision:=OLD.revision+1;
    NEW.created_at:=OLD.created_at;
  ELSE NEW.revision:=1; END IF;
  NEW.updated_at:=now();
  IF TG_TABLE_NAME='operating_items' THEN
    IF NEW.status='done' THEN NEW.completed_at:=coalesce(NEW.completed_at,now());
    ELSE NEW.completed_at:=NULL; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION public.operating_record_audit() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$
BEGIN
  INSERT INTO public.operating_changes(owner_id,record_table,record_id,changed_by,operation,before_record,after_record)
  VALUES(NEW.owner_id,TG_TABLE_NAME,NEW.id,auth.uid(),TG_OP,
    CASE WHEN TG_OP='UPDATE' THEN to_jsonb(OLD) ELSE NULL END,to_jsonb(NEW));
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.operating_record_stamp(), public.operating_record_audit() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER operating_items_stamp BEFORE INSERT OR UPDATE ON public.operating_items FOR EACH ROW EXECUTE FUNCTION public.operating_record_stamp();
CREATE TRIGGER operating_items_audit AFTER INSERT OR UPDATE ON public.operating_items FOR EACH ROW EXECUTE FUNCTION public.operating_record_audit();
CREATE TRIGGER operating_sources_stamp BEFORE INSERT OR UPDATE ON public.operating_sources FOR EACH ROW EXECUTE FUNCTION public.operating_record_stamp();
CREATE TRIGGER operating_sources_audit AFTER INSERT OR UPDATE ON public.operating_sources FOR EACH ROW EXECUTE FUNCTION public.operating_record_audit();

CREATE FUNCTION public.operating_console_read(
  p_owner_id uuid DEFAULT auth.uid(),
  p_on date DEFAULT (now() AT TIME ZONE 'America/New_York')::date
) RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY INVOKER
SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE result jsonb;
BEGIN
  IF p_owner_id IS NULL OR NOT public.is_active_coaching_administrator(p_owner_id) THEN RAISE EXCEPTION 'Operating console owner access required' USING ERRCODE='42501'; END IF;
  IF current_user NOT IN ('postgres','service_role') AND p_owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Operating console owner access required' USING ERRCODE='42501';
  END IF;
  SELECT jsonb_build_object(
    'schema_version',1,'read_at',now(),'today',p_on,'timezone','America/New_York',
    'items',coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.priority,i.created_at) FROM public.operating_items i WHERE i.owner_id=p_owner_id),'[]'::jsonb),
    'priorities',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
      SELECT i.* FROM public.operating_items i WHERE i.owner_id=p_owner_id AND i.kind='task'
      AND i.actor='brice' AND i.status IN ('queued','active')
      AND ((i.focus_on IS NOT NULL AND i.focus_on<=p_on) OR (i.due_on IS NOT NULL AND i.due_on<=p_on))
      ORDER BY (i.focus_on=p_on) DESC NULLS LAST, i.priority, i.due_on NULLS LAST, i.created_at LIMIT 4
    )t),'[]'::jsonb),
    'sources',coalesce((SELECT jsonb_agg(CASE WHEN s.source_key='form-athletes' THEN to_jsonb(s)||jsonb_build_object('state','live','observed_at',now(),'expires_at',NULL) ELSE to_jsonb(s) END ORDER BY s.label) FROM public.operating_sources s WHERE s.owner_id=p_owner_id),'[]'::jsonb),
    'athletes',coalesce((SELECT jsonb_agg(jsonb_build_object('id',a.id,'slug',a.slug,'first_name',a.first_name,'program_name',a.program_name,'delivery',a.delivery) ORDER BY a.attention_position NULLS LAST,a.first_name)
      FROM public.athletes a WHERE a.active AND EXISTS(SELECT 1 FROM public.athlete_memberships m WHERE m.athlete_id=a.id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')),'[]'::jsonb),
    'decisions',coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.effective_on DESC,d.created_at DESC) FROM public.decisions d
      WHERE d.delivery_state IN ('published','delivered_externally') AND d.effective_on<=p_on
      AND EXISTS(SELECT 1 FROM public.athlete_memberships m WHERE m.athlete_id=d.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')),'[]'::jsonb),
    'coach_tasks',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.priority,t.due_on NULLS LAST) FROM public.coach_tasks t
      WHERE t.resolved_at IS NULL AND t.state<>'resolved' AND EXISTS(SELECT 1 FROM public.athlete_memberships m WHERE m.athlete_id=t.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')),'[]'::jsonb),
    'coach_todos',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.due_on NULLS LAST,t.position) FROM public.coach_todos t
      WHERE t.completed_at IS NULL AND EXISTS(SELECT 1 FROM public.athlete_memberships m WHERE m.athlete_id=t.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')),'[]'::jsonb),
    'appointments',coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.scheduled_on,w.time_local NULLS LAST) FROM public.coach_week_items w
      WHERE w.status<>'cancelled' AND w.scheduled_on BETWEEN p_on-1 AND p_on+14
      AND EXISTS(SELECT 1 FROM public.athlete_memberships m WHERE m.athlete_id=w.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')),'[]'::jsonb),
    'changes',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM (
      SELECT id,record_table,record_id,changed_at,operation,after_record->>'title' title,after_record->>'label' label,after_record->>'status' status,after_record->>'revision' revision
      FROM public.operating_changes WHERE owner_id=p_owner_id ORDER BY id DESC LIMIT 20)c),'[]'::jsonb)
  ) INTO result;
  RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.operating_console_read(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.operating_console_read(uuid,date) TO authenticated,service_role;
COMMENT ON FUNCTION public.operating_console_read(uuid,date) IS 'Shared private projection for web console and authorized daily brief. Not a prescription author or automatic external connector sync.';
COMMIT;
