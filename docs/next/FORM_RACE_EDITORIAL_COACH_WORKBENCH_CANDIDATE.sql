-- FORM Races: coach-only drafting, sourced publication, revision history and
-- append-only race cover uploads. Apply via the controlled migration release.
-- No athlete entry, result, story, privacy choice or training row is changed.

create table if not exists coach_race_private.editorial_drafts (
  event_id uuid primary key references public.race_events(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 1 check (revision > 0),
  base_event_updated_at timestamptz not null,
  base_editorial_updated_at timestamptz,
  edited_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists coach_race_private.editorial_publication_history (
  id bigint generated always as identity primary key,
  event_id uuid not null references public.race_events(id) on delete cascade,
  published_at timestamptz not null default now(),
  published_by uuid not null references auth.users(id),
  draft_revision integer not null,
  previous_event jsonb not null,
  previous_editorial jsonb,
  published_payload jsonb not null
);

create index if not exists race_editorial_publication_event_date_idx
  on coach_race_private.editorial_publication_history(event_id,published_at desc);

alter table coach_race_private.editorial_drafts enable row level security;
alter table coach_race_private.editorial_publication_history enable row level security;
revoke all on coach_race_private.editorial_drafts from public,anon,authenticated;
revoke all on coach_race_private.editorial_publication_history from public,anon,authenticated;

-- Private read, including unpublished work, only after an actual coach-admin
-- identity check. The athlete calendar continues to read published data only.
create or replace function public.coach_race_editorial_workbench_read()
returns jsonb language plpgsql stable security definer set search_path = ''
as $function$
declare v_data jsonb;
begin
  if auth.uid() is null or not public.is_active_coaching_administrator(auth.uid()) then
    raise exception 'Active coaching administrator required' using errcode='42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'event_id',e.id,
    'event_updated_at',e.updated_at,
    'editorial_updated_at',ed.updated_at,
    'draft_revision',coalesce(d.revision,0),
    'draft',d.payload,
    'published',jsonb_build_object(
      'name',e.name,'discipline',e.discipline,
      'starts_on',e.starts_on,'ends_on',e.ends_on,'city',e.city,
      'venue',e.venue,'official_url',e.official_url,
      'brief',ed.brief,'brief_source_url',ed.brief_source_url,
      'course_overview',ed.course_overview,'full_course',ed.full_course,
      'half_course',ed.half_course,'start_address',ed.start_address,
      'start_time',ed.start_time,'cover_image_url',ed.cover_image_url,
      'cover_image_alt',ed.cover_image_alt,
      'cover_rights_confirmed',coalesce(ed.cover_rights_confirmed,false),
      'source_checked_at',ed.source_checked_at,
      'publication_status',coalesce(ed.publication_status,'unwritten'),
      'published_at',ed.published_at
    )
  ) order by e.starts_on,e.name),'[]'::jsonb) into v_data
  from public.race_events e
  left join coach_race_private.event_editorial ed on ed.event_id=e.id
  left join coach_race_private.editorial_drafts d on d.event_id=e.id;

  return jsonb_build_object('schema_version',1,'read_at',now(),'events',v_data);
end;
$function$;

-- The workbench submits a full snapshot, not a partial patch. Reject unknown
-- fields rather than silently accepting guessed schema or private athlete data.
create or replace function public.coach_race_editorial_save_draft(
  p_event_id uuid, p_expected_revision integer, p_payload jsonb
) returns integer language plpgsql security definer set search_path = ''
as $function$
declare
  v_event record;
  v_editorial_updated_at timestamptz;
  v_revision integer;
  v_cover text := nullif(p_payload->>'cover_image_url','');
  v_allowed text[] := array[
    'name','starts_on','ends_on','city','venue','official_url',
    'brief','brief_source_url','course_overview','full_course','half_course',
    'start_address','start_time','cover_image_url','cover_image_alt',
    'cover_rights_confirmed','source_checked_at'
  ];
