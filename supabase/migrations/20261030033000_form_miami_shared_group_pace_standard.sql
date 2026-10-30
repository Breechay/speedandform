-- Permit signed-in FORM coaches to publish one pace standard with exact dated work.
-- Existing publisher dropped newly authored pace targets when the rep geometry changed.
-- The RPC still requires coach membership, an exact preview/version match, and preserves
-- paused, overridden, completed and unlinked athlete sessions. No SQL impersonation.
-- Effort-mode participants receive the same work geometry without a clock target.
-- This migration does not publish any athlete work by itself.

-- Simon's Study 003 is a separately versioned half-marathon research plan.
-- Its current FORM Thursday links have not been paused, yet the authored
-- sessions must not be overwritten by the group 5K block. This explicit
-- source-plan guard stays effective across dates without altering his link,
-- prescription, study publication, or the athlete's Week record.
create or replace function public.form_miami_is_protected_study_session(p_session_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.planned_sessions s
    join public.training_plan_sessions tps on tps.id=s.plan_session_id
    join public.training_plans tp on tp.id=tps.plan_id
    where s.id=p_session_id and tp.slug='simon-ceiling-durability-01'
  );
$$;
revoke all on function public.form_miami_is_protected_study_session(uuid) from public,anon,authenticated;

-- Read-only, coach-scoped release receipt. A successful week-text UPDATE
-- alone is not proof that another plan edit did not invalidate the story.
create or replace function public.form_miami_week_story_status(p_on_date date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  perform public.form_miami_ensure_coach();
  select coalesce(jsonb_object_agg(w.id::text,coach_audit_private.week_story_is_current(w.id)),'{}'::jsonb)
  into result
  from public.form_miami_session_links link
  join public.planned_sessions s on s.id=link.planned_session_id
  join public.training_weeks w on w.id=s.week_id
  where link.lane='thursday' and link.on_date=p_on_date
    and public.is_coach_member(s.athlete_id);
  return result;
end $$;
revoke all on function public.form_miami_week_story_status(date) from public,anon;
grant execute on function public.form_miami_week_story_status(date) to authenticated;

-- Keep the preview recipient set identical to the publisher's hard gate.
-- The UI will show the protected study rather than silently count it as ready.
create or replace function public.form_miami_preview(p_lane text,p_on_date date)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare roster jsonb; run_info jsonb; latest jsonb;
begin
  perform public.form_miami_ensure_coach();
  if p_lane not in ('thursday','saturday') or p_on_date is null then raise exception 'invalid_lane_or_date'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'athlete_id',a.id,'name',a.display_name,'mode',sub.track_mode,
    'session_id',s.id,'week_id',s.week_id,'scheduled_on',s.scheduled_on,'state',s.state,
    'override',coalesce(s.override_reason,'')<>'',
    'protected',case when s.id is null then false else public.form_miami_is_protected_study_session(s.id) end,
    'paused',coalesce(link.paused,false),'filed',exists(select 1 from public.session_completions c where c.planned_session_id=s.id),
    'version_id',v.id,'version_number',v.version_number,'title',v.title,
    'intent',v.intent,'details',v.details,'duration',v.prescribed_duration_minutes,
    'distance',v.prescribed_distance,'unit',v.distance_unit,
    'components',(select coalesce(jsonb_agg(jsonb_build_object(
      'role',c.role,'shape',c.shape,'repeatCount',c.repeat_count,
      'distance',c.distance,'distanceUnit',c.distance_unit,'durationSeconds',c.duration_seconds,
      'recoverySeconds',c.recovery_seconds,'recoveryKind',c.recovery_kind,
      'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,
      'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high) order by c.position),'[]'::jsonb)
      from public.planned_session_components c where c.version_id=v.id)
  ) order by a.display_name),'[]'::jsonb) into roster
  from public.form_miami_subscriptions sub
  join public.athletes a on a.id=sub.athlete_id
  left join public.form_miami_session_links link on link.athlete_id=sub.athlete_id and link.lane=p_lane and link.on_date=p_on_date
  left join public.planned_sessions s on s.id=case when p_lane='thursday' then link.planned_session_id else null end
  left join lateral (select vv.* from public.planned_session_versions vv where vv.planned_session_id=s.id order by vv.version_number desc limit 1) v on true
  where sub.lane=p_lane and sub.enabled and public.is_coach_member(a.id);
  if p_lane='saturday' then
    select coalesce(jsonb_agg(jsonb_build_object(
      'athlete_id',a.id,'name',a.display_name,'mode',sub.track_mode,'session_id',s.id,
      'scheduled_on',s.scheduled_on,'state',s.state,'title',v.title,
      'distance',v.prescribed_distance,'unit',v.distance_unit,'filed',exists(select 1 from public.session_completions c where c.planned_session_id=s.id)
    ) order by a.display_name),'[]'::jsonb) into roster
    from public.form_miami_subscriptions sub
    join public.athletes a on a.id=sub.athlete_id
    left join lateral(select ps.* from public.planned_sessions ps where ps.athlete_id=a.id and ps.scheduled_on=p_on_date and ps.state='published' order by ps.position limit 1) s on true
    left join lateral(select * from public.planned_session_versions vv where vv.planned_session_id=s.id order by vv.version_number desc limit 1) v on true
    where sub.lane='saturday' and sub.enabled and public.is_coach_member(a.id);
  end if;
  select jsonb_build_object('id',r.id,'title',r.title,'kind',r.kind,'status',r.status,
    'starts_at',r.starts_at,'meet_at',r.meet_at,'meet_name',r.meet_name,'meet_address',r.meet_address)
  into run_info from public.form_miami_run_links l join public.collective_runs_current r on r.id=l.run_id
  where l.lane=p_lane and l.on_date=p_on_date;
  select jsonb_build_object('revision',p.revision,'payload',p.payload,'published_at',p.published_at)
  into latest from public.form_miami_publications p where p.lane=p_lane and p.on_date=p_on_date order by p.revision desc limit 1;
  return jsonb_build_object('lane',p_lane,'date',p_on_date,'roster',roster,'run',run_info,'publication',latest);
end $$;

create or replace function public.form_miami_publish_thursday(
 p_on_date date,p_payload jsonb,p_expected jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r record; v record; c record; pieces jsonb; arr jsonb; newv uuid; pubid uuid; revision_no int; changed int := 0; eligible int := 0;
begin
  perform public.form_miami_ensure_coach();
  if p_on_date is null or extract(isodow from p_on_date)<>4 or p_on_date<current_date then raise exception 'choose_future_thursday'; end if;
  if coalesce(length(btrim(p_payload->>'title')),0)<3 or coalesce(length(btrim(p_payload->>'intent')),0)<5 or
     coalesce(jsonb_typeof(p_payload->'components'),'')<>'array' or jsonb_array_length(p_payload->'components')<1 or
     jsonb_array_length(p_payload->'components')>12 or
     coalesce((p_payload->>'duration')::int,0) not between 10 and 240 then raise exception 'incomplete_workout'; end if;
  if jsonb_typeof(p_expected)<>'object' then raise exception 'preview_first'; end if;
  if length(p_payload::text)>12000 or length(p_payload->>'title')>100 or length(p_payload->>'intent')>240 or
     length(coalesce(p_payload->>'details',''))>500 then raise exception 'workout_too_long'; end if;
  -- One coach-authored group pace band, not athlete-specific client values.
  -- The coach can explicitly choose effort mode for easy/stride days.
  if coalesce(p_payload->>'paceMode','paced') not in ('paced','effort') then
    raise exception 'invalid_group_pace_mode';
  end if;
  if exists(select 1 from jsonb_array_elements(p_payload->'components') x
    where x->>'role' not in ('warm_up','work','cool_down')
      or x->>'shape' not in ('continuous','repetitions')
      or (x->>'repeatCount')::int not between 1 and 30 and x->>'shape'='repetitions'
      or (x->>'durationSeconds')::int<0 or (x->>'recoverySeconds')::int<0
      or (x->>'distance')::numeric<0 or (x->>'distanceUnit') not in ('mi','km')
      or ((x ? 'paceLowSeconds') <> (x ? 'paceHighSeconds'))
      or ((x ? 'paceLowSeconds') and x->>'role'<>'work')
      or ((x ? 'paceLowSeconds') and coalesce(p_payload->>'paceMode','paced')='effort')
      or (x->>'role'='work' and coalesce(p_payload->>'paceMode','paced')='paced'
          and (x->>'paceLowSeconds' is null or x->>'paceHighSeconds' is null))
      or ((x ? 'paceLowSeconds') and (
        jsonb_typeof(x->'paceLowSeconds')<>'number'
        or jsonb_typeof(x->'paceHighSeconds')<>'number'
        or (x->>'paceLowSeconds')::numeric <> trunc((x->>'paceLowSeconds')::numeric)
        or (x->>'paceHighSeconds')::numeric <> trunc((x->>'paceHighSeconds')::numeric)
        or (x->>'paceLowSeconds')::integer not between 180 and 900
        or (x->>'paceHighSeconds')::integer not between 180 and 900
        or (x->>'paceLowSeconds')::integer > (x->>'paceHighSeconds')::integer
      ))
  ) then raise exception 'invalid_or_missing_group_pace'; end if;
  -- Row locks and expected version IDs make the preview a hard publication gate.
  -- A revision must never race an individual coach edit or a filing.
  perform pg_advisory_xact_lock(hashtext('form_miami_thursday:'||p_on_date::text));
  for r in select a.id athlete_id,sub.track_mode,s.id session_id,s.override_reason,s.state,link.paused
    from public.form_miami_subscriptions sub
    join public.athletes a on a.id=sub.athlete_id
    join public.form_miami_session_links link on link.athlete_id=a.id and link.lane='thursday' and link.on_date=p_on_date
    join public.planned_sessions s on s.id=link.planned_session_id
    where sub.lane='thursday' and sub.enabled order by a.id
  loop
    if not public.is_coach_member(r.athlete_id) then raise exception 'not_athlete_coach'; end if;
    if r.paused or public.form_miami_is_protected_study_session(r.session_id)
       or r.state<>'published' or coalesce(r.override_reason,'')<>'' or
       exists(select 1 from public.session_completions where planned_session_id=r.session_id) then continue; end if;
    eligible := eligible+1;
    select * into v from public.planned_session_versions where planned_session_id=r.session_id order by version_number desc limit 1;
    if v.id is null or p_expected->>r.session_id::text is distinct from v.id::text then raise exception 'plan_changed_reload_preview'; end if;
  end loop;
  if eligible=0 then raise exception 'no_safe_recipients'; end if;
  if (select count(*) from jsonb_object_keys(p_expected))<>eligible then raise exception 'preview_recipient_mismatch'; end if;
  select coalesce(max(revision),0)+1 into revision_no from public.form_miami_publications where lane='thursday' and on_date=p_on_date;
  insert into public.form_miami_publications(lane,on_date,revision,payload,published_by)
  values('thursday',p_on_date,revision_no,p_payload,(select auth.uid())) returning id into pubid;
  for r in select sub.athlete_id,sub.track_mode,s.id session_id
    from public.form_miami_subscriptions sub
    join public.form_miami_session_links link on link.athlete_id=sub.athlete_id and link.lane='thursday' and link.on_date=p_on_date
    join public.planned_sessions s on s.id=link.planned_session_id
    where sub.lane='thursday' and sub.enabled and not link.paused and s.state='published'
      and not public.form_miami_is_protected_study_session(s.id)
      and coalesce(s.override_reason,'')='' and not exists(select 1 from public.session_completions where planned_session_id=s.id)
    order by sub.athlete_id
  loop
    select * into v from public.planned_session_versions where planned_session_id=r.session_id order by version_number desc limit 1;
    -- The one shared target is authored for all paced recipients.
    -- Effort-mode athletes retain the work anatomy but receive no clock demand.
    -- Individual pace exceptions are paused/overridden, never silently copied.
    select coalesce(jsonb_agg(
      n.value || jsonb_build_object(
        'paceLowSeconds',case when r.track_mode='effort' then null
          else (n.value->>'paceLowSeconds')::integer end,
        'paceHighSeconds',case when r.track_mode='effort' then null
          else (n.value->>'paceHighSeconds')::integer end
      ) order by n.ordinality),'[]'::jsonb) into pieces
    from jsonb_array_elements(p_payload->'components') with ordinality as n(value,ordinality);
    newv:=public.write_session_version(r.session_id,p_payload->>'title',p_payload->>'intent',null,null,
      (p_payload->>'duration')::int,v.rpe_low,v.rpe_high,
      'FORM Thursday shared publication · revision '||revision_no,pieces,p_payload->>'details');
    insert into public.form_miami_publication_receipts(publication_id,athlete_id,planned_session_id,before_version_id,after_version_id)
    values(pubid,r.athlete_id,r.session_id,v.id,newv);
    perform public.form_miami_queue_notice(r.athlete_id,'thursday:'||pubid::text,'session_revised',
      'Thursday workout updated',p_payload->>'title'||'. Open your Week for the sets and recovery.','/athlete/');
    changed:=changed+1;
  end loop;
  return jsonb_build_object('publication_id',pubid,'revision',revision_no,'updated',changed);
end $$;
