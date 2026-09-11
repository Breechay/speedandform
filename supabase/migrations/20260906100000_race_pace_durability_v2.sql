-- Race Pace Durability v2: preserve the durability spine and reopen the ceiling.
--
-- v1 remains immutable and reconstructable. Hope and Jose keep every W1-W3
-- occurrence on v1; only unfiled W4-W15 work is rematerialised from v2.

set local search_path = public, pg_temp;
select set_config('request.jwt.claims', '{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}', true);

do $$
declare
  v_plan uuid; v1 uuid; v2 uuid; old_week record; old_session record;
  new_week uuid; new_session uuid;
begin
  select p.id, v.id into v_plan, v1
    from training_plans p
    join training_plan_versions v on v.plan_id = p.id and v.version_number = 1
   where p.slug = 'race-pace-durability';
  if v_plan is null then raise exception 'Race Pace Durability v1 is missing'; end if;
  if exists (select 1 from training_plan_versions where plan_id = v_plan and version_number = 2) then
    raise exception 'Race Pace Durability v2 already exists';
  end if;

  insert into training_plan_versions (plan_id, version_number, summary, cut_by)
  values (v_plan, 2,
    'W1-W3 preserve the original durability build. W4-W15 retain the 5-6-8-12 continuous race-pace ladder while Pyramid Intervals, controlled VO2, Speed Demons, and Nice and Easy reopen the ceiling in protected windows.',
    auth.uid()) returning id into v2;

  -- Clone v1 first. The version is complete and independently reconstructable;
  -- the approved revision below changes four Thursday sessions only.
  for old_week in select * from training_plan_weeks where version_id = v1 order by week_number loop
    insert into training_plan_weeks
      (plan_id, version_id, week_number, phase, total_distance, intent)
    values (v_plan, v2, old_week.week_number, old_week.phase,
            old_week.total_distance, old_week.intent)
    returning id into new_week;

    for old_session in
      select * from training_plan_sessions
       where plan_week_id = old_week.id order by position
    loop
      insert into training_plan_sessions
        (plan_id, version_id, plan_week_id, day_of_week, role, position,
         title, intent, details, prescribed_distance, distance_unit,
         asks_rung_value, label)
      values
        (v_plan, v2, new_week, old_session.day_of_week, old_session.role,
         old_session.position, old_session.title, old_session.intent,
         old_session.details, old_session.prescribed_distance,
         old_session.distance_unit, old_session.asks_rung_value,
         old_session.label)
      returning id into new_session;

      insert into training_plan_components
        (plan_session_id, position, role, shape, distance, distance_unit,
         duration_seconds, repeat_count, pace_low_seconds, pace_high_seconds,
         rpe_low, rpe_high, recovery_kind, recovery_seconds,
         counts_toward_mark)
      select new_session, position, role, shape, distance, distance_unit,
             duration_seconds, repeat_count, pace_low_seconds,
             pace_high_seconds, rpe_low, rpe_high, recovery_kind,
             recovery_seconds, counts_toward_mark
        from training_plan_components
       where plan_session_id = old_session.id order by position;
    end loop;
  end loop;

  update training_plan_weeks
     set intent = 'Absorb the first continuous ask, then reopen aerobic power without competing with Saturday.'
   where version_id = v2 and week_number = 7;
  update training_plan_weeks
     set intent = 'Absorb the W9 durability read and attack the fixed speed standard while Saturday stays easy.'
   where version_id = v2 and week_number = 10;
  update training_plan_weeks
     set intent = 'Sharpen after the closing durability ask; touch the fixed standard without beginning another block.'
   where version_id = v2 and week_number = 13;

  -- W5 Thursday: PYRAMID INTERVALS. Rep-time standards are preserved verbatim
  -- in details; structured components preserve geometry, equivalent pace bands,
  -- and recovery. The target is absolute and never athlete-scaled.
  select s.id into new_session from training_plan_sessions s
    join training_plan_weeks w on w.id = s.plan_week_id
   where s.version_id = v2 and w.week_number = 5 and s.day_of_week = 'THU';
  update training_plan_sessions set
    title = 'Pyramid Intervals', label = 'Absolute speed standard',
    intent = 'The target does not move to meet the athlete. Move cleanly through the fixed standard and record proximity to it.',
    details = E'2 x 300m in 50-52s / 90s recovery\n2 x 400m in 1:08-1:12 / 2 min recovery\n1 x 600m in 1:42-1:45 / 2:30 recovery\n2 x 400m in 1:08-1:10 / 2 min recovery\n2 x 300m in 50-52s / full recovery\nAbsolute FORM standard; do not scale to athlete ability.'
   where id = new_session;
  delete from training_plan_components where plan_session_id = new_session;
  insert into training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, distance, distance_unit,
     repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds)
  values
    (new_session,1,'warm_up','continuous',1200,null,null,null,null,null,null,null),
    (new_session,2,'work','repetitions',null,0.3,'km',2,265,275,'easy',90),
    (new_session,3,'work','repetitions',null,0.4,'km',2,270,280,'easy',120),
    (new_session,4,'work','repetitions',null,0.6,'km',1,270,275,'easy',150),
    (new_session,5,'work','repetitions',null,0.4,'km',2,270,275,'easy',120),
    (new_session,6,'work','repetitions',null,0.3,'km',2,265,275,null,null),
    (new_session,7,'cool_down','continuous',600,null,null,null,null,null,null,null);

  -- W7 already carried the approved controlled VO2 session in v1. State the
  -- recovery in its title/details without changing its authored dose.
  select s.id into new_session from training_plan_sessions s
    join training_plan_weeks w on w.id = s.plan_week_id
   where s.version_id = v2 and w.week_number = 7 and s.day_of_week = 'THU';
  update training_plan_sessions set
    title = 'VO2 - 5 x 3 min',
    intent = 'Controlled hard aerobic power. Keep the work repeatable; this supports the durability block rather than replacing it.',
    details = '5 x 3 min controlled hard / 2 min easy. This is not an absolute-standard Thursday.'
   where id = new_session;
  update training_plan_components set recovery_seconds = 120
   where plan_session_id = new_session and role = 'work';

  -- W10 Thursday: SPEED DEMONS.
  select s.id into new_session from training_plan_sessions s
    join training_plan_weeks w on w.id = s.plan_week_id
   where s.version_id = v2 and w.week_number = 10 and s.day_of_week = 'THU';
  update training_plan_sessions set
    title = 'Speed Demons', label = 'Absolute speed standard',
    intent = 'Short, fast work after the W9 durability read. The standard stays fixed; the athlete records how close they came.',
    details = E'4 x 300m in 50-52s / 2:30 recovery\n6 x 200m in 32-34s / 90s recovery\n8 x 100m in 15-17s / 90s recovery\nAbsolute FORM standard; do not scale to athlete ability.'
   where id = new_session;
  delete from training_plan_components where plan_session_id = new_session;
  insert into training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, distance, distance_unit,
     repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds)
  values
    (new_session,1,'warm_up','continuous',1200,null,null,null,null,null,null,null),
    (new_session,2,'work','repetitions',null,0.3,'km',4,265,275,'easy',150),
    (new_session,3,'work','repetitions',null,0.2,'km',6,255,265,'easy',90),
    (new_session,4,'work','repetitions',null,0.1,'km',8,240,255,'easy',90),
    (new_session,5,'cool_down','continuous',600,null,null,null,null,null,null,null);

  -- W13 Thursday: NICE AND EASY.
  select s.id into new_session from training_plan_sessions s
    join training_plan_weeks w on w.id = s.plan_week_id
   where s.version_id = v2 and w.week_number = 13 and s.day_of_week = 'THU';
  update training_plan_sessions set
    title = 'Nice and Easy', label = 'Absolute speed standard',
    intent = 'A low-volume touch of the fixed standard after the major durability culmination. Finish sharp, not spent.',
    details = E'3 x 200m in 29-32s / 30s recovery\n2 x 800m in 2:25-2:30 / 4 min recovery\n1 x 400m in 1:08-1:10\nAbsolute FORM standard; do not scale to athlete ability.'
   where id = new_session;
  delete from training_plan_components where plan_session_id = new_session;
  insert into training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, distance, distance_unit,
     repeat_count, pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds)
  values
    (new_session,1,'warm_up','continuous',1200,null,null,null,null,null,null,null),
    (new_session,2,'work','repetitions',null,0.2,'km',3,238,245,'easy',30),
    (new_session,3,'work','repetitions',null,0.8,'km',2,365,375,'easy',240),
    (new_session,4,'work','repetitions',null,0.4,'km',1,272,277,null,null),
    (new_session,5,'cool_down','continuous',600,null,null,null,null,null,null,null);

  -- The load-bearing W12 wording is explicit in both the session and anatomy.
  select s.id into new_session from training_plan_sessions s
    join training_plan_weeks w on w.id = s.plan_week_id
   where s.version_id = v2 and w.week_number = 12 and s.day_of_week = 'SAT';
  update training_plan_sessions
     set title = '16 mi total - last 12 mi continuous at race pace',
         details = '16 miles total: 4 easy, then the final 12 miles continuous at 6:30-6:45 per mile.'
   where id = new_session;
