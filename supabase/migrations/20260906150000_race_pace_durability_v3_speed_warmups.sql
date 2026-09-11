-- Race Pace Durability v3: the three fixed-speed Thursdays use a 15-minute
-- warm-up. v1 and v2 remain immutable; athlete occurrence ids and all filed
-- history remain in place.

set local search_path = public, pg_temp;
select set_config('request.jwt.claims', '{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}', true);

do $$
declare
  v_plan uuid; v2 uuid; v3 uuid; old_week record; old_session record;
  new_week uuid; new_session uuid;
begin
  select p.id, v.id into v_plan, v2
    from training_plans p
    join training_plan_versions v on v.plan_id=p.id and v.version_number=2
   where p.slug='race-pace-durability';
  if v_plan is null then raise exception 'Race Pace Durability v2 is missing'; end if;
  if exists (select 1 from training_plan_versions where plan_id=v_plan and version_number=3) then
    raise exception 'Race Pace Durability v3 already exists';
  end if;

  insert into training_plan_versions(plan_id,version_number,summary,cut_by)
  values(v_plan,3,
    'Fixed-speed Thursday warm-ups are 15 minutes for Pyramid Intervals, Speed Demons, and Nice and Easy. All other v2 prescription is unchanged.',
    auth.uid()) returning id into v3;

  for old_week in select * from training_plan_weeks where version_id=v2 order by week_number loop
    insert into training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
    values(v_plan,v3,old_week.week_number,old_week.phase,old_week.total_distance,old_week.intent)
    returning id into new_week;

    for old_session in select * from training_plan_sessions where plan_week_id=old_week.id order by position loop
      insert into training_plan_sessions
        (plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,
         details,prescribed_distance,distance_unit,asks_rung_value,label)
      values
        (v_plan,v3,new_week,old_session.day_of_week,old_session.role,old_session.position,
         old_session.title,old_session.intent,old_session.details,
         old_session.prescribed_distance,old_session.distance_unit,
         old_session.asks_rung_value,old_session.label)
      returning id into new_session;

      insert into training_plan_components
        (plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,
         repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,
         recovery_kind,recovery_seconds,counts_toward_mark)
      select new_session,position,role,shape,distance,distance_unit,duration_seconds,
             repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,
             recovery_kind,recovery_seconds,counts_toward_mark
        from training_plan_components where plan_session_id=old_session.id order by position;
    end loop;
  end loop;

  update training_plan_components c set duration_seconds=900
    from training_plan_sessions s
    join training_plan_weeks w on w.id=s.plan_week_id
   where c.plan_session_id=s.id and s.version_id=v3 and s.day_of_week='THU'
     and w.week_number in (5,10,13) and c.role='warm_up';
end $$;

-- Move each still-future athlete occurrence to the corresponding v3 plan
-- session without replacing the occurrence itself.
do $$
declare
  row record; v3 uuid; v_mark_id uuid; components jsonb;
