-- A coach's agent uses the same authenticated authoring boundary as the Console.
-- The receipt makes retries safe; no privileged SQL editor is created.
create table public.coach_agent_session_revision_receipts (
  actor_id uuid not null references auth.users(id),
  request_key text not null check (request_key ~ '^[a-f0-9]{64}$'),
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  athlete_id uuid not null references public.athletes(id),
  planned_session_id uuid not null references public.planned_sessions(id),
  previous_version_id uuid not null references public.planned_session_versions(id),
  new_version_id uuid references public.planned_session_versions(id),
  created_at timestamptz not null default now(),
  primary key (actor_id, request_key)
);

alter table public.coach_agent_session_revision_receipts enable row level security;
revoke all on public.coach_agent_session_revision_receipts from public, anon, authenticated;

comment on table public.coach_agent_session_revision_receipts is
  'Private idempotency receipts for authenticated, coach-authored agent revisions. No direct client access; not a second prescription source.';

create function public.coach_agent_commit_session_revision(
  p_planned_session_id uuid,
  p_expected_version_id uuid,
  p_request_key text,
  p_payload_hash text,
  p_title text,
  p_intent text,
  p_details text,
  p_change_reason text,
  p_prescribed_distance numeric,
  p_distance_unit text,
  p_prescribed_duration_minutes integer,
  p_rpe_low smallint,
  p_rpe_high smallint,
  p_components jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_athlete uuid;
  v_existing public.coach_agent_session_revision_receipts%rowtype;
  v_latest uuid;
  v_next uuid;
begin
  if v_actor is null then
    raise exception 'FORM coach sign-in is required' using errcode = '42501';
  end if;

  select s.athlete_id into v_athlete
  from public.planned_sessions s
  where s.id = p_planned_session_id and s.state = 'published'
  for update;

  if v_athlete is null or not public.is_coach_member(v_athlete) then
    raise exception 'No active coach authorization for this published session'
      using errcode = '42501';
  end if;

  if p_request_key is null or p_request_key !~ '^[a-f0-9]{64}$'
      or p_payload_hash is null or p_payload_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid revision idempotency fingerprint';
  end if;

  select * into v_existing
  from public.coach_agent_session_revision_receipts r
  where r.actor_id = v_actor and r.request_key = p_request_key
  for update;

  if found then
    if v_existing.planned_session_id <> p_planned_session_id
        or v_existing.previous_version_id <> p_expected_version_id
        or v_existing.payload_hash <> p_payload_hash then
      raise exception 'Request key has already been used for different work';
    end if;
    return jsonb_build_object(
      'status', 'already_saved',
      'planned_session_id', p_planned_session_id,
      'previous_version_id', v_existing.previous_version_id,
      'new_version_id', v_existing.new_version_id,
      'request_key', p_request_key
    );
  end if;

  select v.id into v_latest
  from public.planned_session_versions v
  where v.planned_session_id = p_planned_session_id
  order by v.version_number desc limit 1;

  if v_latest is distinct from p_expected_version_id then
    raise exception 'The session changed after preview; reread and preview the latest version'
      using errcode = '40001';
  end if;

  insert into public.coach_agent_session_revision_receipts (
    actor_id, request_key, payload_hash, athlete_id, planned_session_id,
    previous_version_id
  ) values (
    v_actor, p_request_key, p_payload_hash, v_athlete, p_planned_session_id,
    p_expected_version_id
  );

  -- Existing owner checks, append-only versions and typed component validation
  -- are the only authoring path. All writes roll back together on any failure.
  select public.revise_session(
    p_planned_session_id, p_title, p_intent, p_change_reason,
    p_prescribed_distance, p_distance_unit, p_prescribed_duration_minutes,
    p_rpe_low, p_rpe_high, p_components, p_details
  ) into v_next;

  update public.coach_agent_session_revision_receipts
    set new_version_id = v_next
  where actor_id = v_actor and request_key = p_request_key;

  return jsonb_build_object(
    'status', 'saved',
    'planned_session_id', p_planned_session_id,
    'previous_version_id', p_expected_version_id,
    'new_version_id', v_next,
    'request_key', p_request_key
  );
end;
$function$;

revoke all on function public.coach_agent_commit_session_revision(
  uuid, uuid, text, text, text, text, text, text, numeric, text, integer,
  smallint, smallint, jsonb
) from public, anon;
grant execute on function public.coach_agent_commit_session_revision(
  uuid, uuid, text, text, text, text, text, text, numeric, text, integer,
  smallint, smallint, jsonb
) to authenticated;

create function public.coach_agent_revision_receipt(
  p_planned_session_id uuid,
  p_request_key text
)
returns jsonb
language plpgsql
stable security definer
set search_path = ''
as $function$
declare
  v_record public.coach_agent_session_revision_receipts%rowtype;
begin
  if auth.uid() is null then
    raise exception 'FORM coach sign-in is required' using errcode = '42501';
  end if;

  select * into v_record
  from public.coach_agent_session_revision_receipts r
  where r.actor_id = (select auth.uid())
    and r.planned_session_id = p_planned_session_id
    and r.request_key = p_request_key;

  if not found or not public.is_coach_member(v_record.athlete_id) then
    raise exception 'No authorized agent revision receipt for this session'
      using errcode = '42501';
  end if;

  return jsonb_build_object(
    'planned_session_id', v_record.planned_session_id,
    'previous_version_id', v_record.previous_version_id,
    'new_version_id', v_record.new_version_id,
    'request_key', v_record.request_key,
    'saved_at', v_record.created_at
  );
end;
$function$;

revoke all on function public.coach_agent_revision_receipt(uuid, text)
  from public, anon;
grant execute on function public.coach_agent_revision_receipt(uuid, text)
  to authenticated;

-- Halo is a consumer of the same athlete/week, not an independent training plan.
-- Preserve the old text whenever the coach refreshes an approved message after
-- a prescription changes. Existing recipients and campaign keys stay intact.
create table public.coach_agent_halo_message_revisions (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.form_ghost_messages(id),
  athlete_id uuid not null references public.athletes(id),
  actor_id uuid not null references auth.users(id),
  previous_body text not null,
  new_body text not null,
  reason text not null,
  opened_before_change boolean not null,
  revised_at timestamptz not null default now()
);

alter table public.coach_agent_halo_message_revisions enable row level security;
revoke all on public.coach_agent_halo_message_revisions from public, anon, authenticated;

comment on table public.coach_agent_halo_message_revisions is
  'Append-only coach-authored copy history for an existing Halo weekly focus; preserves original text including already-opened notes.';

create function public.coach_agent_halo_focus_revise(
  p_athlete_id uuid,
  p_message_id uuid,
  p_expected_body text,
  p_new_body text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor uuid := (select auth.uid());
  v_body text;
  v_template text;
  v_archived timestamptz;
  v_opened boolean;
  v_revision_id uuid;
begin
  if v_actor is null or not public.is_coach_member(p_athlete_id) then
    raise exception 'Active FORM coach access is required' using errcode = '42501';
  end if;
  select m.body, m.template_kind, m.archived_at
    into v_body, v_template, v_archived
  from public.form_ghost_messages m
  where m.id = p_message_id
    and exists (
      select 1 from public.form_ghost_recipients r
      where r.message_id = m.id and r.athlete_id = p_athlete_id
    )
    and (select count(*) from public.form_ghost_recipients r
         where r.message_id = m.id) = 1
  for update of m;

  if not found or v_archived is not null or v_template <> 'weekly_focus' then
    raise exception 'Active single-athlete Halo weekly focus was not found';
  end if;
  if v_body is distinct from p_expected_body then
    raise exception 'Halo text changed; reread before revising' using errcode = '40001';
  end if;
  if p_new_body is null or length(btrim(p_new_body)) < 24
      or length(p_new_body) > 2000
      or p_reason is null or length(btrim(p_reason)) < 8 then
    raise exception 'Halo revision needs approved full text and a reason';
  end if;
  if v_body = p_new_body then
    return jsonb_build_object('status','unchanged','message_id',p_message_id);
  end if;

  select r.first_opened_at is not null into v_opened
  from public.form_ghost_recipients r
  where r.message_id = p_message_id and r.athlete_id = p_athlete_id;

  insert into public.coach_agent_halo_message_revisions (
    message_id,athlete_id,actor_id,previous_body,new_body,reason,opened_before_change
  ) values (
    p_message_id,p_athlete_id,v_actor,v_body,p_new_body,p_reason,coalesce(v_opened,false)
  ) returning id into v_revision_id;

  update public.form_ghost_messages
    set body = p_new_body
    where id = p_message_id;

  return jsonb_build_object(
    'status','updated','message_id',p_message_id,
    'revision_id',v_revision_id,'opened_before_change',coalesce(v_opened,false)
  );
end;
$function$;

revoke all on function public.coach_agent_halo_focus_revise(uuid,uuid,text,text,text)
  from public, anon;
grant execute on function public.coach_agent_halo_focus_revise(uuid,uuid,text,text,text)
  to authenticated;

-- A changed prescription must not leave an outdated Dossier Week story.
create table public.coach_agent_week_story_revisions (
  id uuid primary key default gen_random_uuid(),
  week_id uuid not null references public.training_weeks(id),
  athlete_id uuid not null references public.athletes(id),
  actor_id uuid not null references auth.users(id),
  old_intent text,
  old_matters_because text,
  new_intent text not null,
  new_matters_because text not null,
  reason text not null,
  revised_at timestamptz not null default now()
);

alter table public.coach_agent_week_story_revisions enable row level security;
revoke all on public.coach_agent_week_story_revisions from public,anon,authenticated;

create function public.coach_agent_week_story_revise(
  p_week_id uuid,
  p_expected_updated_at timestamptz,
  p_intent text,
  p_matters_because text,
  p_reason text
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_week public.training_weeks%rowtype;
  v_actor uuid := (select auth.uid());
  v_revision_id uuid;
begin
  select * into v_week from public.training_weeks
  where id=p_week_id for update;
  if v_actor is null or not found
      or not public.is_coach_member(v_week.athlete_id) then
    raise exception 'Active FORM coach access is required' using errcode='42501';
  end if;
  if v_week.updated_at is distinct from p_expected_updated_at then
    raise exception 'Week story changed; reread before revising' using errcode='40001';
  end if;
  if p_intent is null or length(btrim(p_intent)) < 15
      or p_matters_because is null or length(btrim(p_matters_because)) < 15
      or p_reason is null or length(btrim(p_reason)) < 8 then
    raise exception 'Week story needs both approved sentences and a reason';
  end if;
  if v_week.intent is not distinct from p_intent
      and v_week.matters_because is not distinct from p_matters_because then
    return jsonb_build_object('status','unchanged','week_id',p_week_id);
  end if;
  insert into public.coach_agent_week_story_revisions(
    week_id,athlete_id,actor_id,old_intent,old_matters_because,
    new_intent,new_matters_because,reason
  ) values (
    p_week_id,v_week.athlete_id,v_actor,v_week.intent,v_week.matters_because,
    p_intent,p_matters_because,p_reason
  ) returning id into v_revision_id;
  update public.training_weeks set
    intent=p_intent,matters_because=p_matters_because,updated_at=now()
  where id=p_week_id;
  return jsonb_build_object('status','updated','week_id',p_week_id,
    'revision_id',v_revision_id);
end;
$function$;

revoke all on function public.coach_agent_week_story_revise(
  uuid,timestamptz,text,text,text) from public,anon;
grant execute on function public.coach_agent_week_story_revise(
  uuid,timestamptz,text,text,text) to authenticated;

-- Athlete focus has its own append-only owner function, distinct from the
-- mutable Dossier Week story. Require the head revision the agent previewed.
create function public.coach_agent_focus_revise(
  p_athlete_id uuid,
  p_expected_focus_id uuid,
  p_body text,
  p_effective_on date,
  p_reason text
)
returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_latest uuid;
  v_created uuid;
begin
  if auth.uid() is null or not public.is_coach_member(p_athlete_id) then
    raise exception 'Active FORM coach access is required' using errcode='42501';
  end if;
  perform 1 from public.athletes where id=p_athlete_id for update;
  if not found then raise exception 'Athlete not found'; end if;
  select f.id into v_latest from public.athlete_focus_revisions f
  where f.athlete_id=p_athlete_id
  order by f.effective_from desc,f.created_at desc limit 1;
  if v_latest is distinct from p_expected_focus_id then
    raise exception 'Focus changed after preview; reread' using errcode='40001';
  end if;
  if p_body is null or length(btrim(p_body)) < 24
      or p_effective_on is null or p_reason is null
      or length(btrim(p_reason)) < 8 then
    raise exception 'Focus needs full approved copy, effective date and reason';
  end if;
  select public.author_focus(p_athlete_id,p_body,p_effective_on,p_reason)
    into v_created;
  return jsonb_build_object('status','saved','focus_id',v_created,
    'previous_id',v_latest);
end;
$function$;

revoke all on function public.coach_agent_focus_revise(uuid,uuid,text,date,text)
  from public,anon;
grant execute on function public.coach_agent_focus_revise(uuid,uuid,text,date,text)
  to authenticated;

-- Authorized coach projection intentionally includes active AND archived
-- notes, drafts, the sourced evaluation/points, and Speed links. A generic
-- athlete inbox omits archived or not-yet-available copy, so isn't sufficient
-- for a preflight audit of changes to the Week.
create function public.coach_agent_athlete_linkage(p_athlete_id uuid)
returns jsonb
language plpgsql
stable security definer
set search_path = ''
as $function$
declare
  v_halo jsonb;
  v_direction jsonb;
  v_evaluation jsonb;
  v_speed jsonb;
  v_focus jsonb;
  v_notes jsonb;
begin
  if auth.uid() is null or not public.is_coach_member(p_athlete_id) then
    raise exception 'Active FORM coach access is required' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,'campaign_key',m.campaign_key,
    'template_kind',m.template_kind,'title',m.title,'body',m.body,
    'action_date',m.action_date,'available_at',m.available_at,
    'archived_at',m.archived_at,'created_at',m.created_at,
    'first_opened_at',r.first_opened_at
  ) order by m.created_at desc),'[]'::jsonb) into v_halo
  from public.form_ghost_messages m
  join public.form_ghost_recipients r on r.message_id = m.id
  where r.athlete_id = p_athlete_id;

  select to_jsonb(d) into v_direction from (
    select athlete_id,version,focus,gate,base_focus,base_gate,updated_at
    from public.athlete_direction_drafts
    where athlete_id = p_athlete_id
  ) d;

  select coalesce(jsonb_agg(to_jsonb(s) order by s.linked_at desc),'[]'::jsonb)
  into v_speed from (
    select v.benchmark_id,v.planned_session_id,v.planned_session_version_id,
      v.linked_at,b.identity_key,b.display_shape,b.enabled
    from public.athlete_speed_record_versions v
    join public.athlete_speed_record_benchmarks b on b.id=v.benchmark_id
    where v.athlete_id=p_athlete_id
  ) s;

  select coalesce(jsonb_agg(to_jsonb(f) order by f.effective_from desc,f.created_at desc),'[]'::jsonb)
  into v_focus from (
    select id,body,effective_from,reason,supersedes,created_at
    from public.athlete_focus_revisions
    where athlete_id=p_athlete_id
  ) f;

  select to_jsonb(e) into v_evaluation from (
    select id,revision,race_label,race_on,say,label,positions,axes,
      published_at,created_at
    from public.athlete_evaluation_revisions
    where athlete_id=p_athlete_id
    order by revision desc limit 1
  ) e;

  select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc),'[]'::jsonb)
    into v_notes from (
      select id,from_coach,body,completion_id,created_at,withdrawn_at,hidden
      from public.coach_messages
      where athlete_id=p_athlete_id
      order by created_at desc limit 30
    ) n;

  return jsonb_build_object(
    'athlete_id',p_athlete_id,'as_of',now(),
    'halo_messages',v_halo,'direction_draft',v_direction,
    'focus_revisions',v_focus,'coach_sent_notes',v_notes,
    'evaluation_source',v_evaluation,
    'evaluation_display',public.form_athlete_evaluation(p_athlete_id),
    'speed_record_links',v_speed,
    'athlete_device_visibility','unchecked'
  );
end;
$function$;

revoke all on function public.coach_agent_athlete_linkage(uuid) from public,anon;
grant execute on function public.coach_agent_athlete_linkage(uuid) to authenticated;
