-- Disposable PostgreSQL fixture for the race workbench SQL candidate.
-- NEVER run against a real Supabase project. This models only the referenced
-- contracts so that function parsing, grants, RLS and transactions are tested.

create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema storage;
create schema coach_race_private;

create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable set search_path = ''
as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;

create table public.coach_admins (user_id uuid primary key references auth.users(id));
create function public.is_active_coaching_administrator(p_user uuid)
returns boolean language sql stable security definer set search_path = ''
as $$select exists (select 1 from public.coach_admins where user_id=p_user)$$;

create table public.race_events (
  id uuid primary key,
  slug text not null,
  name text not null,
  discipline text not null,
  starts_on date not null,
  ends_on date not null,
  city text,
  venue text,
  official_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table coach_race_private.event_editorial (
  event_id uuid primary key references public.race_events(id),
  publication_status text,
  cover_image_url text,
  cover_image_alt text,
  cover_rights_confirmed boolean,
  brief text,
  brief_source_url text,
  course_overview text,
  full_course text,
  half_course text,
  start_address text,
  start_time text,
  source_checked_at date,
  published_at timestamptz,
  updated_at timestamptz not null default now()
);

create table storage.objects (
  id bigint generated always as identity primary key,
  bucket_id text not null,
  name text not null unique,
  owner_id text,
  metadata jsonb
);
alter table storage.objects enable row level security;
create function storage.foldername(p_name text) returns text[]
language sql immutable set search_path = '' as $function$
  select (string_to_array(p_name,'/'))[1:array_length(string_to_array(p_name,'/'),1)-1]
$function$;

grant usage on schema auth,storage to authenticated;
grant execute on function auth.uid() to authenticated;
grant execute on function storage.foldername(text) to authenticated;
grant insert on storage.objects to authenticated;
grant usage on sequence storage.objects_id_seq to authenticated;

insert into auth.users (id) values
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');
insert into public.coach_admins (user_id)
  values ('11111111-1111-4111-8111-111111111111');
insert into public.race_events (id,slug,name,discipline,starts_on,ends_on,city,official_url) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','test-half','Existing Race','run','2027-01-31','2027-01-31','Miami','https://example.org/race'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','test-full','Another Race','run','2027-02-07','2027-02-07','Orlando','https://example.org/other');
insert into coach_race_private.event_editorial
  (event_id,publication_status,brief,brief_source_url,source_checked_at) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa','published','Existing published copy.','https://example.org/race','2026-10-29'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb','published','Second published copy.','https://example.org/other','2026-10-29');

-- Fixture-only payload helper. Nothing here ships to production.
create function public.test_race_payload(p_name text default 'Edited Race')
returns jsonb language sql stable set search_path = '' as $function$
  select jsonb_build_object(
    'name',p_name,'starts_on','2027-01-31','ends_on','2027-01-31',
    'city','Miami','venue',null,'official_url','https://example.org/race',
    'brief','A concise, sourced race description.','brief_source_url','https://example.org/race',
    'course_overview',null,'full_course',null,'half_course',null,
    'start_address',null,'start_time',null,'source_checked_at','2026-10-29',
    'cover_image_url',null,'cover_image_alt',null,'cover_rights_confirmed',false
  )
$function$;
