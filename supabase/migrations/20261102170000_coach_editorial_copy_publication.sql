-- Coach-authored athlete-visible summaries. No historical prescriptions are
-- rewritten by the migration. Publication is an authenticated, checked RPC.
alter table public.form_training_strength_days
  add column if not exists emphasis text;

create or replace function public.coach_copy_clean(p_copy text, p_limit integer)
returns boolean
language sql immutable
set search_path = ''
as $$
  select nullif(btrim(coalesce(p_copy, '')), '') is not null
    and char_length(btrim(p_copy)) between 8 and p_limit
    and p_copy !~ E'[\\n\\r]'
    and p_copy !~* '(coach.only|internal.only|private.note|draft|pending.publication|approval.queue|source.system|publish.this|admin.only|rpc|sql|placeholder|lorem ipsum|https?://)'
    and (position('.' in p_copy) = 0 or
      lower(btrim(split_part(p_copy, '.', 1))) <> lower(btrim(split_part(p_copy, '.', 2))));
$$;
revoke all on function public.coach_copy_clean(text,integer) from public, anon;
grant execute on function public.coach_copy_clean(text,integer) to authenticated;

create or replace function public.coach_strength_emphasis_for_title(p_title text)
returns text
language sql immutable
set search_path = ''
as $$
  select case btrim(p_title)
    when 'Glute A + Lower' then 'Glutes · hinge strength · single-leg control'
    when 'Glute A · Hinge' then 'Glutes · hamstrings · hinge strength'
    when 'Glute B · Thrust' then 'Glutes · hip extension · stability'
    when 'Upper Push + Shoulders' then 'Upper chest · shoulders · triceps'
    when 'Pull' then 'Back width · rear delts · serratus'
    when 'Pull + Arms + Delts' then 'Back · rear delts · arms'
    when 'Upper A' then 'Upper chest · back · shoulders'
    when 'Upper B' then 'Chest · back · arms'
    when 'Lower A' then 'Single-leg strength · hamstrings · core'
    when 'Lower B' then 'Legs · hip extension · trunk stability'
    when 'Lower Primer' then 'Lower-body preparation · core control'
    when 'Lower Restore' then 'Controlled legs · hamstrings · core'
    when 'Frame A' then 'Pressing · rows · shoulders'
    when 'Frame B' then 'Back · pressing · arms'
  end;
$$;
revoke all on function public.coach_strength_emphasis_for_title(text) from public, anon;

create or replace function public.coach_strength_emphasis_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.emphasis := coalesce(
    nullif(btrim(coalesce(new.emphasis, '')), ''),
    public.coach_strength_emphasis_for_title(new.title)
  );
  if not public.coach_copy_clean(new.emphasis, 120) then
    raise exception 'a published strength day needs an approved athlete-visible emphasis'
      using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function public.coach_strength_emphasis_guard() from public, anon, authenticated;
drop trigger if exists coach_strength_emphasis_guard on public.form_training_strength_days;
create trigger coach_strength_emphasis_guard
  before insert or update of title, emphasis on public.form_training_strength_days
  for each row execute function public.coach_strength_emphasis_guard();

alter table public.form_training_strength_days
  add constraint form_training_strength_emphasis_approved
  check (public.coach_copy_clean(emphasis, 120)) not valid;

create table if not exists public.coach_strength_emphasis_audit (
  id bigint generated always as identity primary key,
  day_id uuid not null references public.form_training_strength_days(id),
  athlete_id uuid not null references public.athletes(id),
  previous_emphasis text,
  published_emphasis text not null,
  changed_by uuid not null,
  changed_at timestamptz not null default now()
);
alter table public.coach_strength_emphasis_audit enable row level security;
revoke all on public.coach_strength_emphasis_audit from anon, authenticated;

create or replace function public.coach_copy_review(p_from date, p_to date)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare
  identity_id uuid := (select auth.uid());
