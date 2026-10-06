-- Race Pace Durability · October 6 cost-lane revision
-- Public method: W7 Thursday becomes controlled threshold-duration work.
-- Existing Hope/Jose assignments stay pinned to their historical plan version;
-- their Oct 8 sessions receive explicit coach revisions separately.

do $$
declare
  p_id uuid; old_v uuid; new_v uuid; old_pub public.plan_publications%rowtype;
  ow record; os record; nw uuid; ns uuid; next_version integer;
begin
  select id into p_id from public.training_plans where slug='race-pace-durability';
  select id into new_v from public.training_plan_versions
   where plan_id=p_id and summary='Oct 6 cost-lane revision: W7 Thursday 3x12 controlled threshold instead of VO2 5x3.' limit 1;
  if new_v is not null then return; end if;

  select * into old_pub from public.plan_publications
   where plan_id=p_id and published_at is not null and revoked_at is null
   order by published_at desc limit 1;
  old_v := old_pub.plan_version_id;
  select coalesce(max(version_number),0)+1 into next_version from public.training_plan_versions where plan_id=p_id;

  insert into public.training_plan_versions(plan_id,version_number,summary)
  values(p_id,next_version,'Oct 6 cost-lane revision: W7 Thursday 3x12 controlled threshold instead of VO2 5x3.')
  returning id into new_v;

  for ow in select * from public.training_plan_weeks where version_id=old_v order by week_number loop
    insert into public.training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
    values(p_id,new_v,ow.week_number,ow.phase,ow.total_distance,ow.intent) returning id into nw;
    for os in select * from public.training_plan_sessions where plan_week_id=ow.id order by position loop
      insert into public.training_plan_sessions
        (plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,prescribed_distance,distance_unit,asks_rung_value,label)
      values
        (p_id,new_v,nw,os.day_of_week,os.role,os.position,os.title,os.intent,os.details,os.prescribed_distance,os.distance_unit,os.asks_rung_value,os.label)
      returning id into ns;
      insert into public.training_plan_components
        (plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark)
      select ns,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
      from public.training_plan_components where plan_session_id=os.id order by position;
    end loop;
  end loop;

  update public.training_plan_sessions s
     set title='Threshold 3 × 12 min', label='Threshold',
         intent='Make race pace cost less: controlled threshold duration, not a race. Hold current threshold only while it stays organized.',
         details='3 × 12 min at current threshold effort with 2:00 very easy jog. Keep it controlled. If Tuesday is still present in the legs, replace with easy running plus strides.'
    from public.training_plan_weeks w
   where s.plan_week_id=w.id and w.version_id=new_v and w.week_number=7 and s.day_of_week='THU';

  delete from public.training_plan_components c using public.training_plan_sessions s, public.training_plan_weeks w
   where c.plan_session_id=s.id and s.plan_week_id=w.id and w.version_id=new_v and w.week_number=7 and s.day_of_week='THU' and c.role='work';

  insert into public.training_plan_components
    (plan_session_id,position,role,shape,duration_seconds,repeat_count,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark)
  select s.id,2,'work','repetitions',720,3,6,7,'easy',120,false
  from public.training_plan_sessions s join public.training_plan_weeks w on w.id=s.plan_week_id
  where w.version_id=new_v and w.week_number=7 and s.day_of_week='THU';

  insert into public.plan_publications(plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by)
  values(p_id,new_v,old_pub.slug,old_pub.starts_on,old_pub.race_on,old_pub.race_name,now(),old_pub.published_by);
  update public.plan_publications set revoked_at=now() where id=old_pub.id;
end $$;
