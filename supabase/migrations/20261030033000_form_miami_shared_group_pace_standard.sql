-- Permit signed-in FORM coaches to publish one pace standard with exact dated work.
-- Existing publisher dropped newly authored pace targets when the rep geometry changed.
-- The RPC still requires coach membership, an exact preview/version match, and preserves
-- paused, overridden, completed and unlinked athlete sessions. No SQL impersonation.
-- Effort-mode participants receive the same work geometry without a clock target.
-- This migration does not publish any athlete work by itself.

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
    if r.paused or r.state<>'published' or coalesce(r.override_reason,'')<>'' or
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
