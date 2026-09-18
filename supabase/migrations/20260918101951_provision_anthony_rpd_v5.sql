
set local search_path=public,pg_temp;
select set_config('request.jwt.claims','{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}',true);

do $$
declare
  coach_id uuid := auth.uid();
  anthony_id uuid;
  anthony_block uuid;
  anthony_mark uuid;
  v_plan uuid;
  v5 uuid;
  hope_id uuid;
  hope_block uuid;
  src record;
  source_version record;
  new_week uuid;
  new_session uuid;
  parts jsonb;
  asked_value numeric;
begin
  if exists (select 1 from public.athletes where slug='anthony') then
    raise exception 'Anthony already exists; refusing duplicate provisioning';
  end if;

  select id into hope_id from public.athletes where slug='hope';
  select id into hope_block from public.training_blocks
   where athlete_id=hope_id and status='active' and name='Race Pace Durability' limit 1;
  select p.id,v.id into v_plan,v5
    from public.training_plans p
    join public.training_plan_versions v on v.plan_id=p.id
   where p.slug='race-pace-durability' and v.version_number=5;

  if hope_id is null or hope_block is null or v_plan is null or v5 is null then
    raise exception 'RPD provisioning source missing';
  end if;

  insert into public.athletes(
    slug,display_name,first_name,home_surface,target_event,goal_label,
    program_name,account_label,active,goal_seconds,goal_pace_seconds,
    training_target_seconds,target_pace_seconds,rpe_ceiling,delivery,attention_position
  ) values (
    'anthony','Anthony','Anthony','form','Half marathon','Sub-1:30',
    'FORM','Coached Athlete',true,5400,412,5280,403,7,'app',3
  ) returning id into anthony_id;

  -- Brice is the coach-author for this canonical athlete. Athlete membership is
  -- intentionally absent until Anthony claims/links his own account.
  insert into public.athlete_memberships(athlete_id,user_id,role,status)
  values (anthony_id,coach_id,'coach','active');

  insert into public.training_blocks(
    athlete_id,source,name,block_number,target_event,goal_label,current_week,total_weeks,
    starts_on,ends_on,status,authored_by,race_on,goal_statement,week_starts_on,purpose,
    race_name,race_place,plan_id,plan_version_id
  )
  select anthony_id,b.source,b.name,b.block_number,b.target_event,b.goal_label,4,b.total_weeks,
         b.starts_on,b.ends_on,'active',coach_id,b.race_on,b.goal_statement,b.week_starts_on,b.purpose,
         b.race_name,b.race_place,v_plan,v5
    from public.training_blocks b where b.id=hope_block
  returning id into anthony_block;

  insert into public.athlete_marks(
    athlete_id,block_id,mark_type,label,current_value,target_value,unit,current_question,
    is_primary,active,authored_by,claim,claim_state,claim_note,next_test,
    evidence_surface_requirement,established_proof_state
  ) values (
    anthony_id,anthony_block,'race_pace_miles','continuous at race pace',null,13.1,'mi',
    'How far can you hold 6:45–7:00 without it coming apart?',
    true,true,coach_id,
    'Baseline reported by Brice from Strava: September 15, 2026 — 5.00 mi in 34:38, displayed pace 6:55/mi. Not a FORM filing.',
    'working',
    'This is attributed baseline context, not a FORM receipt or established ownership result.',
    'Extend the continuous hold beyond the reported five-mile baseline.',
    'any','derived'
  ) returning id into anthony_mark;

  insert into public.mark_checkpoints(athlete_id,mark_id,value,label,position,state,source,moved_by)
  values
    (anthony_id,anthony_mark,1,'1',1,'proposed','coach',coach_id),
    (anthony_id,anthony_mark,2,'2',2,'proposed','coach',coach_id),
    (anthony_id,anthony_mark,5,'5',3,'current','coach',coach_id),
    (anthony_id,anthony_mark,6,'6',4,'proposed','coach',coach_id),
    (anthony_id,anthony_mark,8,'8',5,'proposed','coach',coach_id),
    (anthony_id,anthony_mark,12,'12 mi',6,'proposed','coach',coach_id),
    (anthony_id,anthony_mark,13.1,'13.1',7,'proposed','coach',coach_id);

  insert into public.training_weeks(
    athlete_id,block_id,week_number,starts_on,ends_on,intent,matters_because,state,authored_by
  )
  select anthony_id,anthony_block,w.week_number,w.starts_on,w.ends_on,w.intent,w.matters_because,w.state,coach_id
    from public.training_weeks w
   where w.athlete_id=hope_id and w.block_id=hope_block
   order by w.week_number;

  insert into public.plan_assignments(
    plan_id,plan_version_id,athlete_id,block_id,starts_at_plan_week,starts_on,notes,assigned_by
  ) values (
    v_plan,v5,anthony_id,anthony_block,4,date '2026-09-14',
    'Anthony joins the shared RPD calendar in Week 4. W4 mirrors the live cohort prescription; W5-W15 follows v5. Race pace 6:45–7:00/mi and threshold 6:20–6:25/mi per current coaching decision. No pre-join FORM completion is fabricated.',
    coach_id
  );

  for src in
    select ps.*, w.week_number,
           (select mc.value from public.mark_checkpoints mc where mc.id=ps.asks_checkpoint_id) as ask_value
      from public.planned_sessions ps
      join public.training_weeks w on w.id=ps.week_id
     where ps.athlete_id=hope_id
       and w.block_id=hope_block
       and w.week_number between 4 and 15
       and ps.state<>'cancelled'
       and ps.withdrawn_at is null
     order by w.week_number,ps.scheduled_on,ps.position
  loop
    select v.* into source_version
      from public.planned_session_versions v
     where v.planned_session_id=src.id
     order by v.version_number desc limit 1;

    select id into new_week
      from public.training_weeks
     where athlete_id=anthony_id and block_id=anthony_block and week_number=src.week_number;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'role',c.role,'shape',c.shape,'position',c.position,
      'distance',c.distance,'distanceUnit',c.distance_unit,
      'durationSeconds',c.duration_seconds,'repeatCount',c.repeat_count,
      'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,
      'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high,
      'recoveryKind',c.recovery_kind,'recoverySeconds',c.recovery_seconds,
      'countsTowardMarkId',case when c.counts_toward_mark_id is not null then anthony_mark end
    )) order by c.position),'[]'::jsonb)
    into parts
    from public.planned_session_components c
    where c.version_id=source_version.id;

    new_session := public.author_session(
      anthony_id,new_week,src.day_label,source_version.title,source_version.intent,
      src.scheduled_on,src.position,source_version.prescribed_distance,source_version.distance_unit,
      source_version.prescribed_duration_minutes,source_version.rpe_low,source_version.rpe_high,
      parts,source_version.details
    );

    asked_value := src.ask_value;
    update public.planned_sessions
       set plan_session_id=src.plan_session_id,
           role=src.role,
           is_key=src.is_key,
           asks_checkpoint_id=(
             select id from public.mark_checkpoints
              where mark_id=anthony_mark and value=asked_value limit 1
           )
     where id=new_session;
  end loop;

  if not exists (
    select 1 from public.plan_assignments pa
    join public.training_plan_versions v on v.id=pa.plan_version_id
    where pa.athlete_id=anthony_id and v.version_number=5 and pa.starts_at_plan_week=4
  ) then raise exception 'Anthony v5 assignment missing'; end if;

  if not exists (
    select 1
      from public.planned_sessions ps
      join public.training_weeks w on w.id=ps.week_id
      join lateral (
        select v.* from public.planned_session_versions v
        where v.planned_session_id=ps.id order by v.version_number desc limit 1
      ) lv on true
      join public.planned_session_components c on c.version_id=lv.id
     where ps.athlete_id=anthony_id and w.week_number=5 and ps.day_label='TUE'
       and c.role='work' and c.repeat_count=5 and c.distance=1
       and c.pace_low='6:45' and c.pace_high='7:00'
       and c.recovery_seconds=120 and c.recovery_kind='float'
  ) then raise exception 'Anthony W5 Tuesday v5 anatomy missing'; end if;

  if not exists (
    select 1
      from public.planned_sessions ps
      join public.training_weeks w on w.id=ps.week_id
      join lateral (
        select v.* from public.planned_session_versions v
        where v.planned_session_id=ps.id order by v.version_number desc limit 1
      ) lv on true
      join public.planned_session_components c on c.version_id=lv.id
     where ps.athlete_id=anthony_id and w.week_number=5 and ps.day_label='THU'
       and lv.title='Threshold 3 × 10 min'
       and c.role='work' and c.repeat_count=3 and c.duration_seconds=600
       and c.pace_low='6:20' and c.pace_high='6:25'
       and c.recovery_seconds=180
  ) then raise exception 'Anthony W5 Thursday v5 anatomy missing'; end if;
end $$;
