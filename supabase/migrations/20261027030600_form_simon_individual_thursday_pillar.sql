
begin;
do $$
declare x record;oldv public.planned_session_versions%rowtype;newid uuid;v_title text;v_details text;v_minutes int;
begin
for x in select * from (values
('2026-11-19'::date,6,120,120,'3:35','3:42',346,357),
('2026-11-26'::date,6,60,90,'3:33','3:40',343,354),
('2026-12-03'::date,5,120,120,'3:35','3:42',346,357),
('2026-12-10'::date,4,180,150,'3:36','3:43',348,359),
('2026-12-17'::date,0,35,0,null,null,null,null),
('2026-12-24'::date,6,60,90,'3:33','3:40',343,354),
('2026-12-31'::date,0,35,0,null,null,null,null),
('2027-01-07'::date,5,120,120,'3:35','3:42',346,357),
('2027-01-14'::date,4,180,150,'3:36','3:43',348,359),
('2027-01-21'::date,6,90,90,'3:33','3:40',343,354),
('2027-01-28'::date,0,35,0,null,null,null,null),
('2027-02-04'::date,4,180,150,'3:36','3:43',348,359),
('2027-02-11'::date,5,120,120,'3:35','3:42',346,357),
('2027-02-18'::date,4,180,150,'3:36','3:43',348,359),
('2027-02-25'::date,6,90,90,'3:33','3:40',343,354),
('2027-03-04'::date,4,180,150,'3:36','3:43',348,359),
('2027-03-11'::date,5,120,120,'3:35','3:42',346,357),
('2027-03-18'::date,4,180,150,'3:36','3:43',348,359),
('2027-03-25'::date,6,90,90,'3:33','3:40',343,354),
('2027-04-01'::date,4,180,150,'3:36','3:43',348,359),
('2027-04-08'::date,5,120,120,'3:35','3:42',346,357),
('2027-04-15'::date,4,180,150,'3:36','3:43',348,359),
('2027-04-22'::date,5,90,90,'3:33','3:40',343,354),
('2027-04-29'::date,6,60,90,'3:33','3:40',343,354),
('2027-05-06'::date,4,60,90,'3:33','3:40',343,354),
('2027-05-13'::date,0,20,0,null,null,null,null)
) as t(on_date,reps,work_seconds,rest_seconds,low_km,high_km,low_mile_secs,high_mile_secs)
loop
 select pv.* into oldv from public.planned_sessions s
 join public.planned_session_versions pv on pv.planned_session_id=s.id
 where s.athlete_id='e8328097-a879-448b-baae-3461f176d166' and s.state='published'
   and s.scheduled_on=x.on_date
 order by pv.version_number desc limit 1;
 if oldv.id is null then raise exception 'Simon Thursday missing: %',x.on_date; end if;
 if oldv.title not like 'FORM Track · Speed Work' then continue; end if;
 if x.reps=0 then
   v_title:='FORM Thursday · '||x.work_seconds||' min easy + strides';
   v_details:=x.work_seconds||' min easy. Then 4 × 15 sec relaxed strides, 60 sec easy between.';
   v_minutes:=x.work_seconds+5;
 else
   v_title:='FORM Thursday · '||x.reps||' × '||
      case when x.work_seconds=60 then '1 min' when x.work_seconds=90 then '90 sec'
           when x.work_seconds=120 then '2 min' else '3 min' end;
   v_details:='20 min easy. '||x.reps||' × '||
     case when x.work_seconds=60 then '1 min' when x.work_seconds=90 then '90 sec'
          when x.work_seconds=120 then '2 min' else '3 min' end||
     ' at '||x.low_km||'–'||x.high_km||'/km, '||x.rest_seconds||
     ' sec easy between. 10 min easy. Keep reps even.';
   v_minutes:=30+ceil(x.reps*x.work_seconds/60.0)::int+
        ceil((x.reps-1)*x.rest_seconds/60.0)::int;
 end if;
 newid:=gen_random_uuid();
 insert into public.planned_session_versions
  (id,athlete_id,planned_session_id,version_number,title,prescribed_duration_minutes,
   intent,details,change_reason,rpe_low,rpe_high,shape,coach_note)
 values(newid,oldv.athlete_id,oldv.planned_session_id,oldv.version_number+1,
        v_title,v_minutes,
        case when x.reps=0 then 'Easy speed mechanics with low fatigue.'
             else 'Maintain speed reserve without competing with Tuesday half-marathon work.' end,
        v_details,'2026-10-26: replace empty FORM Thursday placeholder with athlete-specific authored session.',
        case when x.reps=0 then 2 else 6 end,
        case when x.reps=0 then 5 else 7 end,
        case when x.reps=0 then 'easy + strides' else 'repetitions' end,
        'Coach-owned rolling prescription. This is Simon''s own Thursday target, not a claim about the communal track workout. Review every two weeks against completed Tuesday work, HYROX, travel, fatigue and upcoming race; revise immutable version before athlete execution.');
 if x.reps=0 then
   insert into public.planned_session_components
    (athlete_id,version_id,position,role,shape,duration_seconds,rpe_low,rpe_high)
   values(oldv.athlete_id,newid,1,'work','continuous',x.work_seconds*60,2,3);
   insert into public.planned_session_components
    (athlete_id,version_id,position,role,shape,repeat_count,duration_seconds,recovery_seconds,recovery_kind,rpe_low,rpe_high)
   values(oldv.athlete_id,newid,2,'work','repetitions',4,15,60,'easy',4,5);
 else
   insert into public.planned_session_components
    (athlete_id,version_id,position,role,shape,duration_seconds)
   values(oldv.athlete_id,newid,1,'warm_up','continuous',1200);
   insert into public.planned_session_components
    (athlete_id,version_id,position,role,shape,repeat_count,duration_seconds,
     recovery_seconds,recovery_kind,pace_low,pace_high,pace_low_seconds,pace_high_seconds,
     rpe_low,rpe_high)
   values(oldv.athlete_id,newid,2,'work','repetitions',x.reps,x.work_seconds,
     x.rest_seconds,'easy',
     to_char(x.low_mile_secs / 60,'FM00')||':'||to_char(x.low_mile_secs % 60,'FM00'),
     to_char(x.high_mile_secs / 60,'FM00')||':'||to_char(x.high_mile_secs % 60,'FM00'),
     x.low_mile_secs,x.high_mile_secs,6,7);
   insert into public.planned_session_components
    (athlete_id,version_id,position,role,shape,duration_seconds)
   values(oldv.athlete_id,newid,3,'cool_down','continuous',600);
 end if;
end loop;
end $$;
commit;