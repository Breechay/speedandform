-- Run in an isolated database after the Speed Record v1 migration.
begin;

do $test$
begin
  if not exists(select 1 from pg_class where relname='athlete_speed_record_benchmarks' and relrowsecurity)
     or not exists(select 1 from pg_class where relname='athlete_speed_record_versions' and relrowsecurity) then
    raise exception 'Speed Record curator tables require RLS';
  end if;
  if has_function_privilege('anon','public.athlete_speed_record_v1(uuid)','execute') then
    raise exception 'Anonymous Speed Record execution is forbidden';
  end if;
  if not has_function_privilege('authenticated','public.athlete_speed_record_v1(uuid)','execute') then
    raise exception 'Authenticated Speed Record execution is missing';
  end if;
  if position('planned_session_version_id=link.planned_session_version_id' in
      pg_get_functiondef('public.athlete_speed_record_v1(uuid)'::regprocedure))=0
     or position('count(distinct id)' in
      pg_get_functiondef('public.athlete_speed_record_v1(uuid)'::regprocedure))=0 then
    raise exception 'Attempts are not pinned to immutable versions and distinct occasions';
  end if;
  if position('sum(piece.duration_seconds)/sum(piece.distance_m)*1609.344' in
      pg_get_functiondef('public.athlete_speed_record_v1(uuid)'::regprocedure))=0 then
    raise exception 'Work pace must be distance weighted';
  end if;
  if position('p.kind=''rep''' in
      pg_get_functiondef('public.athlete_speed_record_v1(uuid)'::regprocedure))=0
     or position('session.state=''published''' in
      pg_get_functiondef('public.athlete_speed_record_v1(uuid)'::regprocedure))=0 then
    raise exception 'Recovery/cancelled or unpublished work can leak into the record';
  end if;
  if position('vault_sessions' in
      pg_get_functiondef('public.athlete_speed_record_v1(uuid)'::regprocedure))>0
     or position('title ilike' in
      pg_get_functiondef('public.athlete_speed_record_v1(uuid)'::regprocedure))>0 then
    raise exception 'Global Vault or title parsing leaked into Speed Record v1';
  end if;
end;
$test$;

rollback;