begin
  if identity_id is null or not public.is_active_coaching_administrator(identity_id)
     or not public.coaching_sync_enabled() then
    raise exception 'active coach required' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 180 then
    raise exception 'invalid editorial review range' using errcode = '22023';
  end if;
  return jsonb_build_object(
    'schema_version', 1,
    'from', p_from, 'to', p_to,
    'strength', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day_id', d.id, 'athlete_id', d.athlete_id,
        'scheduled_on', d.scheduled_on, 'title', d.title,
        'emphasis', d.emphasis, 'suggested_emphasis',
          public.coach_strength_emphasis_for_title(d.title),
        'forge_program_id', d.forge_program_id,
        'forge_program_digest', d.forge_program_digest,
        'exercises', d.exercises
      ) order by d.scheduled_on, d.athlete_id, d.session_key)
      from public.form_training_strength_days d
      where d.cleared_at is null and d.scheduled_on between p_from and p_to
        and public.is_coach_member(d.athlete_id)
    ), '[]'::jsonb),
    'running', coalesce((
      select jsonb_agg(jsonb_build_object(
        'session_id', s.id, 'athlete_id', s.athlete_id,
        'scheduled_on', s.scheduled_on, 'version_id', v.id,
        'title', v.title, 'intent', v.intent, 'details', v.details,
        'shape', v.shape, 'prescribed_distance', v.prescribed_distance,
        'prescribed_duration_minutes', v.prescribed_duration_minutes
      ) order by s.scheduled_on, s.athlete_id, s.id)
      from public.planned_sessions s
      join lateral (
        select v.* from public.planned_session_versions v
        where v.planned_session_id = s.id
        order by v.version_number desc limit 1
      ) v on true
      where s.state = 'published'
        and s.scheduled_on between p_from and p_to
        and nullif(btrim(coalesce(v.intent, '')), '') is null
        and public.is_coach_member(s.athlete_id)
    ), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.coach_copy_review(date,date) from public, anon;
grant execute on function public.coach_copy_review(date,date) to authenticated;

-- New/custom strength titles cannot rely on the legacy title dictionary.
-- This scoped writer accepts an explicitly authored emphasis while keeping
-- the older seven-argument strength writer working for known titles.
create or replace function public.coach_strength_day_set_described(
  p_athlete uuid, p_on date, p_program text, p_digest text,
  p_session_key text, p_title text, p_emphasis text, p_exercises jsonb
) returns uuid
language plpgsql security definer
set search_path = ''
as $$
declare
  rid uuid;
begin
  if (select auth.uid()) is null
     or not public.is_active_coaching_administrator((select auth.uid()))
     or not public.coaching_sync_enabled()
     or not public.is_coach_member(p_athlete) then
    raise exception 'active coach membership required' using errcode = '42501';
  end if;
  if not exists(select 1 from public.athletes a where a.id=p_athlete and a.active)
     or p_on is null or p_on < current_date
     or nullif(btrim(coalesce(p_program,'')),'') is null
     or nullif(btrim(coalesce(p_digest,'')),'') is null
     or nullif(btrim(coalesce(p_session_key,'')),'') is null
     or nullif(btrim(coalesce(p_title,'')),'') is null
     or not public.coach_copy_clean(p_emphasis,120)
     or jsonb_typeof(p_exercises) is distinct from 'array'
     or jsonb_array_length(p_exercises) = 0 then
    raise exception 'complete described strength day required' using errcode = '22023';
  end if;
  insert into public.form_training_strength_days (
    athlete_id, scheduled_on, forge_program_id, forge_program_digest,
    session_key, title, emphasis, exercises, authored_by
  ) values (
    p_athlete,p_on,p_program,p_digest,p_session_key,btrim(p_title),
    btrim(p_emphasis),p_exercises,(select auth.uid())
  ) on conflict (athlete_id,scheduled_on,session_key) do update set
    forge_program_id=excluded.forge_program_id,
    forge_program_digest=excluded.forge_program_digest,
    title=excluded.title,emphasis=excluded.emphasis,
    exercises=excluded.exercises,authored_by=excluded.authored_by,
    authored_at=now(),cleared_at=null
  returning id into rid;
  return rid;
end;
$$;
revoke all on function public.coach_strength_day_set_described(uuid,date,text,text,text,text,text,jsonb)
  from public, anon;
grant execute on function public.coach_strength_day_set_described(uuid,date,text,text,text,text,text,jsonb)
  to authenticated;

-- Atomically publish only editorial copy. Running versions clone every
-- prescription field and component; older versions and coach notes survive.
create or replace function public.coach_publish_editorial_copy(
  p_strength jsonb, p_running jsonb
) returns jsonb
language plpgsql security definer
set search_path = ''
as $$
declare
  coach_id uuid := (select auth.uid());
  item jsonb;
  day_row public.form_training_strength_days%rowtype;
  session_row public.planned_sessions%rowtype;
  previous public.planned_session_versions%rowtype;
  created_id uuid;
  submitted text;
  seen_strength uuid[] := '{}';
  seen_running uuid[] := '{}';
  strength_updated integer := 0;
  run_updated integer := 0;
  unchanged integer := 0;
begin
  if coach_id is null or not public.is_active_coaching_administrator(coach_id)
     or not public.coaching_sync_enabled() then
    raise exception 'active coach required' using errcode = '42501';
  end if;
  if jsonb_typeof(p_strength) is distinct from 'array'
     or jsonb_typeof(p_running) is distinct from 'array'
     or jsonb_array_length(p_strength) > 300
     or jsonb_array_length(p_running) > 100
     or jsonb_array_length(p_strength) + jsonb_array_length(p_running) = 0 then
    raise exception 'editorial input must be nonempty bounded arrays' using errcode = '22023';
  end if;

  for item in select value from jsonb_array_elements(p_strength) loop
    if nullif(item->>'day_id', '') is null then
      raise exception 'strength day identity required' using errcode = '22023';
    end if;
    if (item->>'day_id')::uuid = any(seen_strength) then
      raise exception 'duplicate strength day' using errcode = '22023';
    end if;
    seen_strength := array_append(seen_strength, (item->>'day_id')::uuid);
    select * into day_row from public.form_training_strength_days
      where id = (item->>'day_id')::uuid for update;
    if not found or day_row.cleared_at is not null
       or day_row.scheduled_on < current_date
       or not public.is_coach_member(day_row.athlete_id)
       or day_row.title is distinct from item->>'title'
       or day_row.forge_program_id is distinct from item->>'forge_program_id'
       or day_row.forge_program_digest is distinct from item->>'forge_program_digest' then
      raise exception 'stale or unauthorized strength day' using errcode = '42501';
    end if;
    submitted := btrim(coalesce(item->>'emphasis', ''));
    if not public.coach_copy_clean(submitted, 120) then
      raise exception 'invalid athlete-visible strength emphasis' using errcode = '22023';
    end if;
    if day_row.emphasis is not distinct from submitted then
      unchanged := unchanged + 1;
    else
      update public.form_training_strength_days set emphasis = submitted where id = day_row.id;
      insert into public.coach_strength_emphasis_audit
        (day_id, athlete_id, previous_emphasis, published_emphasis, changed_by)
      values (day_row.id, day_row.athlete_id, day_row.emphasis, submitted, coach_id);
      strength_updated := strength_updated + 1;
    end if;
  end loop;

  for item in select value from jsonb_array_elements(p_running) loop
    if nullif(item->>'session_id', '') is null then
      raise exception 'running session identity required' using errcode = '22023';
    end if;
    if (item->>'session_id')::uuid = any(seen_running) then
      raise exception 'duplicate running session' using errcode = '22023';
    end if;
    seen_running := array_append(seen_running, (item->>'session_id')::uuid);
    select * into session_row from public.planned_sessions
      where id = (item->>'session_id')::uuid for update;
    if not found or session_row.state <> 'published'
       or session_row.scheduled_on < current_date
       or not public.is_coach_member(session_row.athlete_id) then
      raise exception 'running session cannot be edited' using errcode = '42501';
    end if;
    select * into previous from public.planned_session_versions
      where planned_session_id = session_row.id
      order by version_number desc limit 1;
    submitted := btrim(coalesce(item->>'intent', ''));
    if not public.coach_copy_clean(submitted, 180) or previous.title is distinct from item->>'title' then
      raise exception 'invalid or stale running session description' using errcode = '22023';
    end if;
    if nullif(btrim(coalesce(previous.intent, '')), '') is not null then
      if previous.intent is distinct from submitted then
        raise exception 'authored running intent requires individual revision' using errcode = '22023';
      end if;
      unchanged := unchanged + 1;
    else
      if previous.id is distinct from (item->>'version_id')::uuid then
        raise exception 'running version changed; review again' using errcode = '40001';
      end if;
      if exists(select 1 from public.planned_session_exercises where version_id = previous.id) then
        raise exception 'editorial running batch cannot rewrite strength exercise anatomy' using errcode = '22023';
      end if;
      insert into public.planned_session_versions (
        athlete_id, planned_session_id, version_number, title,
        prescribed_distance, distance_unit, prescribed_duration_minutes,
        intent, details, change_reason, authored_by, rpe_low, rpe_high,
        pace_low, pace_high, shape, coach_note
      ) values (
        previous.athlete_id, previous.planned_session_id, previous.version_number + 1,
        previous.title, previous.prescribed_distance, previous.distance_unit,
        previous.prescribed_duration_minutes, submitted, previous.details,
        'Editorial · athlete-visible training intent', coach_id,
        previous.rpe_low, previous.rpe_high, previous.pace_low,
        previous.pace_high, previous.shape, previous.coach_note
      ) returning id into created_id;
      insert into public.planned_session_components (
        athlete_id, version_id, position, role, shape, repeat_count,
        distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
        pace_low, pace_high, pace_low_seconds, pace_high_seconds,
        rpe_low, rpe_high, rpe_source, rpe_default_version,
        repeat_minimum, repeat_target, repeat_progression, repeat_ceiling,
        counts_toward_mark_id
      )
      select athlete_id, created_id, position, role, shape, repeat_count,
        distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
        pace_low, pace_high, pace_low_seconds, pace_high_seconds,
        rpe_low, rpe_high, rpe_source, rpe_default_version,
        repeat_minimum, repeat_target, repeat_progression, repeat_ceiling,
        counts_toward_mark_id
      from public.planned_session_components where version_id = previous.id;
      run_updated := run_updated + 1;
    end if;
  end loop;

  return jsonb_build_object(
    'strength_updated', strength_updated, 'running_updated', run_updated,
    'already_matching', unchanged, 'native_device_verified', false
  );
end;
$$;
revoke all on function public.coach_publish_editorial_copy(jsonb,jsonb) from public, anon;
grant execute on function public.coach_publish_editorial_copy(jsonb,jsonb) to authenticated;

-- Existing athlete identities and coach membership rules remain authoritative.
-- The extra field is additive so old 44.5 readers do not break. New readers can
-- show it; publication receipts must still be verified on a real native device.
create or replace function public.athlete_strength_days(p_from date, p_to date)
returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
declare identity jsonb; aid uuid;
begin
  if (select auth.uid()) is null then
    raise exception 'signed_in_account_required' using errcode = '42501';
  end if;
  if p_from is null or p_to is null or p_to < p_from or p_to - p_from > 62 then
    raise exception 'range_invalid' using errcode = '22023';
  end if;
  identity := public.coaching_access_identity();
  aid := (identity->>'athlete_id')::uuid;
  if aid is null then raise exception 'athlete_claim_required' using errcode = '42501'; end if;
  return jsonb_build_object(
    'schema_version', 1, 'athlete_id', aid, 'subject', (select auth.uid()),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day_id', d.id, 'scheduled_on', d.scheduled_on,
        'forge_program_id', d.forge_program_id,
        'forge_program_digest', d.forge_program_digest,
        'session_key', d.session_key, 'title', d.title,
        'emphasis', d.emphasis, 'exercises', d.exercises
      ) order by d.scheduled_on, d.session_key)
      from public.form_training_strength_days d
      where d.athlete_id = aid and d.cleared_at is null
        and d.scheduled_on between p_from and p_to
    ), '[]'::jsonb)
  );
