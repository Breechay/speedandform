
begin;
do $$
declare x record; v public.planned_session_versions%rowtype; nid uuid;
begin
 for x in select * from (values
  ('2026-11-05'::date,'Speed · 8 × 200m','20 min easy. 8 × 200m in 42–44 sec, 90 sec standing rest. 15 min easy. Relaxed and even.',338,354,'5:38','5:54'),
  ('2026-11-12'::date,'Speed · 8 × 1 min','20 min easy. 8 × 1 min at 3:33–3:40/km, 90 sec standing rest. 15 min easy. Even reps.',343,354,'5:43','5:54')
 ) t(on_date,new_title,new_details,lo_secs,hi_secs,lo_txt,hi_txt)
 loop
 select pv.* into v from public.planned_sessions s
 join public.planned_session_versions pv on pv.planned_session_id=s.id
 where s.athlete_id='e8328097-a879-448b-baae-3461f176d166'
 and s.state='published' and s.scheduled_on=x.on_date order by pv.version_number desc limit 1;
 if v.id is null then raise exception 'Simon session missing: %',x.on_date; end if;
 if v.details=x.new_details then continue; end if;
 nid:=gen_random_uuid();
 insert into public.planned_session_versions
  (id,athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
   prescribed_duration_minutes,intent,details,change_reason,authored_by,
   rpe_low,rpe_high,pace_low,pace_high,shape,coach_note)
 select nid,athlete_id,planned_session_id,version_number+1,x.new_title,prescribed_distance,distance_unit,
   prescribed_duration_minutes,intent,x.new_details,
   '2026-10-26: authored exact split/pace for near-term Thursday.',
   authored_by,rpe_low,rpe_high,pace_low,pace_high,shape,
   'Individualized speed reserve. Coach reviews cost against Tuesday and HYROX; communal class workout is separate.'
 from public.planned_session_versions where id=v.id;
 insert into public.planned_session_components
  (athlete_id,version_id,position,role,shape,repeat_count,distance,distance_unit,
   duration_seconds,recovery_seconds,recovery_kind,pace_low,pace_high,
   rpe_low,rpe_high,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
   rpe_source,rpe_default_version,pace_low_seconds,pace_high_seconds,counts_toward_mark_id)
 select athlete_id,nid,position,role,shape,repeat_count,distance,distance_unit,
   duration_seconds,recovery_seconds,recovery_kind,
   case when role='work' then x.lo_txt else pace_low end,
   case when role='work' then x.hi_txt else pace_high end,
   rpe_low,rpe_high,repeat_minimum,repeat_target,repeat_progression,repeat_ceiling,
   rpe_source,rpe_default_version,
   case when role='work' then x.lo_secs else pace_low_seconds end,
   case when role='work' then x.hi_secs else pace_high_seconds end,
   counts_toward_mark_id
 from public.planned_session_components where version_id=v.id;
 end loop;
end $$;
commit;