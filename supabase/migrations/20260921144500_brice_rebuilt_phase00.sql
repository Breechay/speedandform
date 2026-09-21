
set local search_path=public,pg_temp;

select set_config(
  'request.jwt.claims',
  (select jsonb_build_object('sub', id)::text
     from auth.users
    where lower(email)=lower('briceikouebe@gmail.com')
    limit 1),
  true
);

do $$
declare
  coach_id uuid := auth.uid();
  athlete_id uuid;
  plan_id uuid;
  version_id uuid;
  block_id uuid;
  week_id uuid;
  plan_week_id uuid;
  plan_session_id uuid;
  occurrence_id uuid;
  parts jsonb;
  w record;
  s record;
  week_start date;
  duration_min integer;
begin
  if coach_id is null then
    raise exception 'Brice auth identity not found';
  end if;

  select id into athlete_id from public.athletes where slug='brice' and active=true;
  if athlete_id is null then
    raise exception 'Brice athlete identity missing';
  end if;

  if exists (
    select 1 from public.training_blocks
     where athlete_id=athlete_id and status='active'
  ) then
    raise exception 'Brice already has an active training block; refusing to stack a second one';
  end if;

  if exists (
    select 1 from public.training_plans where slug='brice-rebuilt-athlete-phase-00'
  ) then
    raise exception 'Phase 00 plan already exists; refusing duplicate migration';
  end if;

  update public.athletes
     set target_event=null,
         goal_label=null,
         program_name='The Rebuilt Athlete · Phase 00',
         account_label='Brice · Athlete',
         home_surface='form',
         delivery='app',
         updated_at=now()
   where id=athlete_id;

  insert into public.athlete_memberships(athlete_id,user_id,role,status)
  values (athlete_id,coach_id,'athlete','active')
  on conflict (athlete_id,user_id,role)
  do update set status='active';

  insert into public.training_plans(
    slug,name,discipline,total_weeks,status,question,for_whom,authored_by
  ) values (
    'brice-rebuilt-athlete-phase-00',
    'The Rebuilt Athlete · Phase 00',
    'running',
    3,
    'published',
    'Can easy running become repeatable again while lower-leg recovery and Forge strength remain stable?',
    'Brice · post-fracture Phase 00 reconstitution',
    coach_id
  ) returning id into plan_id;

  insert into public.training_plan_versions(plan_id,version_number,summary,cut_by)
  values (
    plan_id,1,
    '21 Sep–11 Oct 2026. Tuesday + Saturday easy-run anchors, Thursday optional. Outdoors or treadmill. Time progresses; pace does not.',
    coach_id
  ) returning id into version_id;

  for w in
    select * from (values
      (1, date '2026-09-21', date '2026-09-27', 'Establish the repeatable weekly rhythm.', 35, 25, 30, 45),
      (2, date '2026-09-28', date '2026-10-04', 'Add time, not intensity.', 40, 30, 30, 55),
      (3, date '2026-10-05', date '2026-10-11', 'Confirm that the rhythm remains absorbable.', 45, 35, 35, 65)
    ) as x(week_number,starts_on,ends_on,intent,tue_min,thu_min,thu_max,sat_min)
  loop
    insert into public.training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
    values(plan_id,version_id,w.week_number,'reconstitution',null,w.intent)
    returning id into plan_week_id;

    -- Tuesday anchor
    insert into public.training_plan_sessions(
      plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
      prescribed_distance,distance_unit,label
    ) values (
      plan_id,version_id,plan_week_id,'TUE','easy',1,
      'Easy run · '||w.tue_min||' min',
      'Repeatable time on feet. Time before pace.',
      'Outdoors or treadmill. Conversational RPE 2–3. No pace target. Use the standard run prep. No doubles and no makeup minutes.',
      null,'mi','Easy'
    ) returning id into plan_session_id;

    insert into public.training_plan_components(
      plan_session_id,position,role,shape,duration_seconds,rpe_low,rpe_high,counts_toward_mark
    ) values (
      plan_session_id,1,'work','continuous',w.tue_min*60,2,3,false
    );

    -- Thursday optional
    insert into public.training_plan_sessions(
      plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
      prescribed_distance,distance_unit,label
    ) values (
      plan_id,version_id,plan_week_id,'THU','easy',2,
      case when w.thu_min=w.thu_max
           then 'Optional easy run · '||w.thu_min||' min'
           else 'Optional easy run · '||w.thu_min||'–'||w.thu_max||' min' end,
      'A third easy exposure only when the leg is absorbing the week normally.',
      'Outdoors or treadmill. Conversational RPE 2–3. Rest is a complete execution. If skipped, do not replace with extra cardio and do not make it up later.',
      null,'mi','Optional'
    ) returning id into plan_session_id;

    insert into public.training_plan_components(
      plan_session_id,position,role,shape,duration_seconds,rpe_low,rpe_high,counts_toward_mark
    ) values (
      plan_session_id,1,'work','continuous',w.thu_max*60,2,3,false
    );

    -- Saturday longer anchor
    insert into public.training_plan_sessions(
      plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
      prescribed_distance,distance_unit,label
    ) values (
      plan_id,version_id,plan_week_id,'SAT','easy',3,
      'Longer easy run · '||w.sat_min||' min',
      'Extend easy time on feet without adding intensity.',
      'Outdoors or treadmill. Conversational RPE 2–3. No pace target. Use the standard run prep and post-run foot/calf reset. No doubles and no makeup minutes.',
      null,'mi','Long easy'
    ) returning id into plan_session_id;

    insert into public.training_plan_components(
      plan_session_id,position,role,shape,duration_seconds,rpe_low,rpe_high,counts_toward_mark
    ) values (
      plan_session_id,1,'work','continuous',w.sat_min*60,2,3,false
    );
  end loop;

  insert into public.training_blocks(
    athlete_id,source,name,block_number,target_event,goal_label,current_week,total_weeks,
    starts_on,ends_on,status,authored_by,race_on,goal_statement,week_starts_on,purpose,
    race_name,race_place,plan_id,plan_version_id
  ) values (
    athlete_id,'coach_authored','The Rebuilt Athlete · Phase 00',1,null,null,1,3,
    date '2026-09-21',date '2026-10-11','active',coach_id,null,
    'Rebuild repeatable easy running, aerobic capacity and lower-leg confidence without choosing a race.',
    1,'development',null,null,plan_id,version_id
  ) returning id into block_id;

  for w in
    select * from (values
      (1, date '2026-09-21', date '2026-09-27', 'Establish the repeatable weekly rhythm.'),
      (2, date '2026-09-28', date '2026-10-04', 'Add time, not intensity.'),
      (3, date '2026-10-05', date '2026-10-11', 'Confirm that the rhythm remains absorbable.')
    ) as x(week_number,starts_on,ends_on,intent)
  loop
    insert into public.training_weeks(
      athlete_id,block_id,week_number,starts_on,ends_on,intent,matters_because,state,authored_by
    ) values (
      athlete_id,block_id,w.week_number,w.starts_on,w.ends_on,w.intent,
      'Phase 00 is successful when easy running becomes ordinary again without destabilizing the lower leg or Forge.',
      'planned',coach_id
    );
  end loop;

  insert into public.plan_assignments(
    plan_id,plan_version_id,athlete_id,block_id,starts_at_plan_week,starts_on,notes,assigned_by
  ) values (
    plan_id,version_id,athlete_id,block_id,1,date '2026-09-21',
    'Brice self-executes this three-week development block. FORM owns running prescription and filing only; Forge owns strength; Study 002 integrates evidence.',
    coach_id
  );

  for s in
    select ps.*, pw.week_number
      from public.training_plan_sessions ps
      join public.training_plan_weeks pw on pw.id=ps.plan_week_id
     where ps.plan_id=plan_id and ps.version_id=version_id
     order by pw.week_number,ps.position
  loop
    select id,starts_on into week_id,week_start
      from public.training_weeks
     where athlete_id=athlete_id and block_id=block_id and week_number=s.week_number;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'role',c.role,
      'shape',c.shape,
      'position',c.position,
      'distance',c.distance,
      'distanceUnit',c.distance_unit,
      'durationSeconds',c.duration_seconds,
      'repeatCount',c.repeat_count,
      'rpeLow',c.rpe_low,
      'rpeHigh',c.rpe_high,
      'recoveryKind',c.recovery_kind,
      'recoverySeconds',c.recovery_seconds
    )) order by c.position),'[]'::jsonb)
      into parts
      from public.training_plan_components c
     where c.plan_session_id=s.id;

    select (c.duration_seconds/60)::int
      into duration_min
      from public.training_plan_components c
     where c.plan_session_id=s.id and c.position=1;

    occurrence_id := public.author_session(
      athlete_id,
      week_id,
      s.day_of_week,
      s.title,
      s.intent,
      week_start + case s.day_of_week when 'TUE' then 1 when 'THU' then 3 when 'SAT' then 5 end,
      s.position,
      null,
      'mi',
      duration_min,
      2,
      3,
      parts,
      s.details
    );

    update public.planned_sessions
       set plan_session_id=s.id,
           role='easy',
           is_key=false
     where id=occurrence_id;
  end loop;

  if (select count(*) from public.training_weeks where block_id=block_id) <> 3 then
    raise exception 'expected 3 Brice weeks';
  end if;

  if (select count(*) from public.planned_sessions where athlete_id=athlete_id and week_id in (
        select id from public.training_weeks where block_id=block_id
      )) <> 9 then
    raise exception 'expected 9 Brice running sessions';
  end if;

  if not exists (
    select 1
      from public.planned_sessions ps
      join public.training_weeks tw on tw.id=ps.week_id
      join lateral (
        select v.* from public.planned_session_versions v
         where v.planned_session_id=ps.id
         order by v.version_number desc limit 1
      ) lv on true
     where ps.athlete_id=athlete_id
       and tw.week_number=1
       and ps.day_label='TUE'
       and lv.prescribed_duration_minutes=35
       and lv.rpe_low=2 and lv.rpe_high=3
  ) then
    raise exception 'Brice W1 Tuesday session anatomy missing';
  end if;
end $$;
