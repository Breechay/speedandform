-- FORM: private, rules-based coaching review queue. No athlete prescriptions are changed.
-- Full goal / health / execution assessment remains a coach's decision.
create schema if not exists coach_audit_private;
revoke all on schema coach_audit_private from public, anon, authenticated;

create table if not exists coach_audit_private.plan_audit_runs (
  id uuid primary key default gen_random_uuid(),
  reviewed_as_of date not null,
  executed_at timestamptz not null default now(),
  source text not null check (source in ('initial','scheduled','manual')),
  athlete_count integer not null default 0,
  finding_count integer not null default 0
);
create table if not exists coach_audit_private.plan_audit_findings (
  id bigint generated always as identity primary key,
  run_id uuid not null references coach_audit_private.plan_audit_runs(id) on delete cascade,
  athlete_id uuid not null references public.athletes(id),
  severity text not null check (severity in ('URGENT','REVIEW','EVIDENCE')),
  code text not null,
  event_on date,
  detail text not null
);
create index if not exists plan_audit_findings_run_idx on coach_audit_private.plan_audit_findings(run_id, severity, code);
create index if not exists plan_audit_findings_athlete_idx on coach_audit_private.plan_audit_findings(athlete_id, run_id);
alter table coach_audit_private.plan_audit_runs enable row level security;
alter table coach_audit_private.plan_audit_findings enable row level security;
revoke all on all tables in schema coach_audit_private from public, anon, authenticated;

