
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
  v_coach uuid := auth.uid();
  v_athlete uuid;
  v_plan uuid;
  v_version uuid;
  v_block uuid;
  v_week uuid;
  v_plan_week uuid;
  v_plan_session uuid;
  v_occurrence uuid;
  v_parts jsonb;
  v_week_start date;
  v_duration_min integer;
  w record;
  s record;
begin
  if v_coach is null then
    raise exception 'Brice auth identity not found';
  end if;

  select a.id into v_athlete
    from public.athletes a
   where a.slug='brice' and a.active=true;

  if v_athlete is null then
    raise exception 'Brice athlete identity missing';
  end if;

  if exists (
    select 1
      from public.training_blocks b
     where b.athlete_id=v_athlete and b.status='active'
  ) then
    raise exception 'Brice already has an active training block; refusing to stack a second one';
  end if;

  if exists (
    select 1 from public.training_plans p
     where p.slug='brice-rebuilt-athlete-phase-00'
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
   where id=v_athlete;

  -- Identity ownership is already established and must not be rewritten here.
  -- Brice's Sign in with Apple user owns the athlete role; briceikouebe@gmail.com
  -- remains the coach identity. Native filing therefore uses the same athlete-only
  -- door as every other athlete while Coach Board / Mirror can read the record.
  if (select count(*) from public.athlete_memberships m
       where m.athlete_id=v_athlete and m.role='athlete' and m.status='active') <> 1 then
    raise exception 'Brice must have exactly one active athlete owner before Phase 00 is assigned';
  end if;

  if not exists (
    select 1 from public.athlete_memberships m
     where m.athlete_id=v_athlete and m.user_id=v_coach
       and m.role='coach' and m.status='active'
  ) then
    raise exception 'Brice coach membership missing; refusing to provision a plan the coach cannot mirror';
  end if;

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
    v_coach
  ) returning id into v_plan;

  insert into public.training_plan_versions(
    plan_id,version_number,summary,cut_by
  ) values (
    v_plan,
    1,
    '21 Sep–11 Oct 2026. Tuesday + Saturday easy-run anchors, Thursday optional. Outdoors or treadmill. Time progresses; pace does not.',
    v_coach
  ) returning id into v_version;

  for w in
    select * from (values
      (1, date '2026-09-21', date '2026-09-27', 'Establish the repeatable weekly rhythm.', 35, 25, 30, 45),
      (2, date '2026-09-28', date '2026-10-04', 'Add time, not intensity.', 40, 30, 30, 55),
      (3, date '2026-10-05', date '2026-10-11', 'Confirm that the rhythm remains absorbable.', 45, 35, 35, 65)
    ) as x(week_number,starts_on,ends_on,intent,tue_min,thu_min,thu_max,sat_min)
  loop
    insert into public.training_plan_weeks(
      plan_id,version_id,week_number,phase,total_distance,intent
    ) values (
      v_plan,v_version,w.week_number,'build',null,w.intent
    ) returning id into v_plan_week;

    insert into public.training_plan_sessions(
      plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
      prescribed_distance,distance_unit,label
    ) values (
      v_plan,v_version,v_plan_week,'TUE','easy',1,
      'Easy run · '||w.tue_min||' min',
      'Repeatable time on feet. Time before pace.',
      'Outdoors or treadmill. Conversational RPE 2–3. No pace target. Use the standard run prep. No doubles and no makeup minutes.',
      null,'mi','Easy'
    ) returning id into v_plan_session;

    insert into public.training_plan_components(
      plan_session_id,position,role,shape,duration_seconds,rpe_low,rpe_high,counts_toward_mark
    ) values (
      v_plan_session,1,'work','continuous',w.tue_min*60,2,3,false
    );

    insert into public.training_plan_sessions(
      plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
      prescribed_distance,distance_unit,label
    ) values (
      v_plan,v_version,v_plan_week,'THU','easy',2,
      case when w.thu_min=w.thu_max
           then 'Optional easy run · '||w.thu_min||' min'
           else 'Optional easy run · '||w.thu_min||'–'||w.thu_max||' min' end,
      'A third easy exposure only when the leg is absorbing the week normally.',
      'Outdoors or treadmill. Conversational RPE 2–3. Rest is a complete execution. If skipped, do not replace with extra cardio and do not make it up later.',
      null,'mi','Optional'
    ) returning id into v_plan_session;

    insert into public.training_plan_components(
      plan_session_id,position,role,shape,duration_seconds,rpe_low,rpe_high,counts_toward_mark
    ) values (
      v_plan_session,1,'work','continuous',w.thu_max*60,2,3,false
    );

    insert into public.training_plan_sessions(
      plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,
      prescribed_distance,distance_unit,label
    ) values (
      v_plan,v_version,v_plan_week,'SAT','easy',3,
      'Longer easy run · '||w.sat_min||' min',
      'Extend easy time on feet without adding intensity.',
      'Outdoors or treadmill. Conversational RPE 2–3. No pace target. Use the standard run prep and post-run foot/calf reset. No doubles and no makeup minutes.',
      null,'mi','Long easy'
    ) returning id into v_plan_session;

    insert into public.training_plan_components(
      plan_session_id,position,role,shape,duration_seconds,rpe_low,rpe_high,counts_toward_mark
    ) values (
      v_plan_session,1,'work','continuous',w.sat_min*60,2,3,false
    );
  end loop;

  insert into public.training_blocks(
    athlete_id,source,name,block_number,target_event,goal_label,current_week,total_weeks,
    starts_on,ends_on,status,authored_by,race_on,goal_statement,week_starts_on,purpose,
    race_name,race_place,plan_id,plan_version_id
  ) values (
    v_athlete,'coach_authored','The Rebuilt Athlete · Phase 00',1,null,null,1,3,
    date '2026-09-21',date '2026-10-11','active',v_coach,null,
    'Rebuild repeatable easy running, aerobic capacity and lower-leg confidence without choosing a race.',
    1,'development',null,null,v_plan,v_version
  ) returning id into v_block;

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
      v_athlete,v_block,w.week_number,w.starts_on,w.ends_on,w.intent,
      'Phase 00 is successful when easy running becomes ordinary again without destabilizing the lower leg or Forge.',
      'planned',v_coach
    );
  end loop;

  insert into public.plan_assignments(
    plan_id,plan_version_id,athlete_id,block_id,starts_at_plan_week,starts_on,notes,assigned_by
  ) values (
    v_plan,v_version,v_athlete,v_block,1,date '2026-09-21',
    'Brice self-executes this three-week development block. FORM owns running prescription and filing only; Forge owns strength; Study 002 integrates evidence.',
    v_coach
  );

  for s in
    select ps.*, pw.week_number
      from public.training_plan_sessions ps
      join public.training_plan_weeks pw on pw.id=ps.plan_week_id
     where ps.plan_id=v_plan and ps.version_id=v_version
     order by pw.week_number,ps.position
  loop
    select tw.id,tw.starts_on
      into v_week,v_week_start
      from public.training_weeks tw
     where tw.athlete_id=v_athlete
       and tw.block_id=v_block
       and tw.week_number=s.week_number;

    select coalesce(
      jsonb_agg(
        jsonb_strip_nulls(
          jsonb_build_object(
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
          )
        ) order by c.position
      ),
      '[]'::jsonb
    )
      into v_parts
      from public.training_plan_components c
     where c.plan_session_id=s.id;

    select (c.duration_seconds/60)::int
      into v_duration_min
      from public.training_plan_components c
     where c.plan_session_id=s.id
       and c.position=1;

    v_occurrence := public.author_session(
      v_athlete,
      v_week,
      s.day_of_week,
      s.title,
      s.intent,
      v_week_start + case s.day_of_week when 'TUE' then 1 when 'THU' then 3 when 'SAT' then 5 end,
      s.position::smallint,
      null::numeric,
      'mi'::text,
      v_duration_min::integer,
      2::smallint,
      3::smallint,
      v_parts,
      s.details
    );

    update public.planned_sessions
       set plan_session_id=s.id,
           role='easy',
           is_key=false
     where id=v_occurrence;
  end loop;

  if (select count(*) from public.training_weeks tw where tw.block_id=v_block) <> 3 then
    raise exception 'expected 3 Brice weeks';
  end if;

  if (
    select count(*)
      from public.planned_sessions ps
     where ps.athlete_id=v_athlete
       and ps.week_id in (select tw.id from public.training_weeks tw where tw.block_id=v_block)
  ) <> 9 then
    raise exception 'expected 9 Brice running sessions';
  end if;

  if not exists (
    select 1
      from public.planned_sessions ps
      join public.training_weeks tw on tw.id=ps.week_id
      join lateral (
        select pv.*
          from public.planned_session_versions pv
         where pv.planned_session_id=ps.id
         order by pv.version_number desc
         limit 1
      ) lv on true
     where ps.athlete_id=v_athlete
       and tw.week_number=1
       and ps.day_label='TUE'
       and lv.prescribed_duration_minutes=35
       and lv.rpe_low=2
       and lv.rpe_high=3
  ) then
    raise exception 'Brice W1 Tuesday session anatomy missing';
  end if;
end $$;