end $$;

-- Move the public edition deliberately: v1 remains in the publication ledger,
-- revoked rather than deleted, and exactly one v2 edition becomes readable.
update plan_publications pub set revoked_at = now()
  from training_plans p, training_plan_versions v
 where p.id = pub.plan_id and p.slug = 'race-pace-durability'
   and v.id = pub.plan_version_id and v.version_number = 1
   and pub.revoked_at is null;

insert into plan_publications
  (plan_id, plan_version_id, slug, starts_on, race_on, race_name,
   published_at, published_by)
select p.id, v.id, 'race-pace-durability', date '2026-08-24',
       date '2026-12-05', 'OUC Half Marathon', now(), auth.uid()
  from training_plans p
  join training_plan_versions v on v.plan_id = p.id and v.version_number = 2
 where p.slug = 'race-pace-durability';

-- Re-resolve only Hope/Jose W4-W15. Filed work is a hard stop, not something
-- this migration works around.
do $$
declare
  v_plan uuid; v2 uuid; athlete record; plan_week record; plan_session record;
  old record; old_version record; old_components jsonb;
  athlete_week uuid; new_occurrence uuid; components jsonb; v_mark_id uuid;
  base_position integer;
begin
  select p.id, v.id into v_plan, v2 from training_plans p
    join training_plan_versions v on v.plan_id=p.id and v.version_number=2
   where p.slug='race-pace-durability';

  if exists (
    select 1 from session_completions c
    join planned_sessions ps on ps.id=c.planned_session_id
    join training_weeks w on w.id=ps.week_id
    join athletes a on a.id=ps.athlete_id
    where a.slug in ('hope','jose') and w.week_number between 4 and 15
  ) then raise exception 'Hope/Jose W4-W15 contains filed history; refusing v2 cutover'; end if;

  for athlete in
    select a.id, a.slug, b.id block_id from athletes a
    join training_blocks b on b.athlete_id=a.id and b.status='active'
     and b.name='Race Pace Durability'
    where a.slug in ('hope','jose')
  loop
    select id into v_mark_id from athlete_marks
     where athlete_id=athlete.id and active and is_primary;

    -- Preserve any authorized override payload before its old occurrence is
    -- withdrawn. Today this is Hope W15 Tuesday; the mechanism is not hard-coded.
    create temporary table if not exists rpd_v2_overrides (
      athlete_id uuid, week_number integer, day_label text, position integer,
      override_reason text, title text, intent text, details text,
      prescribed_distance numeric, distance_unit text,
      prescribed_duration_minutes integer, rpe_low smallint, rpe_high smallint,
      components jsonb
    ) on commit drop;
    delete from rpd_v2_overrides where athlete_id=athlete.id;
    insert into rpd_v2_overrides
    select ps.athlete_id,w.week_number,ps.day_label,ps.position,ps.override_reason,
           lv.title,lv.intent,lv.details,lv.prescribed_distance,lv.distance_unit,
           lv.prescribed_duration_minutes,lv.rpe_low,lv.rpe_high,
           coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'role',c.role,'shape',c.shape,'position',c.position,
             'distance',c.distance,'distanceUnit',c.distance_unit,
             'durationSeconds',c.duration_seconds,'repeatCount',c.repeat_count,
             'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,
             'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high,
             'recoveryKind',c.recovery_kind,'recoverySeconds',c.recovery_seconds,
             'countsTowardMarkId',c.counts_toward_mark_id)) order by c.position)
             from planned_session_components c where c.version_id=lv.id),'[]'::jsonb)
      from planned_sessions ps
      join training_weeks w on w.id=ps.week_id
      join lateral (select * from planned_session_versions x
                     where x.planned_session_id=ps.id
                     order by version_number desc limit 1) lv on true
     where ps.athlete_id=athlete.id and w.week_number between 4 and 15
       and ps.state<>'cancelled' and ps.override_reason is not null;

    for old in select ps.id from planned_sessions ps
      join training_weeks w on w.id=ps.week_id
     where ps.athlete_id=athlete.id and w.week_number between 4 and 15
       and ps.state<>'cancelled'
    loop
      perform withdraw_session(old.id,
        'Superseded by the Race Pace Durability v2 season revision effective W4. v1 and W1-W3 remain historical truth.');
    end loop;

    update plan_assignments set plan_version_id=v2,
      notes='RPD v2 effective W4. W1-W3 remain linked to v1 historical occurrences; only unfiled W4-W15 follows v2.'
     where athlete_id=athlete.id and block_id=athlete.block_id;
    update training_blocks set plan_id=v_plan,plan_version_id=v2
     where id=athlete.block_id;

    for plan_week in select * from training_plan_weeks
      where version_id=v2 and week_number between 4 and 15 order by week_number
    loop
      select id into athlete_week from training_weeks
       where athlete_id=athlete.id and week_number=plan_week.week_number;
      select coalesce(max(position),0) into base_position
       from planned_sessions where week_id=athlete_week;

      for plan_session in select * from training_plan_sessions
        where plan_week_id=plan_week.id order by position
      loop
        select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
          'role',c.role,'shape',c.shape,'position',c.position,
          'distance',c.distance,'distanceUnit',c.distance_unit,
          'durationSeconds',c.duration_seconds,'repeatCount',c.repeat_count,
          'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,
          'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high,
          'recoveryKind',c.recovery_kind,'recoverySeconds',c.recovery_seconds,
          'countsTowardMarkId',case when c.counts_toward_mark then v_mark_id end))
          order by c.position),'[]'::jsonb) into components
          from training_plan_components c where c.plan_session_id=plan_session.id;

        new_occurrence := author_session(
          athlete.id,athlete_week,plan_session.day_of_week,plan_session.title,
          plan_session.intent,
          (select starts_on+(array_position(array['MON','TUE','WED','THU','FRI','SAT','SUN'],plan_session.day_of_week)-1)
             from training_weeks where id=athlete_week),
          (base_position+plan_session.position+1)::smallint,
          plan_session.prescribed_distance,plan_session.distance_unit,
          null,null,null,components,plan_session.details);
        update planned_sessions set plan_session_id=plan_session.id,
          role=plan_session.role,
        asks_checkpoint_id=(select mc.id from mark_checkpoints mc
            where mc.mark_id=v_mark_id and mc.value=plan_session.asks_rung_value)
         where id=new_occurrence;

        -- Reapply a preserved coach override to its new canonical occurrence.
        select * into old_version from rpd_v2_overrides o
         where o.athlete_id=athlete.id and o.week_number=plan_week.week_number
           and o.day_label=plan_session.day_of_week
         order by o.position limit 1;
        if found then
          perform write_session_version(new_occurrence,old_version.title,
            old_version.intent,old_version.prescribed_distance,
            old_version.distance_unit,old_version.prescribed_duration_minutes,
            old_version.rpe_low,old_version.rpe_high,
            old_version.override_reason,old_version.components,
            old_version.details);
          update planned_sessions set override_reason=old_version.override_reason
           where id=new_occurrence;
        end if;
      end loop;
    end loop;
  end loop;
