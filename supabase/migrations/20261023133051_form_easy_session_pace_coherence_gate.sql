-- FORM easy-day consistency gate. The coach sets an athlete-specific easy floor.
-- A session labeled "easy" may include brief strides, but cannot carry a faster
-- interval or continuous pace. Reject at the data boundary, not after it reaches Week.

create table if not exists public.athlete_running_guardrails (
  athlete_id uuid primary key references public.athletes(id) on delete cascade,
  easy_min_seconds_per_mile integer not null
    check (easy_min_seconds_per_mile between 360 and 900),
  updated_at timestamptz not null default now(),
  reason text not null
);
alter table public.athlete_running_guardrails enable row level security;
revoke all on public.athlete_running_guardrails from anon, authenticated;

-- Brice's current explicit cohort easy rule: 8:00/mi or slower.
insert into public.athlete_running_guardrails(athlete_id,easy_min_seconds_per_mile,reason)
select id,480,'FORM cohort / Elijah easy pace standard, October 2026'
from public.athletes
where slug in ('brice','david','sam-reyes','tinius','kevin','elijah')
on conflict (athlete_id) do nothing;

create or replace function public.form_easy_pace_seconds(p_text text)
returns integer language sql immutable set search_path to 'public', 'pg_temp'
as $$
 select case when p_text ~ '^[0-9]{1,2}:[0-5][0-9]$'
 then split_part(p_text,':',1)::integer*60+split_part(p_text,':',2)::integer
 else null end;
$$;

create or replace function public.form_easy_min_seconds(p_athlete_id uuid)
returns integer language sql stable security definer set search_path to 'public', 'pg_temp'
as $$
 select coalesce((select easy_min_seconds_per_mile from public.athlete_running_guardrails where athlete_id=p_athlete_id),420);
$$;
revoke all on function public.form_easy_min_seconds(uuid) from public, anon, authenticated;

create or replace function public.form_reject_easy_fast_component()
returns trigger language plpgsql security definer set search_path to 'public', 'pg_temp'
as $$
declare
  session_title text;
  min_easy integer;
  fastest integer;
  short_stride boolean;
begin
  if new.role <> 'work' then return new; end if;
  select v.title into session_title from public.planned_session_versions v where v.id=new.version_id;
  if session_title is null or session_title !~* '(^|[^[:alnum:]])easy([^[:alnum:]]|$)' then return new; end if;
  min_easy := public.form_easy_min_seconds(new.athlete_id);
  fastest := least(
     coalesce(new.pace_low_seconds,public.form_easy_pace_seconds(new.pace_low),99999),
     coalesce(new.pace_high_seconds,public.form_easy_pace_seconds(new.pace_high),99999)
  );
  short_stride := new.duration_seconds is not null and new.duration_seconds <= 30
                   and coalesce(new.repeat_count,1) <= 10
                   and coalesce(new.recovery_seconds,0) >= 30;
  if fastest < min_easy and not short_stride then
    raise exception using errcode='23514',
      message='FORM prescription conflict: an easy session includes faster running',
      detail=format('Session "%s" includes a work pace of %s sec/mi; this athlete''s easy floor is %s sec/mi.',session_title,fastest,min_easy),
      hint='Publish a separate accurately labeled quality workout, or replace the fast work with genuine easy running. Do not change just the displayed title.';
  end if;
  return new;
end;
$$;
drop trigger if exists form_easy_fast_component_guard on public.planned_session_components;
create trigger form_easy_fast_component_guard
 before insert or update of role,pace_low,pace_high,pace_low_seconds,pace_high_seconds,duration_seconds,repeat_count,recovery_seconds,version_id
 on public.planned_session_components for each row execute function public.form_reject_easy_fast_component();

create or replace function public.form_reject_easy_fast_version()
returns trigger language plpgsql security definer set search_path to 'public', 'pg_temp'
as $$
declare
  min_easy integer;
  fastest integer;
begin
  if new.title !~* '(^|[^[:alnum:]])easy([^[:alnum:]]|$)' then return new; end if;
  min_easy := public.form_easy_min_seconds(new.athlete_id);
  fastest := least(
    coalesce(public.form_easy_pace_seconds(new.pace_low),99999),
    coalesce(public.form_easy_pace_seconds(new.pace_high),99999)
  );
  if fastest < min_easy then
    raise exception using errcode='23514',
      message='FORM prescription conflict: easy session header has a fast pace',
      detail=format('The easy pace cannot be faster than %s sec/mi for this athlete.',min_easy),
      hint='Revise the actual session prescription and title together.';
  end if;
  return new;
end;
$$;
drop trigger if exists form_easy_fast_version_guard on public.planned_session_versions;
create trigger form_easy_fast_version_guard
 before insert or update of title,pace_low,pace_high on public.planned_session_versions
 for each row execute function public.form_reject_easy_fast_version();

-- Existing published versions are retained as history. Audit them separately;
-- do not rewrite old workouts or retroactively change filed evidence.