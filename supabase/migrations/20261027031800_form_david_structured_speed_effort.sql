
begin;
do $$
declare v public.planned_session_versions%rowtype; newid uuid;
begin
 select * into v from public.planned_session_versions where planned_session_id='7f955e60-bd8e-486c-a016-71017886d0a4' order by version_number desc limit 1;
 if v.id is null then raise exception 'David Thursday missing'; end if;
 if exists(select 1 from public.planned_session_components where version_id=v.id and role='work' and rpe_low is not null) then return; end if;
 newid:=gen_random_uuid();
 insert into public.planned_session_versions
   (id,athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
    prescribed_duration_minutes,intent,details,change_reason,authored_by,
    rpe_low,rpe_high,pace_low,pace_high,shape,coach_note)
 select newid,athlete_id,planned_session_id,version_number+1,title,prescribed_distance,distance_unit,
    prescribed_duration_minutes,intent,details,
    '2026-10-26 audit: structured work was missing the existing details RPE 6–7.',
    authored_by,6,7,pace_low,pace_high,shape,coach_note
 from public.planned_session_versions where id=v.id;
 insert into public.planned_session_components
   (athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
    duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,
    rpe_low,rpe_high,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
    rpe_source,rpe_default_version,pace_low_seconds,pace_high_seconds,counts_toward_mark_id)
 select athlete_id,newid,position,role,shape,repeat_count,distance,distance_unit,
    duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,
    case when role='work' then 6 else rpe_low end,
    case when role='work' then 7 else rpe_high end,
    repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
    rpe_source,rpe_default_version,pace_low_seconds,pace_high_seconds,counts_toward_mark_id
 from public.planned_session_components where version_id=v.id;
end $$;
commit;