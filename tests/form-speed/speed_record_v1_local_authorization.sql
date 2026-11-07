\set ON_ERROR_STOP on

set role authenticated;
set request.jwt.claim.sub='10000000-0000-0000-0000-000000000002';
insert into public.athlete_speed_record_benchmarks
  (id,athlete_id,block_id,identity_key,display_shape,position,created_by) values
  ('80000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','mixed-1k-600-400','1K / 600 / 400 × 2',1,'10000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001','two-by-ten','2 × 10',2,'10000000-0000-0000-0000-000000000002');
insert into public.athlete_speed_record_versions
  (benchmark_id,athlete_id,planned_session_id,planned_session_version_id,linked_by) values
  ('80000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000002'),
  ('80000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002','60000000-0000-0000-0000-000000000003','10000000-0000-0000-0000-000000000002');

do $test$
declare payload jsonb;
begin
  payload:=public.athlete_speed_record_v1('20000000-0000-0000-0000-000000000001');
  if jsonb_array_length(payload->'benchmarks')<>2 then raise exception 'Coach feed benchmark mismatch'; end if;
  if (payload#>>'{benchmarks,0,completedAttemptCount}')::integer<>1 then raise exception 'Six reps must count as one attempt'; end if;
  if (payload#>>'{benchmarks,0,latestCompletedAttempt,avgWorkPaceSecondsPerMile}')::integer<>326 then
    raise exception 'Weighted work pace mismatch: %',payload#>>'{benchmarks,0,latestCompletedAttempt,avgWorkPaceSecondsPerMile}';
  end if;
  if jsonb_array_length(payload#>'{benchmarks,0,latestCompletedAttempt,displaySplitPair}')<>2 then
    raise exception 'Trustworthy repeated-distance split pair missing';
  end if;
  if jsonb_array_length(payload->'upcoming')<>1
     or payload#>>'{upcoming,0,versionId}'<>'60000000-0000-0000-0000-000000000003' then
    raise exception 'Upcoming must use only the newest linked published version';
  end if;
end;
$test$;

set request.jwt.claim.sub='10000000-0000-0000-0000-000000000001';
do $test$
declare payload jsonb;
begin
  payload:=public.athlete_speed_record_v1('20000000-0000-0000-0000-000000000001');
  if payload is null or jsonb_array_length(payload->'benchmarks')<>2 then raise exception 'Athlete own feed denied'; end if;
end;
$test$;

set request.jwt.claim.sub='10000000-0000-0000-0000-000000000003';
do $test$
begin
  if public.athlete_speed_record_v1('20000000-0000-0000-0000-000000000001') is not null then
    raise exception 'Outsider read another athlete';
  end if;
end;
$test$;

reset role;
set role anon;
do $test$
begin
  perform public.athlete_speed_record_v1('20000000-0000-0000-0000-000000000001');
  raise exception 'Anon execution unexpectedly succeeded';
exception when insufficient_privilege then null;
end;
$test$;
reset role;
