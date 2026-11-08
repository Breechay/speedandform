-- Synthetic schema for local-only signed-in Field v2 authorization tests.
-- Never run against a shared or production database.
begin;

create schema if not exists collective_work_internal;

drop table if exists public.speed_piece_distance_corrections cascade;
drop table if exists public.planned_session_components cascade;
drop table if exists public.session_pieces cascade;
drop table if exists public.session_completions cascade;
drop table if exists public.collective_work_posts cascade;
drop table if exists public.collective_people cascade;
drop table if exists public.athletes cascade;
drop table if exists public.field_test_sharing cascade;
drop table if exists public.field_test_roster cascade;

create table public.field_test_roster(user_id uuid primary key);
create table public.field_test_sharing(
  athlete_id uuid primary key,
  enabled boolean not null default true
);
alter table public.field_test_roster enable row level security;
alter table public.field_test_sharing enable row level security;
grant all on public.field_test_sharing to service_role;

create table public.athletes(
  id uuid primary key,
  portrait_path text
);
create table public.collective_people(
  athlete_id uuid not null,
  visible boolean not null default true,
  avatar_path text
);
create table public.session_completions(
  id uuid primary key,
  athlete_id uuid not null,
  status text not null,
  timing_source text,
  source text,
  planned_session_version_id uuid
);
create table public.session_pieces(
  id uuid primary key default gen_random_uuid(),
  completion_id uuid not null,
  athlete_id uuid not null,
  position integer not null,
  kind text not null,
  distance numeric,
  distance_unit text,
  duration_seconds integer,
  duration_seconds_exact numeric
);
create table public.speed_piece_distance_corrections(
  id uuid primary key default gen_random_uuid(),
  piece_id uuid not null,
  athlete_id uuid not null,
  distance_m numeric not null
);
create table public.planned_session_components(
  version_id uuid not null,
  athlete_id uuid not null,
  role text not null,
  shape text not null
);
create table public.collective_work_posts(
  id uuid primary key,
  athlete_id uuid not null,
  first_name text not null,
  session_title text not null,
  source_kind text not null,
  actual_distance numeric,
  distance_unit text,
  duration_seconds integer,
  set_count integer,
  movement_summary text[],
  filed_at timestamptz not null,
  revoked_at timestamptz,
  source_completion_id uuid
);

create or replace function public.collective_work_viewer_on_roster()
returns boolean
language sql stable security definer set search_path=''
as $function$
  select exists(
    select 1 from public.field_test_roster r where r.user_id=(select auth.uid())
  );
$function$;

create or replace function collective_work_internal.publication_allowed(p_athlete_id uuid)
returns boolean
language sql stable security definer set search_path=''
as $function$
  select coalesce((
    select s.enabled from public.field_test_sharing s where s.athlete_id=p_athlete_id
  ),false);
$function$;

revoke all on function public.collective_work_viewer_on_roster() from public,anon;
grant execute on function public.collective_work_viewer_on_roster() to authenticated;
revoke all on function collective_work_internal.publication_allowed(uuid) from public,anon;

insert into public.field_test_roster(user_id) values
  ('11111111-1111-4111-8111-111111111111');
insert into public.field_test_sharing(athlete_id,enabled) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true);
insert into public.athletes(id,portrait_path) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','/avatars/field-v2-test.webp');
insert into public.collective_people(athlete_id,visible,avatar_path) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',true,'/avatars/field-v2-test.webp');

insert into public.session_completions(
  id,athlete_id,status,timing_source,source,planned_session_version_id
) values (
  'c0000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  'completed','manual','athlete','d0000000-0000-4000-8000-000000000001'
);
insert into public.planned_session_components(version_id,athlete_id,role,shape) values (
  'd0000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','work','repetitions'
);

-- Twelve canonical positions: one lacks distance and must be omitted; one receives a signed correction.
insert into public.session_pieces(
  completion_id,athlete_id,position,kind,distance,distance_unit,
  duration_seconds,duration_seconds_exact
)
select
  'c0000000-0000-4000-8000-000000000001',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  n,'rep',
  case when n in (5,6) then null else 400 end,
  case when n in (5,6) then null else 'm' end,
  80+n,(80+n)::numeric+0.125
from generate_series(1,12) n;

insert into public.speed_piece_distance_corrections(piece_id,athlete_id,distance_m)
select id,'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',600
from public.session_pieces where position=6;

insert into public.collective_work_posts(
  id,athlete_id,first_name,session_title,source_kind,actual_distance,
  distance_unit,duration_seconds,set_count,movement_summary,filed_at,
  revoked_at,source_completion_id
) values
  ('e0000000-0000-4000-8000-000000000001',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test','12 × 400 m','run',
   4.8,'km',1000,null,array['12 reps'],now(),null,
   'c0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000002',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test','Forge · Frame','strength',
   null,null,2400,8,array['8 sets'],now()-interval '1 minute',null,null),
  ('e0000000-0000-4000-8000-000000000003',
   'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','Test','Revoked result','run',
   5,'km',1200,null,array['private'],now()-interval '2 minutes',now(),
   'c0000000-0000-4000-8000-000000000001');

commit;
notify pgrst, 'reload schema';
