-- Exercises the actual candidate functions in a throwaway PostgreSQL service.
-- Do not run this file against production or an existing Supabase database.
\set ON_ERROR_STOP on

-- Anonymous callers cannot execute the privileged RPC at all.
set role anon;
set request.jwt.claim.sub = '';
do $test$
begin
  begin
    perform public.coach_race_editorial_workbench_read();
    raise exception 'FAIL: anonymous read was allowed';
  exception when insufficient_privilege then null;
  end;
end
$test$;
reset role;

-- An unrelated authenticated user is still not a coaching administrator.
set role authenticated;
set request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';
do $test$
begin
  begin
    perform public.coach_race_editorial_workbench_read();
    raise exception 'FAIL: unrelated user read drafts';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.coach_race_editorial_save_draft(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,public.test_race_payload());
    raise exception 'FAIL: unrelated user saved a draft';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.coach_race_editorial_publish_draft('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1);
    raise exception 'FAIL: unrelated user published';
  exception when insufficient_privilege then null;
  end;
  begin
    perform count(*) from coach_race_private.editorial_drafts;
    raise exception 'FAIL: authenticated role read private draft table directly';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into storage.objects (bucket_id,name,owner_id) values
      ('collective-media','races/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp',
       '22222222-2222-4222-8222-222222222222');
    raise exception 'FAIL: unrelated user uploaded a race cover';
  exception when insufficient_privilege then null;
  end;
end
$test$;
reset role;

-- Authorized read exposes only the intended race editor fields.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $test$
declare v_data jsonb;
begin
  v_data:=public.coach_race_editorial_workbench_read();
  if v_data->>'schema_version'<>'1' or jsonb_array_length(v_data->'events')<>2 then
    raise exception 'FAIL: admin race workbench read is incomplete';
  end if;
  if public.coach_race_editorial_save_draft(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,public.test_race_payload())<>1 then
    raise exception 'FAIL: first draft revision is not 1';
  end if;
  begin
    perform public.coach_race_editorial_save_draft(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,public.test_race_payload());
    raise exception 'FAIL: stale draft revision was accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.coach_race_editorial_save_draft(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1,
      public.test_race_payload()||'{"race_entries":[{"status":"registered"}]}'::jsonb);
    raise exception 'FAIL: protected athlete fields were accepted';
  exception when invalid_parameter_value then null;
  end;
end
$test$;
reset role;

-- Saving an unpublished draft must not touch canonical or editorial facts.
do $test$
begin
  if (select name from public.race_events where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>'Existing Race'
    or (select brief from coach_race_private.event_editorial where event_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>'Existing published copy.'
    or (select count(*) from coach_race_private.editorial_publication_history)<>0 then
    raise exception 'FAIL: drafting changed published records';
  end if;
end
$test$;

-- A live agent edit invalidates the draft; no lost-update publication.
update public.race_events set name='External Agent Edit',updated_at=clock_timestamp()+interval '5 seconds'
  where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $test$
begin
  begin
    perform public.coach_race_editorial_publish_draft('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1);
    raise exception 'FAIL: stale canonical facts were overwritten';
  exception when serialization_failure then null;
  end;
end
$test$;
reset role;
do $test$
begin
  if (select name from public.race_events where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>'External Agent Edit'
    or (select count(*) from coach_race_private.editorial_publication_history)<>0
    or (select count(*) from coach_race_private.editorial_drafts)<>1 then
    raise exception 'FAIL: stale publication was not atomic';
  end if;
end
$test$;

-- Restart a fresh draft from the changed canonical state; this reset is
-- fixture-only and is not an exposed product operation.
delete from coach_race_private.editorial_drafts
  where event_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $test$
declare v_response jsonb;
begin
  if public.coach_race_editorial_save_draft(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',0,public.test_race_payload())<>1 then
    raise exception 'FAIL: fresh draft could not be saved';
  end if;
  v_response:=public.coach_race_editorial_publish_draft('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',1);
  if v_response->>'event_id'<>'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' then
    raise exception 'FAIL: publish response references wrong event';
  end if;
end
$test$;
reset role;
do $test$
begin
  if (select name from public.race_events where id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>'Edited Race'
    or (select brief from coach_race_private.event_editorial where event_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>'A concise, sourced race description.'
    or (select count(*) from coach_race_private.editorial_publication_history where event_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>1
    or (select count(*) from coach_race_private.editorial_drafts where event_id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa')<>0 then
    raise exception 'FAIL: photo-free publication was not atomic or auditable';
  end if;
end
$test$;

-- A cover requires a real object in this event's uniquely versioned folder.
set role authenticated;
set request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';
do $test$
declare v_cover text;
        v_payload jsonb;
begin
  v_cover:='https://pbgsjjegycacodiltbhn.supabase.co/storage/v1/object/public/collective-media/races/'
    ||'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp';
  v_payload:=public.test_race_payload('Cover Race')||jsonb_build_object(
    'starts_on','2027-02-07','ends_on','2027-02-07','cover_image_url',v_cover,
    'cover_image_alt','Runner on the course','cover_rights_confirmed',true);
  begin
    perform public.coach_race_editorial_save_draft('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,v_payload);
    raise exception 'FAIL: nonexistent cover was accepted';
  exception when invalid_parameter_value then null;
  end;
  insert into storage.objects (bucket_id,name,owner_id,metadata) values
    ('collective-media','races/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/cccccccc-cccc-4ccc-8ccc-cccccccccccc.webp',
    '11111111-1111-4111-8111-111111111111','{"mimetype":"image/webp"}'::jsonb);
  if public.coach_race_editorial_save_draft('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',0,v_payload)<>1 then
    raise exception 'FAIL: approved cover draft could not be saved';
  end if;
  perform public.coach_race_editorial_publish_draft('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',1);
end
$test$;
reset role;
do $test$
begin
  if (select cover_image_alt from coach_race_private.event_editorial
      where event_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')<>'Runner on the course'
    or (select count(*) from coach_race_private.editorial_publication_history
        where event_id='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')<>1 then
    raise exception 'FAIL: cover publication did not persist the expected facts';
  end if;
end
$test$;

select 'PASS: PostgreSQL race workbench authorization, conflict, atomic publication and media tests' as result;
