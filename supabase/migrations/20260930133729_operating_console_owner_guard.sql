BEGIN;
CREATE FUNCTION public.operating_console_owner() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public,pg_temp AS $$ SELECT public.is_active_coaching_administrator(auth.uid()); $$;
REVOKE ALL ON FUNCTION public.operating_console_owner() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.operating_console_owner() TO authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.is_active_coaching_administrator(uuid) TO service_role;
ALTER POLICY operating_items_read ON public.operating_items USING(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner()));
ALTER POLICY operating_items_insert ON public.operating_items WITH CHECK(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner()));
ALTER POLICY operating_items_update ON public.operating_items USING(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner())) WITH CHECK(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner()));
ALTER POLICY operating_sources_read ON public.operating_sources USING(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner()));
ALTER POLICY operating_sources_insert ON public.operating_sources WITH CHECK(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner()));
ALTER POLICY operating_sources_update ON public.operating_sources USING(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner())) WITH CHECK(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner()));
ALTER POLICY operating_changes_read ON public.operating_changes USING(owner_id=(SELECT auth.uid()) AND (SELECT public.operating_console_owner()));
DO $$ DECLARE definition text; old_guard text:='IF p_owner_id IS NULL OR NOT public.is_active_coaching_administrator(p_owner_id) THEN RAISE EXCEPTION ''Operating console owner access required'' USING ERRCODE=''42501''; END IF;'; new_guard text:='IF p_owner_id IS NULL THEN RAISE EXCEPTION ''Operating console owner access required'' USING ERRCODE=''42501''; END IF; IF current_user IN (''postgres'',''service_role'') THEN IF NOT public.is_active_coaching_administrator(p_owner_id) THEN RAISE EXCEPTION ''Operating console owner access required'' USING ERRCODE=''42501''; END IF; ELSE IF NOT public.operating_console_owner() THEN RAISE EXCEPTION ''Operating console owner access required'' USING ERRCODE=''42501''; END IF; END IF;'; BEGIN
 SELECT pg_get_functiondef('public.operating_console_read(uuid,date)'::regprocedure) INTO definition;
 IF strpos(definition,old_guard)=0 THEN RAISE EXCEPTION 'Unexpected operating reader version'; END IF;
 EXECUTE replace(definition,old_guard,new_guard);
END $$;
COMMIT;