end $$;

-- Assertions: these are the claims this cutover makes.
do $$
declare n integer; p jsonb;
begin
  select count(*) into n from training_plan_versions v join training_plans p on p.id=v.plan_id
   where p.slug='race-pace-durability' and v.version_number in (1,2);
  if n<>2 then raise exception 'RPD must have exactly v1 and v2'; end if;

  select count(*) into n from training_plan_sessions s
    join training_plan_versions v on v.id=s.version_id
    join training_plans p on p.id=v.plan_id
   where p.slug='race-pace-durability' and v.version_number=2;
  if n<>90 then raise exception 'RPD v2 has % sessions, expected 90',n; end if;

  select count(*) into n from planned_sessions ps join athletes a on a.id=ps.athlete_id
    join training_weeks w on w.id=ps.week_id join training_plan_sessions s on s.id=ps.plan_session_id
    join training_plan_versions v on v.id=s.version_id
   where a.slug in ('hope','jose') and ps.state<>'cancelled'
     and ((w.week_number<=3 and v.version_number<>1) or
          (w.week_number>=4 and v.version_number<>2));
  if n<>0 then raise exception '% active occurrences cross the v1/v2 boundary incorrectly',n; end if;

  select count(*) into n from assignment_drift;
  if n<>0 then raise exception '% unapproved assignment drift rows after v2',n; end if;

  select count(*) into n from planned_sessions ps join athletes a on a.id=ps.athlete_id
    join training_weeks w on w.id=ps.week_id
   where a.slug='hope' and w.week_number=15 and ps.day_label='TUE'
     and ps.state<>'cancelled' and ps.override_reason is not null;
  if n<>1 then raise exception 'Hope W15 Tuesday override was not preserved exactly once'; end if;

  select public_plan('race-pace-durability') into p;
  if (p->'version'->>'number')::integer<>2 then raise exception 'public RPD is not v2'; end if;
  if not exists (select 1 from jsonb_array_elements(p->'weeks') w,
    jsonb_array_elements(w->'sessions') s where (w->>'week_number')::int=12
    and s->>'day'='SAT' and (s->>'distance')::numeric=16
    and s->>'title'='16 mi total - last 12 mi continuous at race pace')
  then raise exception 'public W12 Saturday was flattened or changed'; end if;
end $$;
