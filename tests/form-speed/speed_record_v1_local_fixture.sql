create schema if not exists auth;
create extension if not exists pgcrypto;

create table auth.users(id uuid primary key,email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid;
$$;

create table public.athletes(
  id uuid primary key,user_id uuid references auth.users(id),first_name text,slug text unique
);
create table public.coach_memberships(
  coach_user_id uuid not null references auth.users(id),athlete_id uuid not null references public.athletes(id),
  status text not null default 'active',primary key(coach_user_id,athlete_id)
);
create or replace function public.is_coach_member(target_athlete_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.coach_memberships
    where coach_user_id=auth.uid() and athlete_id=target_athlete_id and status='active');
$$;
create or replace function public.can_read_athlete(target_athlete_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.athletes where id=target_athlete_id and user_id=auth.uid())
    or public.is_coach_member(target_athlete_id);
$$;

create table public.athlete_training_tab_access(
  athlete_id uuid primary key references public.athletes(id),speed_enabled boolean not null default false
);
create table public.training_blocks(
  id uuid primary key,athlete_id uuid not null references public.athletes(id),name text,starts_on date,ends_on date,
  status text not null default 'active',created_at timestamptz not null default now()
);
create table public.training_weeks(
  id uuid primary key,athlete_id uuid not null references public.athletes(id),block_id uuid not null references public.training_blocks(id)
);
create table public.planned_sessions(
  id uuid primary key,athlete_id uuid not null references public.athletes(id),week_id uuid not null references public.training_weeks(id),
  scheduled_on date,position smallint not null,state text not null default 'published'
);
create table public.planned_session_versions(
  id uuid primary key,athlete_id uuid not null references public.athletes(id),
  planned_session_id uuid not null references public.planned_sessions(id),version_number integer not null,title text
);
create table public.planned_session_components(
  id uuid primary key default gen_random_uuid(),athlete_id uuid not null references public.athletes(id),
  version_id uuid not null references public.planned_session_versions(id),position smallint not null,role text not null,
  shape text not null,repeat_count smallint,repeat_target smallint,distance numeric,distance_unit text,
  duration_seconds integer,recovery_seconds integer,pace_low_seconds integer,pace_high_seconds integer
);
create table public.session_completions(
  id uuid primary key,athlete_id uuid not null references public.athletes(id),
  planned_session_id uuid references public.planned_sessions(id),planned_session_version_id uuid references public.planned_session_versions(id),
  status text not null,filed_at timestamptz not null
);
create table public.session_pieces(
  id uuid primary key default gen_random_uuid(),athlete_id uuid not null references public.athletes(id),
  completion_id uuid not null references public.session_completions(id),position smallint not null,kind text not null,
  distance numeric,distance_unit text,duration_seconds integer,duration_seconds_exact numeric
);
create table public.speed_piece_distance_corrections(
  piece_id uuid primary key references public.session_pieces(id),athlete_id uuid not null references public.athletes(id),distance_m integer not null
);

grant usage on schema public,auth to authenticated,anon;
grant select on all tables in schema public to authenticated;
grant select on auth.users to authenticated;
grant execute on function auth.uid(),public.is_coach_member(uuid),public.can_read_athlete(uuid) to authenticated;

insert into auth.users values
 ('10000000-0000-0000-0000-000000000001','athlete@example.test'),
 ('10000000-0000-0000-0000-000000000002','coach@example.test'),
 ('10000000-0000-0000-0000-000000000003','outsider@example.test');
insert into public.athletes values
 ('20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Runner','runner'),
 ('20000000-0000-0000-0000-000000000002',null,'Disabled','disabled');
insert into public.coach_memberships values
 ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','active');
insert into public.athlete_training_tab_access values
 ('20000000-0000-0000-0000-000000000001',true),
 ('20000000-0000-0000-0000-000000000002',false);
insert into public.training_blocks values
 ('30000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','Block',current_date-30,current_date+60,'active',now());
insert into public.training_weeks values
 ('40000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001');
insert into public.planned_sessions values
 ('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',current_date-2,1,'published'),
 ('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001',current_date+7,2,'published');
insert into public.planned_session_versions values
 ('60000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001',1,'Mixed'),
 ('60000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002',1,'Threshold old'),
 ('60000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000002',2,'Threshold current');
insert into public.planned_session_components(athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,recovery_seconds,pace_low_seconds,pace_high_seconds) values
 ('20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',1,'work','repetitions',2,1,'km',120,320,330),
 ('20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',2,'work','repetitions',2,0.6,'km',120,320,330),
 ('20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001',3,'work','repetitions',2,0.4,'km',120,320,330),
 ('20000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000003',1,'work','repetitions',2,null,null,120,350,360);
insert into public.session_completions values
 ('70000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000001','60000000-0000-0000-0000-000000000001','completed',now()-interval '2 days');
insert into public.session_pieces(athlete_id,completion_id,position,kind,distance,distance_unit,duration_seconds) values
 ('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',1,'rep',1,'km',210),
 ('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',2,'rep',0.6,'km',120),
 ('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',3,'rep',0.4,'km',75),
 ('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',4,'rep',1,'km',208),
 ('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',5,'rep',0.6,'km',122),
 ('20000000-0000-0000-0000-000000000001','70000000-0000-0000-0000-000000000001',6,'rep',0.4,'km',75);
