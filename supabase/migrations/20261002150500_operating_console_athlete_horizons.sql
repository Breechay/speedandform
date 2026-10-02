BEGIN;

CREATE OR REPLACE FUNCTION public.operating_console_read(
  p_owner_id uuid DEFAULT auth.uid(),
  p_on date DEFAULT (now() AT TIME ZONE 'America/New_York')::date
) RETURNS jsonb
LANGUAGE plpgsql STABLE
SET search_path TO 'pg_catalog','public','pg_temp'
AS $function$
DECLARE result jsonb;
BEGIN
  IF p_owner_id IS NULL THEN
    RAISE EXCEPTION 'Operating console owner access required' USING ERRCODE='42501';
  END IF;
  IF current_user IN ('postgres','service_role') THEN
    IF NOT public.is_active_coaching_administrator(p_owner_id) THEN
      RAISE EXCEPTION 'Operating console owner access required' USING ERRCODE='42501';
    END IF;
  ELSE
    IF NOT public.operating_console_owner() THEN
      RAISE EXCEPTION 'Operating console owner access required' USING ERRCODE='42501';
    END IF;
  END IF;
  IF current_user NOT IN ('postgres','service_role') AND p_owner_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Operating console owner access required' USING ERRCODE='42501';
  END IF;

  SELECT jsonb_build_object(
    'schema_version',1,
    'read_at',now(),
    'today',p_on,
    'timezone','America/New_York',
    'items',coalesce((SELECT jsonb_agg(to_jsonb(i) ORDER BY i.priority,i.created_at)
      FROM public.operating_items i WHERE i.owner_id=p_owner_id),'[]'::jsonb),
    'priorities',coalesce((SELECT jsonb_agg(to_jsonb(t)) FROM (
      SELECT i.* FROM public.operating_items i
      WHERE i.owner_id=p_owner_id AND i.kind='task' AND i.actor='brice'
        AND i.status IN ('queued','active')
        AND ((i.focus_on IS NOT NULL AND i.focus_on<=p_on) OR (i.due_on IS NOT NULL AND i.due_on<=p_on))
      ORDER BY (i.focus_on=p_on) DESC NULLS LAST,i.priority,i.due_on NULLS LAST,i.created_at
      LIMIT 4
    ) t),'[]'::jsonb),
    'sources',coalesce((SELECT jsonb_agg(
      CASE WHEN s.source_key='form-athletes'
        THEN to_jsonb(s)||jsonb_build_object('state','live','observed_at',now(),'expires_at',NULL)
        ELSE to_jsonb(s) END ORDER BY s.label)
      FROM public.operating_sources s WHERE s.owner_id=p_owner_id),'[]'::jsonb),
    'athletes',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'id',a.id,'slug',a.slug,'first_name',a.first_name,'program_name',a.program_name,'delivery',a.delivery
    ) ORDER BY a.attention_position NULLS LAST,a.first_name)
      FROM public.athletes a
      WHERE a.active AND EXISTS(
        SELECT 1 FROM public.athlete_memberships m
        WHERE m.athlete_id=a.id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active'
      )),'[]'::jsonb),
    'athlete_blocks',coalesce((SELECT jsonb_agg(jsonb_build_object(
      'athlete_id',a.id,
      'first_name',a.first_name,
      'block_id',b.id,
      'name',b.name,
      'current_week',b.current_week,
      'total_weeks',b.total_weeks,
      'starts_on',b.starts_on,
      'ends_on',b.ends_on,
      'race_on',b.race_on,
      'race_name',b.race_name,
      'status',b.status
    ) ORDER BY b.ends_on NULLS LAST,a.first_name)
      FROM public.athletes a
      JOIN public.athlete_memberships m
        ON m.athlete_id=a.id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active'
      LEFT JOIN LATERAL (
        SELECT tb.* FROM public.training_blocks tb
        WHERE tb.athlete_id=a.id AND tb.status='active'
        ORDER BY tb.starts_on DESC NULLS LAST,tb.created_at DESC
        LIMIT 1
      ) b ON true
      WHERE a.active
    ),'[]'::jsonb),
    'decisions',coalesce((SELECT jsonb_agg(to_jsonb(d) ORDER BY d.effective_on DESC,d.created_at DESC)
      FROM public.decisions d
      WHERE d.delivery_state IN ('published','delivered_externally') AND d.effective_on<=p_on
        AND EXISTS(SELECT 1 FROM public.athlete_memberships m
          WHERE m.athlete_id=d.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')
    ),'[]'::jsonb),
    'coach_tasks',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.priority,t.due_on NULLS LAST)
      FROM public.coach_tasks t
      WHERE t.resolved_at IS NULL AND t.state<>'resolved'
        AND EXISTS(SELECT 1 FROM public.athlete_memberships m
          WHERE m.athlete_id=t.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')
    ),'[]'::jsonb),
    'coach_todos',coalesce((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.due_on NULLS LAST,t.position)
      FROM public.coach_todos t
      WHERE t.completed_at IS NULL
        AND EXISTS(SELECT 1 FROM public.athlete_memberships m
          WHERE m.athlete_id=t.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')
    ),'[]'::jsonb),
    'appointments',coalesce((SELECT jsonb_agg(to_jsonb(w) ORDER BY w.scheduled_on,w.time_local NULLS LAST)
      FROM public.coach_week_items w
      WHERE w.status<>'cancelled' AND w.scheduled_on BETWEEN p_on-1 AND p_on+14
        AND EXISTS(SELECT 1 FROM public.athlete_memberships m
          WHERE m.athlete_id=w.athlete_id AND m.user_id=p_owner_id AND m.role='coach' AND m.status='active')
    ),'[]'::jsonb),
    'changes',coalesce((SELECT jsonb_agg(to_jsonb(c)) FROM (
      SELECT id,record_table,record_id,changed_at,operation,
             after_record->>'title' title,after_record->>'label' label,
             after_record->>'status' status,after_record->>'revision' revision
      FROM public.operating_changes
      WHERE owner_id=p_owner_id
      ORDER BY id DESC LIMIT 20
    ) c),'[]'::jsonb)
  ) INTO result;

  RETURN result;
END
$function$;

REVOKE ALL ON FUNCTION public.operating_console_read(uuid,date) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.operating_console_read(uuid,date) TO authenticated,service_role;

COMMIT;