begin
  select v.id into v3 from training_plan_versions v
    join training_plans p on p.id=v.plan_id
   where p.slug='race-pace-durability' and v.version_number=3;

  if exists (
    select 1 from session_completions c
    join planned_sessions ps on ps.id=c.planned_session_id
    join training_weeks w on w.id=ps.week_id
    join athletes a on a.id=ps.athlete_id
    where a.slug in ('hope','jose') and w.week_number between 4 and 15
  ) then raise exception 'Hope/Jose W4-W15 contains filed history; refusing v3 cutover'; end if;

  update planned_sessions ps set plan_session_id=new_s.id
    from athletes a, training_weeks athlete_w,
         training_plan_sessions old_s, training_plan_weeks old_w,
         training_plan_sessions new_s, training_plan_weeks new_w
   where ps.athlete_id=a.id and a.slug in ('hope','jose')
     and ps.state<>'cancelled' and ps.week_id=athlete_w.id
     and athlete_w.week_number between 4 and 15
     and old_s.id=ps.plan_session_id and old_w.id=old_s.plan_week_id
     and old_s.version_id<>v3
     and new_s.version_id=v3 and new_w.id=new_s.plan_week_id
     and new_w.week_number=old_w.week_number
     and new_s.day_of_week=old_s.day_of_week and new_s.position=old_s.position;

  update plan_assignments pa set plan_version_id=v3,
    notes='RPD v3 effective W4: fixed-speed Thursday warm-ups are 15 minutes. W1-W3 history remains unchanged.'
    from athletes a where a.id=pa.athlete_id and a.slug in ('hope','jose')
      and pa.plan_id=(select p.id from training_plans p where p.slug='race-pace-durability');
  update training_blocks b set plan_version_id=v3
    from athletes a where a.id=b.athlete_id and a.slug in ('hope','jose')
      and b.status='active' and b.name='Race Pace Durability';

  -- Only the three changed occurrences receive a new authored version.
  for row in
    select ps.id occurrence_id,ps.athlete_id,s.*,w.week_number
      from planned_sessions ps
      join athletes a on a.id=ps.athlete_id
      join training_plan_sessions s on s.id=ps.plan_session_id and s.version_id=v3
      join training_plan_weeks w on w.id=s.plan_week_id
     where a.slug in ('hope','jose') and ps.state<>'cancelled'
       and w.week_number in (5,10,13) and s.day_of_week='THU'
  loop
    select id into v_mark_id from athlete_marks
     where athlete_id=row.athlete_id and active and is_primary;
    select jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'role',c.role,'shape',c.shape,'position',c.position,
      'distance',c.distance,'distanceUnit',c.distance_unit,
      'durationSeconds',c.duration_seconds,'repeatCount',c.repeat_count,
      'paceLowSeconds',c.pace_low_seconds,'paceHighSeconds',c.pace_high_seconds,
      'rpeLow',c.rpe_low,'rpeHigh',c.rpe_high,
      'recoveryKind',c.recovery_kind,'recoverySeconds',c.recovery_seconds,
      'countsTowardMarkId',case when c.counts_toward_mark then v_mark_id end)) order by c.position)
      into components from training_plan_components c where c.plan_session_id=row.id;

    perform write_session_version(row.occurrence_id,row.title,row.intent,
      row.prescribed_distance,row.distance_unit,null,null,null,
      'RPD v3: fixed-speed Thursday warm-up shortened from 20 minutes to 15 minutes.',
      components,row.details);
  end loop;
end $$;

update plan_publications pub set revoked_at=now()
  from training_plans p,training_plan_versions v
 where p.id=pub.plan_id and p.slug='race-pace-durability'
   and v.id=pub.plan_version_id and v.version_number=2 and pub.revoked_at is null;

insert into plan_publications
  (plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by)
select p.id,v.id,'race-pace-durability',date '2026-08-24',date '2026-12-05',
       'OUC Half Marathon',now(),auth.uid()
  from training_plans p join training_plan_versions v on v.plan_id=p.id and v.version_number=3
 where p.slug='race-pace-durability';

do $$
declare n integer; payload jsonb;
begin
  select count(*) into n from training_plan_sessions s
    join training_plan_versions v on v.id=s.version_id
    join training_plans p on p.id=v.plan_id
   where p.slug='race-pace-durability' and v.version_number=3;
  if n<>90 then raise exception 'RPD v3 has % sessions, expected 90',n; end if;

  select count(*) into n from training_plan_components c
    join training_plan_sessions s on s.id=c.plan_session_id
    join training_plan_weeks w on w.id=s.plan_week_id
   where s.version_id=(select v.id from training_plan_versions v join training_plans p on p.id=v.plan_id where p.slug='race-pace-durability' and v.version_number=3)
     and w.week_number in (5,10,13) and s.day_of_week='THU'
     and c.role='warm_up' and c.duration_seconds=900;
  if n<>3 then raise exception 'Expected three 15-minute canonical speed warm-ups; found %',n; end if;

  select count(*) into n from assignment_drift;
  if n<>0 then raise exception '% unapproved assignment drift rows after v3',n; end if;

  select public_plan('race-pace-durability') into payload;
  if (payload->'version'->>'number')::integer<>3 then raise exception 'public RPD is not v3'; end if;
end $$;