end;
$$;

create or replace function public.coach_preview_strength_days(
  p_athlete_id uuid, p_from date, p_to date
) returns jsonb
language plpgsql stable security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'signed_in_account_required' using errcode = '42501';
  end if;
  if p_athlete_id is null or p_from is null or p_to is null
     or p_to < p_from or p_to - p_from > 126 then
    raise exception 'range_invalid' using errcode = '22023';
  end if;
  if not public.is_coach_member(p_athlete_id) then
    raise exception 'coach_preview_not_authorized' using errcode = '42501';
  end if;
  if not public.coaching_sync_enabled() then
    raise exception 'coaching_sync_paused' using errcode = '42501';
  end if;
  return jsonb_build_object(
    'schema_version', 1, 'athlete_id', p_athlete_id, 'subject', (select auth.uid()),
    'days', coalesce((
      select jsonb_agg(jsonb_build_object(
        'day_id', d.id, 'scheduled_on', d.scheduled_on,
        'forge_program_id', d.forge_program_id,
        'forge_program_digest', d.forge_program_digest,
        'session_key', d.session_key, 'title', d.title,
        'emphasis', d.emphasis, 'exercises', d.exercises
      ) order by d.scheduled_on, d.session_key)
      from public.form_training_strength_days d
      where d.athlete_id = p_athlete_id and d.cleared_at is null
        and d.scheduled_on between p_from and p_to
    ), '[]'::jsonb)
  );
end;
$$;
