CREATE OR REPLACE FUNCTION coach_audit_private.run_plan_audit(p_as_of date DEFAULT CURRENT_DATE, p_source text DEFAULT 'manual'::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
    select ac.*,s.id session_id,s.scheduled_on,v.id version_id,v.title,v.coach_note,v.prescribed_distance,v.distance_unit
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
    select f.athlete_id,'REVIEW','UNAUTHORED_QUALITY_SESSION',f.scheduled_on,
           'A published quality session within 21 days has no structured work. Author the actual workout or remove the placeholder before the athlete sees it.'
      from future f
     where f.scheduled_on between p_as_of and p_as_of+21
       and f.title ~* '(tempo|threshold|speed|track|interval|race pace|goal rhythm)'
       and not exists (select 1 from public.planned_session_components c
                       where c.version_id=f.version_id and c.role='work')
    union all
    select f.athlete_id,'REVIEW','QUALITY_TARGETS_MISSING',f.scheduled_on,
           'A near-term quality workout has no pace or RPE target in its structured work. Assign an athlete-specific effort target.'
      from future f
     where f.scheduled_on between p_as_of and p_as_of+21
       and f.title ~* '(tempo|threshold|speed|interval|race pace|goal rhythm)'
       and exists(select 1 from public.planned_session_components c
                  where c.version_id=f.version_id and c.role='work')
       and not exists(select 1 from public.planned_session_components c
                      where c.version_id=f.version_id and c.role='work'
                        and (c.pace_low_seconds is not null or c.pace_low is not null or c.rpe_low is not null))
    union all
    select f.athlete_id,'REVIEW','RACE_TAPER_GROUP_COLLISION',f.scheduled_on,
           'A hard recurring group workout falls within ten days of the race. Replace it with an individualized race-week prescription.'
      from future f where f.race_on is not null
        and f.scheduled_on between f.race_on-10 and f.race_on-1
        and f.title ~* '(iRUN|FORM Thursday|FORM Track)'
        and f.title !~* '(easy|shakeout|strides)'
        and coalesce(f.coach_note,'') !~* '(coach-owned rolling prescription|individualized speed reserve|race-first taper)'
    union all
    select ac.athlete_id,'URGENT','RECENT_PAIN_SIGNAL',p_as_of,
           'A filed recent run reports pain, swelling or similar symptoms. Check recovery and clinical constraints before prescribing more quality.'
      from active ac where exists (
        select 1 from public.session_completions c
         where c.athlete_id=ac.athlete_id and c.filed_at::date between p_as_of-21 and p_as_of
           and coalesce(c.symptoms,'') ~* '(pain|flare|swelling|sharp|numb|limp)'
      )
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
$function$
;
