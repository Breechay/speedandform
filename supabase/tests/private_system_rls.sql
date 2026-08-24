begin;

create extension if not exists pgtap with schema extensions;
select plan(17);

-- Test identities are transaction-local and never survive the rollback.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values
  ('90000000-0000-4000-8000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natalie-test@example.com', '', now(), '{}'::jsonb, now(), now()),
  ('90000000-0000-4000-8000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'coach-test@example.com', '', now(), '{}'::jsonb, now(), now()),
  ('90000000-0000-4000-8000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'other-test@example.com', '', now(), '{}'::jsonb, now(), now()),
  ('90000000-0000-4000-8000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'unverified-test@example.com', '', null, '{}'::jsonb, now(), now());

insert into public.access_invites (athlete_id, email, role)
values ('10000000-0000-4000-8000-000000000002', 'unverified-test@example.com', 'athlete');

insert into public.athlete_memberships (athlete_id, user_id, role) values
  ('10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000001', 'athlete'),
  ('10000000-0000-4000-8000-000000000001', '90000000-0000-4000-8000-000000000002', 'coach'),
  ('10000000-0000-4000-8000-000000000002', '90000000-0000-4000-8000-000000000003', 'athlete');

select ok(c.relrowsecurity, c.relname || ' has RLS enabled')
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in ('athletes', 'session_completions', 'coach_private_notes', 'record_publications')
order by c.relname;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000001","role":"authenticated","email":"natalie-test@example.com"}', true);

select ok(public.is_athlete_member('10000000-0000-4000-8000-000000000001'), 'Natalie is recognized as her own athlete');
select is(public.is_coach_member('10000000-0000-4000-8000-000000000001'), false, 'Natalie is not promoted to coach');
select is((select count(*)::integer from public.athletes), 1, 'Athlete sees only her own athlete row');
select is((select count(*)::integer from public.coach_private_notes), 0, 'Athlete sees no coach-private notes');
select is((select count(*)::integer from public.coach_tasks), 0, 'Athlete sees no coach decision queue');
select is((select count(*)::integer from public.session_completions where athlete_id = '10000000-0000-4000-8000-000000000001'), 1, 'Athlete can read her completion');

insert into public.session_completions (
  id, athlete_id, status, actual_distance, distance_unit, athlete_note, source, filed_by
) values (
  '91000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'completed', 2, 'mi', 'First filing', 'athlete',
  '90000000-0000-4000-8000-000000000001'
);
update public.session_completions
set athlete_note = 'Corrected by athlete'
where id = '91000000-0000-4000-8000-000000000001';
select is(
  (select athlete_note from public.session_completions where id = '91000000-0000-4000-8000-000000000001'),
  'Corrected by athlete',
  'Athlete can correct her own actual'
);

select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000002","role":"authenticated","email":"coach-test@example.com"}', true);
select ok(public.is_coach_member('10000000-0000-4000-8000-000000000001'), 'Assigned coach is recognized');
select is((select count(*)::integer from public.athletes), 1, 'Coach sees only assigned athlete rows');
select is((select count(*)::integer from public.coach_tasks), 1, 'Coach sees assigned decision queue');
update public.session_completions
set athlete_note = 'Coach must not rewrite this'
where id = '16000000-0000-4000-8000-000000000001';
select is(
  (select athlete_note from public.session_completions where id = '16000000-0000-4000-8000-000000000001'),
  'Felt composed. Checking how the knee settles the next morning.',
  'Coach cannot rewrite athlete actuals'
);

select set_config('request.jwt.claims', '{"sub":"90000000-0000-4000-8000-000000000004","role":"authenticated","email":"unverified-test@example.com"}', true);
select throws_ok(
  'select public.claim_access()',
  'P0001',
  'A verified email session is required',
  'An unverified auth row cannot claim an athlete invitation'
);
select is(
  (select count(*)::integer from public.athlete_memberships where user_id = '90000000-0000-4000-8000-000000000004'),
  0,
  'Creating an unverified auth row does not consume membership access'
);

select * from finish();
rollback;
