-- A bounded, private index into the existing athlete owners. This does not
-- copy plans into a second database or authorize an agent to change them.
create function public.coach_agent_athlete_brief(p_athlete_id uuid)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $function$
declare payload jsonb;
begin
  if auth.uid() is null or not public.operating_console_owner()
    or not public.is_coach_member(p_athlete_id) then
    raise exception 'Authorized coach scope required' using errcode='42501';
  end if;

  select jsonb_build_object(
    'schema_version',1,
    'read_at',now(),
    'athlete',jsonb_build_object('id',a.id,'slug',a.slug,'display_name',a.display_name,
      'active',a.active,'identity_updated_at',a.updated_at),
    'active_block',(
      select jsonb_build_object('id',b.id,'name',b.name,'starts_on',b.starts_on,
        'ends_on',b.ends_on,'race_on',b.race_on,'source_as_of',b.updated_at)
        from public.training_blocks b where b.athlete_id=a.id and b.status='active'
        order by b.starts_on desc,b.created_at desc,b.id desc limit 1
    ),
    'current_week',(
      select jsonb_build_object('id',w.id,'starts_on',w.starts_on,'ends_on',w.ends_on,
        'intent',w.intent,'story_current',coach_audit_private.week_story_is_current(w.id),
        'source_as_of',w.updated_at)
        from public.training_weeks w join public.training_blocks b on b.id=w.block_id
        where b.athlete_id=a.id and b.status='active'
          and w.starts_on<=(now() at time zone 'America/New_York')::date
          and w.ends_on>=(now() at time zone 'America/New_York')::date
        order by w.starts_on desc,w.week_number desc limit 1
    ),
    'upcoming_sessions',coalesce((
      select jsonb_agg(jsonb_build_object('id',s.id,'scheduled_on',s.scheduled_on,
        'is_key',s.is_key,'state',s.state,'version_id',v.id,
        'version_number',v.version_number,'title',v.title,'rpe_low',v.rpe_low,
        'rpe_high',v.rpe_high,'prescribed_distance',v.prescribed_distance,
        'distance_unit',v.distance_unit,'source_as_of',v.created_at)
        order by s.scheduled_on,s.position)
        from public.planned_sessions s
        left join lateral (
          select x.* from public.planned_session_versions x
            where x.planned_session_id=s.id order by x.version_number desc,x.created_at desc limit 1
        ) v on true
        where s.athlete_id=a.id and s.state='published'
          and s.scheduled_on between (now() at time zone 'America/New_York')::date
             and (now() at time zone 'America/New_York')::date+7
    ),'[]'::jsonb),
    'recent_filings',coalesce((
      select jsonb_agg(jsonb_build_object('id',c.id,'planned_session_id',c.planned_session_id,
        'planned_session_version_id',c.planned_session_version_id,'status',c.status,
        'actual_distance',c.actual_distance,'distance_unit',c.distance_unit,
        'duration_seconds',c.duration_seconds,'source',c.source,
        'filed_at',c.filed_at,'source_as_of',c.updated_at) order by c.filed_at desc)
      from (select * from public.session_completions c where c.athlete_id=a.id
            order by c.filed_at desc limit 8) c
    ),'[]'::jsonb),
    'recent_measurements',coalesce((
      select jsonb_agg(jsonb_build_object('id',m.id,'type',m.measurement_type,
        'value',m.value,'unit',m.unit,'measured_at',m.measured_at,
        'source',m.source,'source_as_of',m.updated_at) order by m.measured_at desc)
      from (select * from public.athlete_measurements m where m.athlete_id=a.id
            order by m.measured_at desc,m.created_at desc limit 10) m
    ),'[]'::jsonb),
    'standing_observations',coalesce((
      select jsonb_agg(jsonb_build_object('id',o.id,'facet',o.facet,
        'source',o.source,'observation',o.observation,'direction',o.direction,
        'observed_on',o.observed_on,'created_at',o.created_at)
        order by o.observed_on desc,o.created_at desc)
      from (select o.* from public.athlete_observations o
        where o.athlete_id=a.id and not exists(
          select 1 from public.athlete_observations newer where newer.supersedes=o.id)
        order by o.observed_on desc,o.created_at desc limit 8) o
    ),'[]'::jsonb),
    'active_marks',coalesce((
      select jsonb_agg(jsonb_build_object('id',m.id,'type',m.mark_type,
        'label',m.label,'current_value',m.current_value,'target_value',m.target_value,
        'unit',m.unit,'source_as_of',m.updated_at) order by m.is_primary desc,m.created_at desc)
      from public.athlete_marks m where m.athlete_id=a.id and m.active
    ),'[]'::jsonb),
    'forge_receipts',coalesce((
      select jsonb_agg(jsonb_build_object('id',f.receipt_id,'received_at',f.received_at)
        order by f.received_at desc)
      from (select receipt_id,received_at from public.forge_strength_receipts f
        where f.athlete_id=a.id order by f.received_at desc limit 5) f
    ),'[]'::jsonb),
    'baseline',(
      select jsonb_build_object('id',b.id,'current_frequency',b.current_frequency,
        'longest_run',b.longest_run,'source',b.source,'source_as_of',b.updated_at)
      from public.athlete_baselines b where b.athlete_id=a.id
      order by b.captured_at desc limit 1
    ),
    'limits',jsonb_build_object('historical_sessions','latest 8 filings',
      'measurements','latest 10','observations','latest 8','forge','latest 5',
      'source','live database read, not native rendering or external wearable sync')
  ) into payload from public.athletes a where a.id=p_athlete_id;

  if payload is null then raise exception 'Athlete not found' using errcode='42501'; end if;
  return payload;
end;
$function$;

revoke all on function public.coach_agent_athlete_brief(uuid) from public,anon,authenticated;
grant execute on function public.coach_agent_athlete_brief(uuid) to authenticated;
comment on function public.coach_agent_athlete_brief(uuid) is
 'Authorized read-only athlete intelligence index with owner IDs, source timestamps, current Week, filings, marks and observations. No copies, external refreshes or write authority.';
