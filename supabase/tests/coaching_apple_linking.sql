-- Synthetic database-contract tests only. Not a real Apple/email login test.
-- Every fixture and mutation is rolled back; no athlete records are used.
begin;
do $$
declare
  source_id uuid := gen_random_uuid(); apple_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid(); unverified_id uuid := gen_random_uuid();
  a uuid := gen_random_uuid(); b uuid := gen_random_uuid();
  result jsonb; n integer; receipt_id uuid;
begin
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims',jsonb_build_object('role','service_role')::text,true);
  assert not has_function_privilege('anon','public.coaching_connect_apple(uuid,uuid,uuid)','execute'), 'anonymous writer access';
  assert not has_function_privilege('authenticated','public.coaching_connect_apple(uuid,uuid,uuid)','execute'), 'authenticated writer access';
  assert not has_function_privilege('authenticated','public.coaching_apple_link_admit(uuid)','execute'), 'authenticated limiter access';
  assert not has_table_privilege('authenticated','public.coaching_apple_links','select'), 'link table readable';
  insert into auth.users(id,email,email_confirmed_at,created_at,updated_at)
    values(source_id,source_id||'@example.invalid',now(),now(),now()),
          (other_id,other_id||'@example.invalid',now(),now(),now()),
          (unverified_id,unverified_id||'@example.invalid',null,now(),now()),
          (apple_id,null,null,now(),now());
  insert into auth.identities(id,user_id,provider_id,provider,identity_data,created_at,updated_at)
    values(gen_random_uuid(),apple_id,'test-'||apple_id,'apple',jsonb_build_object('sub','test-'||apple_id),now(),now());
  insert into public.athletes(id,slug,display_name,first_name,home_surface,program_name,account_label)
    values(a,'test-'||a,'Test A','Test','form','Test','Test'),(b,'test-'||b,'Test B','Test','form','Test','Test');
  insert into public.athlete_memberships(athlete_id,user_id,role) values(a,source_id,'athlete'),(b,other_id,'athlete');

  begin perform public.coaching_connect_apple(unverified_id,apple_id,a); raise exception 'unverified source accepted'; exception when insufficient_privilege then null; end;
  begin perform public.coaching_connect_apple(source_id,other_id,a); raise exception 'non-Apple proof accepted'; exception when insufficient_privilege then null; end;
  begin perform public.coaching_connect_apple(source_id,apple_id,b); raise exception 'wrong target accepted'; exception when unique_violation then null; end;
  result := public.coaching_connect_apple(source_id,apple_id,a);
  assert result->>'athlete_id'=a::text, 'wrong identity';
  perform public.coaching_connect_apple(source_id,apple_id,a);
  select count(*) into n from public.coaching_apple_links where apple_user_id=apple_id;
  assert n=1,'duplicate bridge';
  select count(*) into n from public.athlete_memberships where user_id=apple_id and role='athlete' and status='active';
  assert n=0,'Apple became a duplicate owner';
  assert (select count(*) from public.athlete_memberships where athlete_id=a and role='athlete' and status='active')=1,'canonical owner changed';
  assert not exists(select 1 from public.athlete_memberships where user_id=apple_id and role='coach'), 'coach grant';
  begin perform public.coaching_connect_apple(other_id,apple_id,b); raise exception 'cross-athlete transfer accepted'; exception when unique_violation then null; end;

  perform set_config('request.jwt.claim.sub',apple_id::text,true);
  assert public.coaching_access_identity()->>'athlete_id'=a::text, 'Apple identity unresolved';
  assert public.is_athlete_member(a), 'own access missing';
  assert not public.is_athlete_member(b), 'cross-athlete read granted';
  assert not public.is_coach_member(a), 'coach privileges inherited';
  receipt_id := public.record_session_from_form_impl('apple-link-test-'||apple_id,'completed',p_actual_distance=>1,p_duration_seconds=>600,p_rpe=>3);
  assert exists(select 1 from public.session_completions where id=receipt_id and athlete_id=a and filed_by=apple_id),'filing identity wrong';
  assert public.record_session_from_form_impl('apple-link-test-'||apple_id,'completed',p_actual_distance=>1,p_duration_seconds=>600,p_rpe=>3)=receipt_id,'retry duplicated receipt';
  begin perform public.record_session_from_form_impl('wrong-'||apple_id,'completed',gen_random_uuid(),p_planned_session_version_id=>gen_random_uuid());
    raise exception 'cross-athlete filing accepted' using errcode='XX000';
    exception when raise_exception then null; end;
  update auth.users set banned_until=now()+interval '1 hour' where id=source_id;
  assert not public.is_athlete_member(a),'banned source granted access';
  update auth.users set banned_until=null where id=source_id;
  update public.athlete_memberships set status='inactive' where user_id=source_id and athlete_id=a;
  assert not public.is_athlete_member(a), 'revoked source left Apple active';
  assert exists(select 1 from public.coaching_apple_links where apple_user_id=apple_id and status='revoked'), 'revocation not recorded';
  begin perform public.coaching_access_identity(); raise exception 'revoked identity resolved'; exception when no_data_found then null; end;
  update public.athlete_memberships set status='active' where user_id=source_id and athlete_id=a;
  assert not public.is_athlete_member(a), 'source reactivation silently re-enabled Apple';
  begin insert into public.athlete_memberships(athlete_id,user_id,role) values(a,apple_id,'athlete'); raise exception 'revoked bridge reactivated'; exception when insufficient_privilege then null; end;
  begin perform public.coaching_connect_apple(source_id,apple_id,a); raise exception 'revoked bridge relinked'; exception when unique_violation then null; end;

  delete from public.athlete_memberships where user_id=apple_id;
  delete from public.coaching_apple_links where apple_user_id=apple_id;
  perform public.coaching_connect_apple(source_id,apple_id,a);
  delete from public.athlete_memberships where user_id=source_id and athlete_id=a;
  assert not public.is_athlete_member(a), 'deleted source left Apple active';

  for n in 1..10 loop assert public.coaching_apple_link_admit(source_id), 'early throttle'; end loop;
  assert not public.coaching_apple_link_admit(source_id), 'throttle missing';
  update public.coaching_apple_link_attempts set window_started_at=now()-interval '11 minutes' where user_id=source_id;
  assert public.coaching_apple_link_admit(source_id), 'throttle never resets';

  delete from public.athlete_memberships where user_id=other_id and athlete_id=b;
  insert into public.athlete_memberships(athlete_id,user_id,role) values(a,source_id,'athlete'),(b,source_id,'athlete');
  perform set_config('request.jwt.claim.sub',source_id::text,true);
  begin perform public.coaching_access_identity(); raise exception 'ambiguous identity chose first athlete'; exception when too_many_rows then null; end;
  begin perform public.coaching_connect_apple(source_id,apple_id,a); raise exception 'ambiguous source linked'; exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.role','authenticated',true);
  begin perform public.coaching_connect_apple(source_id,apple_id,a); raise exception 'non-service role executed writer'; exception when insufficient_privilege then null; end;
end $$;
select 'PASS: dual-proof writer contract, single owner, read/file isolation, receipt idempotency, source revocation/deletion, no reactivation, rate limiting and ambiguity guards' as result;
rollback;