create or replace function coach_audit_private.run_plan_audit(
  p_as_of date default current_date,
  p_source text default 'manual'
) returns uuid
language plpgsql security invoker set search_path = ''
as $body$
declare v_run uuid;
begin
  if p_source not in ('initial','scheduled','manual') then
    raise exception 'Invalid audit source';
  end if;
  insert into coach_audit_private.plan_audit_runs(reviewed_as_of,source)
  values(p_as_of,p_source) returning id into v_run;

  with active as (
    select a.id athlete_id,a.slug,a.goal_pace_seconds,a.target_pace_seconds,a.target_event,
           b.id block_id,b.race_on,b.race_name,b.target_event block_target_event,b.ends_on,
           case when concat_ws(' ',b.race_name,b.target_event,a.target_event) ~* '(half|semi)' then 13.1::numeric
                when concat_ws(' ',b.race_name,b.target_event,a.target_event) ~* '(marathon|full)' then 26.2::numeric
                else null::numeric end as race_distance
      from public.athletes a join public.training_blocks b on b.athlete_id=a.id
     where a.active and b.status='active'
  ), all_block_sessions as (
    select ac.*,s.id session_id,s.scheduled_on,v.title,v.prescribed_distance,v.distance_unit
      from active ac join public.planned_sessions s on s.athlete_id=ac.athlete_id
       and s.week_id in (select w.id from public.training_weeks w where w.block_id=ac.block_id)
       and s.state='published'
      join lateral (select pv.* from public.planned_session_versions pv where pv.planned_session_id=s.id order by pv.version_number desc limit 1) v on true
  ), future as (
    select * from all_block_sessions where scheduled_on>=p_as_of
  ), issues as (
    select ac.athlete_id,'URGENT'::text severity,'RACE_DAY_NOT_IN_ACTIVE_BLOCK'::text code,
           ac.race_on event_on,'No published race-day session in this active training block. Confirm race assignment or event status.'::text detail
      from active ac where ac.race_on >= p_as_of
      and not exists(select 1 from future f where f.block_id=ac.block_id and f.scheduled_on=ac.race_on and f.title ~* '(race|marathon|half)')
    union all
    select ac.athlete_id,'REVIEW','RACE_DISTANCE_ON_CARD',ac.race_on,
           'Race-day card mileage differs from registered race distance; check warm-up versus event distance.'
      from active ac join future f on f.block_id=ac.block_id and f.scheduled_on=ac.race_on
     where ac.race_on>=p_as_of and ac.race_distance is not null and f.prescribed_distance is not null
       and abs((case when lower(coalesce(f.distance_unit,'mi'))='km' then f.prescribed_distance/1.609344 else f.prescribed_distance end)-ac.race_distance)>0.25
    union all
    select ac.athlete_id,'REVIEW','EVENT_NAME_DRIFT',ac.race_on,
           'The block event text does not contain its canonical race name; reconcile event identity.'
      from active ac where ac.race_on>=p_as_of and ac.race_name is not null and ac.block_target_event is not null
       and position(lower(ac.race_name) in lower(ac.block_target_event))=0
    union all
    select ac.athlete_id,'REVIEW','PACE_TARGET_CONTEXT',ac.race_on,
           'Goal pace and training target pace differ by eight seconds per mile or more. Confirm that the distinction is intentional.'
      from active ac where ac.race_on>=p_as_of and ac.goal_pace_seconds is not null and ac.target_pace_seconds is not null
       and abs(ac.goal_pace_seconds-ac.target_pace_seconds)>=8
    union all
    select ac.athlete_id,'REVIEW','MARATHON_LONG_RUN_REVIEW',ac.race_on,
           'The longest remaining pre-taper long run is under 16 miles. Assess completed base, race readiness and fueling without forcing a mileage jump.'
      from active ac where ac.race_on between p_as_of and p_as_of+interval '90 days' and ac.race_distance=26.2
       and coalesce((select max(case when lower(coalesce(f.distance_unit,'mi'))='km' then f.prescribed_distance/1.609344 else f.prescribed_distance end)
           from all_block_sessions f where f.block_id=ac.block_id and f.scheduled_on<ac.race_on-interval '14 days'
           and f.scheduled_on>=ac.race_on-interval '120 days' and f.title ~* '(long run|marathon endurance)'),0)<16
    union all
    select ac.athlete_id,'REVIEW','BLOCK_ENDING_SOON',ac.ends_on,
           'Training block ends within 21 days; schedule coach review of next phase or transition.'
      from active ac where ac.ends_on between p_as_of and p_as_of+interval '21 days' and ac.race_on is null
    union all
    select ac.athlete_id,'REVIEW','EVENT_DATE_TO_CONFIRM',ac.ends_on,
           'An event is named but race_on is unset and block may finish before it. Confirm exact date and race-specific preparation.'
      from active ac where ac.race_on is null and ac.target_event ~* '(20[0-9][0-9]|december|january|february|marathon|hyrox)'
    union all
    select f.athlete_id,'REVIEW','QUALITY_DENSITY',min(f.scheduled_on)::date,
           'Three or more planned quality sessions in one calendar week; check recovery, strength load and which workout serves the goal.'
      from future f where f.title ~* '(tempo|threshold|speed|race pace|goal rhythm|time trial|×|interval|station)'
        and f.title !~* '(^|[^[:alnum:]])easy([^[:alnum:]]|$)'
     group by f.athlete_id,date_trunc('week',f.scheduled_on) having count(*)>=3
    union all
    select ac.athlete_id,'EVIDENCE','RECENT_EXECUTION_NOT_FILED',p_as_of,
           'No training completion filed in FORM within 21 days; outside activity may exist. Obtain evidence before confidently escalating.'
      from active ac where not exists(select 1 from public.session_completions c
        where c.athlete_id=ac.athlete_id and c.filed_at::date between p_as_of-21 and p_as_of)
  )
  insert into coach_audit_private.plan_audit_findings(run_id,athlete_id,severity,code,event_on,detail)
  select v_run,athlete_id,severity,code,event_on,detail from issues;

  update coach_audit_private.plan_audit_runs r
     set athlete_count=(select count(*) from public.training_blocks b join public.athletes a on a.id=b.athlete_id where b.status='active' and a.active),
         finding_count=(select count(*) from coach_audit_private.plan_audit_findings f where f.run_id=v_run)
   where r.id=v_run;
  return v_run;
end
$body$;
revoke all on function coach_audit_private.run_plan_audit(date,text) from public, anon, authenticated;

create or replace function coach_audit_private.run_due_plan_audit()
returns uuid language plpgsql security invoker set search_path=''
as $body$
begin
  -- Cron runs Sundays UTC. Two-week anchor: 2026-11-01, then 11-15, 11-29...
  if (current_date - date '2026-11-01') % 14 = 0 then
    return coach_audit_private.run_plan_audit(current_date,'scheduled');
  end if;
  return null;
end
$body$;
revoke all on function coach_audit_private.run_due_plan_audit() from public, anon, authenticated;

select cron.schedule(
  'form-coach-goal-review-fortnightly',
  '0 21 * * 0',
  'select coach_audit_private.run_due_plan_audit();'
);