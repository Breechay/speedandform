
begin;
update public.training_blocks
  set target_event='Palm Beaches Half Marathon · Dec 13, 2026', updated_at=now()
  where id='24cef343-9272-469b-ae5d-2986d6676411'
    and race_name='Palm Beaches Half Marathon' and race_on='2026-12-13'
    and target_event is distinct from 'Palm Beaches Half Marathon · Dec 13, 2026';
insert into public.coach_private_notes(athlete_id,body,authored_by)
select 'eb1249c8-2cbe-48ce-a327-9040a3c9eab9',
'RACE REGISTRATION · Coach Brice confirmed on 2026-10-26: Kevin registered for Miami Marathon on 2027-01-31 alongside Matt; they signed up together. Registration is confirmed by coach report, not independent receipt. Keep Kevin''s training, fueling, and race readiness individualized; registration alone does not establish a suitable goal pace.',
'79d1520c-7c7c-4cd2-bd31-229a3cc56158'
where not exists (select 1 from public.coach_private_notes where athlete_id='eb1249c8-2cbe-48ce-a327-9040a3c9eab9' and body like 'RACE REGISTRATION · Coach Brice confirmed on 2026-10-26:%');
insert into public.coach_private_notes(athlete_id,body,authored_by)
select '6c79d7bf-965f-4913-ab55-20a13ee7c5ec',
'ENDURANCE CONTEXT · Coach Brice reported on 2026-10-26 that Patrick has a recent stretch of repeated 10-mile daily runs. The exact consecutive-day count and device execution files were not supplied, so do not treat the mileage as independently verified. He has also raced a full marathon (Jan 2026 timing documented in another private note). The 14-mile peak in the remaining published plan is not enough alone to label his endurance insufficient; assess accumulated base, recent tolerance, fueling, and taper with him before changes. Avoid unnecessary last-minute mileage escalation.',
'79d1520c-7c7c-4cd2-bd31-229a3cc56158'
where not exists (select 1 from public.coach_private_notes where athlete_id='6c79d7bf-965f-4913-ab55-20a13ee7c5ec' and body like 'ENDURANCE CONTEXT · Coach Brice reported on 2026-10-26:%');
do $$
declare v record; oldv public.planned_session_versions%rowtype; newid uuid; 
begin
  for v in select * from (values 
  ('2026-10-29'::date,'30 min easy',30,'Aerobic recovery after Tuesday speed.'),
  ('2026-11-05'::date,'35 min easy',35,'Aerobic recovery before Saturday goal rhythm.'),
  ('2026-11-12'::date,'30 min easy',30,'Recover so Saturday goal rhythm is the priority.'),
  ('2026-11-19'::date,'30 min easy',30,'Protect recovery ahead of the 15K aerobic run.'),
  ('2026-11-26'::date,'30 min easy',30,'Maintain rhythm without adding another hard effort.'),
  ('2026-11-10'::date,'35 min easy + 4 strides',35,'Keep Saturday 5 miles at goal rhythm as this week''s primary quality.')
  ) as t(on_date,new_title,mins,new_intent)
  loop
    select pv.* into oldv
      from public.planned_sessions s 
      join public.planned_session_versions pv on pv.planned_session_id=s.id
      where s.athlete_id='10000000-0000-4000-8000-000000000003' and s.scheduled_on=v.on_date and s.state='published'
      order by pv.version_number desc limit 1;
    if oldv.id is null then raise exception 'Hope published session missing: %',v.on_date; end if;
    if oldv.title=v.new_title then continue; end if;
    newid:=gen_random_uuid();
    insert into public.planned_session_versions
      (id,athlete_id,planned_session_id,version_number,title,prescribed_duration_minutes,
       prescribed_distance,distance_unit,intent,details,change_reason,rpe_low,rpe_high,shape,coach_note)
    values
      (newid,oldv.athlete_id,oldv.planned_session_id,oldv.version_number+1,v.new_title,v.mins,
       null,null,v.new_intent,
       case when v.on_date='2026-11-10' then '35 min easy, 8:00/mi or slower, then 4 × 15 sec relaxed strides with a 60 sec easy recovery.' 
            else v.mins || ' min easy, 8:00/mi or slower. Conversational effort.' end,
       'Coach 2026-10-26: consolidate quality and protect sub-1:30 race-specific durability.',
       2,3,case when v.on_date='2026-11-10' then 'easy + strides' else 'easy' end,
       'Private: reduce stacked quality after PT return. Preserve Tuesday quality on other weeks and Saturday goal-rhythm exposures. Coach monitors symptoms and recovery.');
    insert into public.planned_session_components
      (athlete_id,version_id,position,role,shape,duration_seconds,rpe_low,rpe_high)
    values (oldv.athlete_id,newid,1,'work','continuous',v.mins*60,2,3);
    if v.on_date='2026-11-10' then
      insert into public.planned_session_components
        (athlete_id,version_id,position,role,shape,repeat_count,duration_seconds,recovery_seconds,recovery_kind,rpe_low,rpe_high)
      values (oldv.athlete_id,newid,2,'work','repetitions',4,15,60,'easy',4,5);
    end if;
  end loop;
end $$;
do $$
declare s public.planned_sessions%rowtype; oldv public.planned_session_versions%rowtype; newid uuid;
begin
  select * into s from public.planned_sessions 
    where id='08ed245c-8209-48e0-bd46-57e622102218' and athlete_id='eb1249c8-2cbe-48ce-a327-9040a3c9eab9';
  if s.id is null then raise exception 'Kevin race card missing'; end if;
  select * into oldv from public.planned_session_versions 
    where planned_session_id=s.id order by version_number desc limit 1;
  if oldv.title like '%(coach-held)%' then
    newid:=gen_random_uuid();
    insert into public.planned_session_versions
      (id,athlete_id,planned_session_id,version_number,title,prescribed_distance,distance_unit,
       intent,details,change_reason,rpe_low,rpe_high,shape,coach_note)
    values (newid,oldv.athlete_id,s.id,oldv.version_number+1,
      'Miami Marathon · 26.2 mi',26.2,'mi',
      'Complete the registered Miami Marathon with a controlled start and practiced fueling.',
      'Miami Marathon · 26.2 mi. Start conservatively. Follow the fueling and hydration plan practiced in long runs. Race pace is set by the coach from training evidence.',
      '2026-10-26 coach confirmed Kevin registered with Matt; remove registration hold, no invented pace.',
      6,8,'continuous',
      'Registration confirmed by Brice. Review completion evidence, medical issues, race readiness and fueling before the start. Do not infer Matt''s pace applies to Kevin.');
    insert into public.planned_session_components
      (athlete_id,version_id,position,role,shape,distance,distance_unit,rpe_low,rpe_high)
    values (oldv.athlete_id,newid,1,'work','continuous',26.2,'mi',6,8);
  end if;
  update public.planned_sessions set state='published',updated_at=now()
    where id=s.id and state='draft';
end $$;
commit;