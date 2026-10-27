
begin;
do $$
declare v public.planned_session_versions%rowtype; newid uuid;
begin
 select * into v from public.planned_session_versions
 where planned_session_id='a6eaca94-0deb-401b-96dd-448685fcc34a' order by version_number desc limit 1;
 if v.id is null then raise exception 'Hope race card missing'; end if;
 if v.prescribed_distance<>13.1 then
 newid:=gen_random_uuid();
 insert into public.planned_session_versions
   (id,athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
    prescribed_duration_minutes,intent,details,change_reason,authored_by,
    rpe_low,rpe_high,pace_low,pace_high,shape,coach_note)
 select newid,athlete_id,planned_session_id,version_number+1,title,13.1,'mi',
        prescribed_duration_minutes,intent,details,
        '2026-10-26: race-card distance excludes separately prescribed warm-up; audit correction.',
        authored_by,rpe_low,rpe_high,pace_low,pace_high,shape,coach_note
 from public.planned_session_versions where id=v.id;
 insert into public.planned_session_components
   (athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
    duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,
    rpe_low,rpe_high,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
    rpe_source,rpe_default_version,pace_low_seconds,pace_high_seconds,counts_toward_mark_id)
 select athlete_id,newid,position,role,shape,repeat_count,distance,distance_unit,
        duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,
        rpe_low,rpe_high,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
        rpe_source,rpe_default_version,pace_low_seconds,pace_high_seconds,counts_toward_mark_id
 from public.planned_session_components where version_id=v.id;
 end if;
end $$;
commit;