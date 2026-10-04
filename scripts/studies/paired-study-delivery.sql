-- Run only after owner approval, with coach membership resolved. This is a
-- one-time delivery repair, not a new training decision. No historical writes.
begin;
select set_config('request.jwt.claim.sub',(select b.authored_by::text from public.training_blocks b join public.athletes a on a.id=b.athlete_id where a.slug='elijah' and b.status='active'),true);
do $$
declare pa public.plan_assignments%rowtype; v public.training_plan_versions%rowtype; w record; s record; nv uuid; nw uuid; ns uuid;
begin
 select x.* into pa from public.plan_assignments x join public.athletes a on a.id=x.athlete_id where a.slug='elijah' order by x.assigned_at desc limit 1;
 select * into v from public.training_plan_versions where id=pa.plan_version_id;
 if v.version_number=4 then
 insert into public.training_plan_versions(plan_id,version_number,summary,cut_by)
 values(pa.plan_id,5,'ELIJAH-NOV14-R5 | Delivery/accounting correction only. Retains R4 training. W4 sums to 37 miles, not 38; no miles added. Race-week Wednesday includes its rhythm repetitions inside the 3-mile total. No automatic mark credit without an existing athlete mark. Savannah Nov 14.',auth.uid()) returning id into nv;
 for w in select * from public.training_plan_weeks where version_id=v.id order by week_number loop
 insert into public.training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent) values(pa.plan_id,nv,w.week_number,w.phase,case when w.week_number=4 then 37 else w.total_distance end,w.intent) returning id into nw;
 for s in select * from public.training_plan_sessions where plan_week_id=w.id order by position loop
 insert into public.training_plan_sessions(plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,prescribed_distance,distance_unit,asks_rung_value,label)
 values(pa.plan_id,nv,nw,s.day_of_week,s.role,s.position,s.title,s.intent,s.details,s.prescribed_distance,s.distance_unit,s.asks_rung_value,s.label) returning id into ns;
 insert into public.training_plan_components(plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark)
 select ns,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,false from public.training_plan_components where plan_session_id=s.id;
 if w.week_number=7 and s.day_of_week='WED' then
 update public.training_plan_components set role='warm_up',distance=1,pace_low_seconds=null,pace_high_seconds=null where plan_session_id=ns and position=1;
 insert into public.training_plan_components(plan_session_id,position,role,shape,distance,distance_unit,pace_low_seconds,counts_toward_mark) values(ns,3,'cool_down','continuous',1,'mi',null,false);
 update public.training_plan_sessions set details='3 mi total including the pace touches and recoveries. Run about 1 mi easy, then 3 × 1 min @ 6:04–6:08/mi with 2 min very easy between. Cool down easily to 3 mi total. Skip the touches if anything feels off.' where id=ns;
 end if;
 end loop;
 end loop;
 update public.plan_assignments set plan_version_id=nv,notes=coalesce(notes,'')||' R5 delivery/accounting correction: same work, actual W4 total 37 mi; dated app delivery and public study synchronized.' where id=pa.id;
 update public.training_plans set peak_volume=37,updated_at=now() where id=pa.plan_id;
 elsif v.version_number<>5 then raise exception 'Unexpected Elijah version %',v.version_number;
 end if;
end $$;
select public.publish_connected_study_plan('elijah',5,date '2026-10-05',date '2026-11-14','Savannah Half Marathon','Savannah','Deliver approved R4 work with R5 accounting correction to dated app sessions and matched public study. Preserve all history before Oct 5.');
-- Reviewed R2 import markers are not individual athlete overrides; prior versions retain the reason.
update public.planned_sessions ps set override_reason=null from public.athletes a where a.id=ps.athlete_id and a.slug='simon' and ps.scheduled_on>=date '2026-10-05' and ps.override_reason='SIMON-003-R2-20260923';
select public.publish_connected_study_plan('simon',4,date '2026-10-05',date '2027-05-16','Semi-Marathon de la Loire','Saumur, France','Deliver approved R4 audit revision to dated app sessions and matched public study. Preserve all history before Oct 5.');
-- Descriptive pace keys are a projection of the sessions, not another target.
update public.block_pace_bands bb set label='WORKING DEVELOPMENT',value='3:49–3:52 /km',low_seconds=368,high_seconds=373,when_line='Opening build weeks. Absorption week: 3:50–3:53/km. Follow each dated session.',updated_at=now() from public.athletes a where a.id=bb.athlete_id and a.slug='simon' and bb.position=2;
update public.block_pace_bands bb set label='CEILING MAINTENANCE',value='3:33–3:38 /km',low_seconds=343,high_seconds=351,when_line='Conditional support. Reduce or replace when Tuesday or hard HYROX work uses the recovery budget.',updated_at=now() from public.athletes a where a.id=bb.athlete_id and a.slug='simon' and bb.position=3;
update public.block_pace_bands bb set label='SPECIFIC WORK',value='See the dated session',low_seconds=null,high_seconds=null,when_line='Week 2: 6:08–6:12/mi. Later work approaches 6:04–6:08 only if earned. Race pace remains conditional.',updated_at=now() from public.athletes a where a.id=bb.athlete_id and a.slug='elijah' and bb.position=2;
update public.block_pace_bands bb set label='SHORT SHARPENING',value='Mostly easy + strides',low_seconds=null,high_seconds=null,when_line='Only the small Week 4 sharpening dose is scheduled. No automatic weekly ceiling workout.',updated_at=now() from public.athletes a where a.id=bb.athlete_id and a.slug='elijah' and bb.position=3;
update public.training_blocks b set goal_statement='Prepare a conditional sub-1:20 attempt at Savannah on November 14. The October 27 continuous session and recovery inform the opening pace. Thursday supports the specific work.' from public.athletes a where a.id=b.athlete_id and a.slug='elijah' and b.status='active';
select jsonb_build_object('public_states',jsonb_build_object('simon',public.study_003_plan()->>'state','elijah',public.paired_study_plans()->'athletes'->'elijah'->>'state'),'history_hash',(select md5(string_agg(v.id::text||to_jsonb(v)::text,',' order by v.id)) from public.planned_session_versions v join public.planned_sessions s on s.id=v.planned_session_id join public.athletes a on a.id=s.athlete_id where a.slug in ('elijah','simon') and s.scheduled_on<date '2026-10-05'));
-- First run ends in ROLLBACK; switch to COMMIT only after parity is verified.
rollback;
