-- Simon's Dec 3 Nashville Sharpening is authored/displayed in kilometers, while
-- canonical pace quantities remain seconds per mile. Append v6; never rewrite
-- the study-owned v5 evidence or its session/block identity.
do $$
declare
  athlete uuid;
  session_id uuid;
  prior public.planned_session_versions%rowtype;
  revised_version uuid := gen_random_uuid();
  work_count integer;
begin
  select id into strict athlete from public.athletes where slug='simon';
  select p.id into strict session_id
  from public.planned_sessions p
  join lateral (
    select v.title,v.version_number
    from public.planned_session_versions v
    where v.planned_session_id=p.id and v.athlete_id=p.athlete_id
    order by v.version_number desc limit 1
  ) latest on true
  where p.athlete_id=athlete and p.scheduled_on=date '2026-12-03'
    and latest.title='Nashville Sharpening' and latest.version_number=5;

  select * into strict prior from public.planned_session_versions
   where planned_session_id=session_id and athlete_id=athlete
   order by version_number desc limit 1;

  if prior.version_number <> 5 or prior.title <> 'Nashville Sharpening' then
    raise exception 'Simon Nashville source version changed; review before appending';
  end if;

  select count(*) into work_count from public.planned_session_components
   where version_id=prior.id and role='work' and repeat_count=4
     and duration_seconds=60 and pace_low_seconds=230 and pace_high_seconds=240;
  if work_count <> 1 then
    raise exception 'Simon Nashville v5 work pace no longer matches the reviewed source';
  end if;

  insert into public.planned_session_versions (
    id,athlete_id,planned_session_id,version_number,title,prescribed_distance,
    distance_unit,prescribed_duration_minutes,intent,details,change_reason,
    authored_by,created_at,rpe_low,rpe_high,pace_low,pace_high,shape,coach_note,
    vault_session_version_id
  ) values (
    revised_version,prior.athlete_id,prior.planned_session_id,prior.version_number+1,
    prior.title,prior.prescribed_distance,'km',prior.prescribed_duration_minutes,
    prior.intent,prior.details,
    'Authorized 2026-11-05: preserve 3:50–4:00/km display; correct canonical pace from 230–240 to 370–386 seconds per mile; retain study-owned provenance and v5 history.',
    prior.authored_by,now(),prior.rpe_low,prior.rpe_high,prior.pace_low,
    prior.pace_high,prior.shape,prior.coach_note,prior.vault_session_version_id
  );

  insert into public.planned_session_components (
    id,athlete_id,version_id,position,role,shape,repeat_count,distance,
    distance_unit,duration_seconds,recovery_seconds,recovery_kind,pace_low,
    pace_high,rpe_low,rpe_high,created_at,repeat_minimum,repeat_target,
    repeat_progression,repeat_ceiling,rpe_source,rpe_default_version,
    pace_low_seconds,pace_high_seconds,counts_toward_mark_id
  )
  select gen_random_uuid(),athlete_id,revised_version,position,role,shape,
    repeat_count,distance,distance_unit,duration_seconds,recovery_seconds,
    recovery_kind,
    case when role='work' then '3:50' else pace_low end,
    case when role='work' then '4:00' else pace_high end,
    rpe_low,rpe_high,now(),repeat_minimum,repeat_target,repeat_progression,
    repeat_ceiling,rpe_source,rpe_default_version,
    case when role='work' then 370 else pace_low_seconds end,
    case when role='work' then 386 else pace_high_seconds end,
    counts_toward_mark_id
  from public.planned_session_components where version_id=prior.id;

  insert into public.athlete_speed_settings (athlete_id,pace_unit)
  values (athlete,'km')
  on conflict (athlete_id) do update set pace_unit='km',updated_at=now();
end $$;