begin
  if auth.uid() is null or not public.is_active_coaching_administrator(auth.uid()) then
    raise exception 'Active coaching administrator required' using errcode='42501';
  end if;
  if p_payload is null or jsonb_typeof(p_payload)<>'object'
    or (p_payload - v_allowed) <> '{}'::jsonb then
    raise exception 'Unsupported race editor fields' using errcode='22023';
  end if;
  if nullif(btrim(p_payload->>'name'),'') is null
    or char_length(p_payload->>'name')>240
    or nullif(p_payload->>'starts_on','') is null
    or nullif(p_payload->>'ends_on','') is null
    or (p_payload->>'starts_on')::date > (p_payload->>'ends_on')::date then
    raise exception 'Race name and valid event dates required' using errcode='22023';
  end if;
  if char_length(coalesce(p_payload->>'brief',''))>240
    or char_length(coalesce(p_payload->>'course_overview',''))>500
    or char_length(coalesce(p_payload->>'full_course',''))>500
    or char_length(coalesce(p_payload->>'half_course',''))>500
    or char_length(coalesce(p_payload->>'start_address',''))>500
    or char_length(coalesce(p_payload->>'start_time',''))>180
    or char_length(coalesce(p_payload->>'city',''))>180
    or char_length(coalesce(p_payload->>'venue',''))>250 then
    raise exception 'A race editor field exceeds its length limit' using errcode='22023';
  end if;
  if (nullif(p_payload->>'official_url','') is not null
    and (p_payload->>'official_url') !~* '^https://[^ ]+$')
    or (nullif(p_payload->>'brief_source_url','') is not null
    and (p_payload->>'brief_source_url') !~* '^https://[^ ]+$') then
    raise exception 'Organizer and source links must be HTTPS' using errcode='22023';
  end if;
  if v_cover is not null and (
    v_cover !~ ('^https://pbgsjjegycacodiltbhn\.supabase\.co/storage/v1/object/public/collective-media/races/'
      || p_event_id::text
      || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$')
    or not exists (
      select 1 from storage.objects o where o.bucket_id='collective-media'
        and o.name=split_part(v_cover,'/collective-media/',2)
    )
  ) then
    raise exception 'Cover must be an existing versioned upload in this race media folder' using errcode='22023';
  end if;
  if p_payload->>'source_checked_at' is not null
    and (p_payload->>'source_checked_at')::date>current_date then
    raise exception 'Source check date cannot be in the future' using errcode='22023';
  end if;

  select e.id,e.updated_at into v_event from public.race_events e
    where e.id=p_event_id for update;
  if not found then raise exception 'Race event not found' using errcode='P0002'; end if;
  select ed.updated_at into v_editorial_updated_at
    from coach_race_private.event_editorial ed where ed.event_id=p_event_id;
  select d.revision into v_revision from coach_race_private.editorial_drafts d
    where d.event_id=p_event_id for update;
  if coalesce(v_revision,0) is distinct from p_expected_revision then
    raise exception 'Race draft changed; refresh before saving' using errcode='40001';
  end if;
  if v_revision is null then
    insert into coach_race_private.editorial_drafts
      (event_id,payload,revision,base_event_updated_at,base_editorial_updated_at,edited_by)
      values (p_event_id,p_payload,1,v_event.updated_at,v_editorial_updated_at,auth.uid());
    return 1;
  end if;
  update coach_race_private.editorial_drafts
     set payload=p_payload,revision=revision+1,edited_by=auth.uid(),updated_at=now()
   where event_id=p_event_id returning revision into v_revision;
  return v_revision;
end;
$function$;

-- Publication is the only operation that changes athlete-visible event facts.
-- Stale drafts cannot overwrite subsequent edits by an agent or second coach.
create or replace function public.coach_race_editorial_publish_draft(
  p_event_id uuid, p_expected_revision integer
) returns jsonb language plpgsql security definer set search_path = ''
as $function$
declare
  v_event public.race_events%rowtype;
  v_ed coach_race_private.event_editorial%rowtype;
  v_draft coach_race_private.editorial_drafts%rowtype;
  v_p jsonb;
  v_cover text;
  v_now timestamptz := clock_timestamp();
begin
  if auth.uid() is null or not public.is_active_coaching_administrator(auth.uid()) then
    raise exception 'Active coaching administrator required' using errcode='42501';
  end if;
  select * into v_event from public.race_events where id=p_event_id for update;
  if not found then raise exception 'Race event not found' using errcode='P0002'; end if;
  select * into v_draft from coach_race_private.editorial_drafts
    where event_id=p_event_id for update;
  if not found or v_draft.revision is distinct from p_expected_revision then
    raise exception 'Draft missing or changed; refresh before publishing' using errcode='40001';
  end if;
  select * into v_ed from coach_race_private.event_editorial where event_id=p_event_id for update;
  if v_event.updated_at is distinct from v_draft.base_event_updated_at
     or v_ed.updated_at is distinct from v_draft.base_editorial_updated_at then
    raise exception 'Race changed since draft began; review fresh source data' using errcode='40001';
  end if;
  v_p:=v_draft.payload;
  v_cover:=nullif(v_p->>'cover_image_url','');
  if v_cover is not null and not exists (
    select 1 from storage.objects o where o.bucket_id='collective-media'
      and o.name=split_part(v_cover,'/collective-media/',2)
  ) then
    raise exception 'Race cover is no longer in Storage; upload a new file' using errcode='22023';
  end if;
  if nullif(v_p->>'source_checked_at','') is null
    or (v_p->>'source_checked_at')::date>current_date
    or (nullif(v_p->>'brief','') is not null and nullif(v_p->>'brief_source_url','') is null)
    or (v_cover is not null and
      (coalesce((v_p->>'cover_rights_confirmed')::boolean,false)=false
        or nullif(btrim(v_p->>'cover_image_alt'),'') is null)) then
    raise exception 'Review the source, brief attribution and cover rights before publishing' using errcode='22023';
  end if;

  insert into coach_race_private.editorial_publication_history
    (event_id,published_by,draft_revision,previous_event,previous_editorial,published_payload)
    values (p_event_id,auth.uid(),v_draft.revision,to_jsonb(v_event),
      case when v_ed.event_id is null then null else to_jsonb(v_ed) end,v_p);
  update public.race_events set
    name=v_p->>'name',starts_on=(v_p->>'starts_on')::date,
    ends_on=(v_p->>'ends_on')::date,
    city=nullif(v_p->>'city',''),venue=nullif(v_p->>'venue',''),
    official_url=nullif(v_p->>'official_url',''),updated_at=v_now
    where id=p_event_id;
  insert into coach_race_private.event_editorial (
    event_id,publication_status,cover_image_url,cover_image_alt,cover_rights_confirmed,
    brief,brief_source_url,course_overview,full_course,half_course,start_address,
    start_time,source_checked_at,published_at,updated_at
  ) values (
    p_event_id,'published',v_cover,nullif(v_p->>'cover_image_alt',''),
    coalesce((v_p->>'cover_rights_confirmed')::boolean,false),
    nullif(v_p->>'brief',''),nullif(v_p->>'brief_source_url',''),
    nullif(v_p->>'course_overview',''),nullif(v_p->>'full_course',''),
    nullif(v_p->>'half_course',''),nullif(v_p->>'start_address',''),
    nullif(v_p->>'start_time',''),(v_p->>'source_checked_at')::date,v_now,v_now
  ) on conflict (event_id) do update set
    publication_status='published',cover_image_url=excluded.cover_image_url,
    cover_image_alt=excluded.cover_image_alt,
    cover_rights_confirmed=excluded.cover_rights_confirmed,brief=excluded.brief,
    brief_source_url=excluded.brief_source_url,course_overview=excluded.course_overview,
    full_course=excluded.full_course,half_course=excluded.half_course,
    start_address=excluded.start_address,start_time=excluded.start_time,
    source_checked_at=excluded.source_checked_at,published_at=v_now,updated_at=v_now;
  delete from coach_race_private.editorial_drafts where event_id=p_event_id;
  return jsonb_build_object('event_id',p_event_id,'published_at',v_now);
end;
$function$;

revoke all on function public.coach_race_editorial_workbench_read() from public,anon;
revoke all on function public.coach_race_editorial_save_draft(uuid,integer,jsonb) from public,anon;
revoke all on function public.coach_race_editorial_publish_draft(uuid,integer) from public,anon;
grant execute on function public.coach_race_editorial_workbench_read() to authenticated;
grant execute on function public.coach_race_editorial_save_draft(uuid,integer,jsonb) to authenticated;
grant execute on function public.coach_race_editorial_publish_draft(uuid,integer) to authenticated;

-- Immutable, versioned covers. No overwrite or delete permission. The public
-- media bucket serves only files a human deliberately uploaded and published.
create policy race_editorial_admin_cover_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id='collective-media'
    and (storage.foldername(name))[1]='races'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    and owner_id=(select auth.uid())::text
    and (select public.is_active_coaching_administrator(auth.uid()))
  );
