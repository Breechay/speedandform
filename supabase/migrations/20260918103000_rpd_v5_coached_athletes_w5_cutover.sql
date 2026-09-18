-- RPD coached-athlete cutover to public v5 effective Week 5.
--
-- Coaching decision, Sep 18 2026:
-- The website was the active coaching surface while the native app was being
-- rebuilt. Hope and José therefore follow the current v5 prescription from W5
-- forward. W1-W4 remain immutable historical truth on their earlier versions.
--
-- Anthony is represented in the native acceptance fixture but has no canonical
-- private athlete row in this project yet, so this migration does not fabricate
-- one for him.
--
-- v5 changes the future Thursday ceiling spine. Existing athlete occurrences keep
-- their occurrence ids. Their plan links move to v5; only the v5-changed Thursday
-- sessions receive a new occurrence version. Existing authorized overrides are
-- never overwritten.

set local search_path=public,pg_temp;
select set_config('request.jwt.claims','{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}',true);

do $$
declare
  v_plan uuid;
  v5 uuid;
  athlete record;
  r record;
  parts jsonb;
  mark_id uuid;
  changed_count integer := 0;
  hope_target_count integer := 0;
begin
  select p.id, v.id into v_plan, v5
    from public.training_plans p
    join public.training_plan_versions v on v.plan_id=p.id
   where p.slug='race-pace-durability' and v.version_number=5;

  if v_plan is null or v5 is null then
    raise exception 'RPD v5 is missing';
  end if;

  if exists (
    select 1
      from public.session_completions c
      join public.planned_sessions ps on ps.id=c.planned_session_id
      join public.training_weeks w on w.id=ps.week_id
      join public.athletes a on a.id=ps.athlete_id
     where a.slug in ('hope','jose')
       and w.week_number between 5 and 15
  ) then
    raise exception 'Hope/Jose W5-W15 contains filed history; refusing v5 cutover';
  end if;

  -- Repoint each future occurrence at the matching v5 plan session without
  -- changing occurrence identity or W1-W4 history.
  update public.planned_sessions ps
     set plan_session_id = ns.id
    from public.athletes a,
         public.training_weeks aw,
         public.training_plan_sessions os,
         public.training_plan_weeks ow,
         public.training_plan_sessions ns,
         public.training_plan_weeks nw
   where ps.athlete_id=a.id
     and a.slug in ('hope','jose')
     and ps.state<>'cancelled'
     and ps.week_id=aw.id
     and aw.week_number between 5 and 15
     and os.id=ps.plan_session_id
     and ow.id=os.plan_week_id
     and ns.version_id=v5
     and nw.id=ns.plan_week_id
     and nw.week_number=ow.week_number
     and ns.day_of_week=os.day_of_week
     and ns.position=os.position;

  update public.plan_assignments pa
     set plan_version_id=v5,
         notes='RPD v5 effective W5 by coach decision. W1-W4 remain historical on prior versions; W5-W15 follows the threshold-spine edition coached on the web while the app was in rebuild.'
    from public.athletes a
   where a.id=pa.athlete_id
     and a.slug in ('hope','jose')
     and pa.plan_id=v_plan;

  update public.training_blocks b
     set plan_id=v_plan, plan_version_id=v5
    from public.athletes a
   where a.id=b.athlete_id
     and a.slug in ('hope','jose')
     and b.status='active'
     and b.name='Race Pace Durability';

  -- Only these Thursdays changed between v4 and v5. Write an occurrence version
  -- from the v5 plan unless the coach already authored an explicit override.
  for athlete in
    select a.id,a.slug
      from public.athletes a
     where a.slug in ('hope','jose')
  loop
    select id into mark_id
      from public.athlete_marks
     where athlete_id=athlete.id and active and is_primary
     limit 1;

    for r in
      select ps.id occurrence_id,
             ps.override_reason,
             s.id plan_session_id,
             s.title,s.intent,s.details,s.prescribed_distance,s.distance_unit,
             w.week_number
        from public.planned_sessions ps
        join public.training_weeks aw on aw.id=ps.week_id
        join public.training_plan_sessions s on s.id=ps.plan_session_id and s.version_id=v5
        join public.training_plan_weeks w on w.id=s.plan_week_id
       where ps.athlete_id=athlete.id
         and ps.state<>'cancelled'
         and aw.week_number=w.week_number
         and w.week_number in (5,7,8,10,13)
         and s.day_of_week='THU'
       order by w.week_number
    loop
      if r.override_reason is not null then
        continue;
      end if;

      select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
        'role',c.role,
        'shape',c.shape,
        'position',c.position,
        'distance',c.distance,
        'distanceUnit',c.distance_unit,
        'durationSeconds',c.duration_seconds,
        'repeatCount',c.repeat_count,
        'paceLowSeconds',c.pace_low_seconds,
        'paceHighSeconds',c.pace_high_seconds,
        'rpeLow',c.rpe_low,
        'rpeHigh',c.rpe_high,
        'recoveryKind',c.recovery_kind,
        'recoverySeconds',c.recovery_seconds,
        'countsTowardMarkId',case when c.counts_toward_mark then mark_id end
      )) order by c.position),'[]'::jsonb)
      into parts
      from public.training_plan_components c
      where c.plan_session_id=r.plan_session_id;

      perform public.write_session_version(
        r.occurrence_id,
        r.title,
        r.intent,
        r.prescribed_distance,
        r.distance_unit,
        null,
        null,
        null,
        'RPD v5 effective W5: web-coached threshold-spine cutover; earlier athlete history remains on prior plan versions.',
        parts,
        r.details
      );
      changed_count := changed_count + 1;
    end loop;
  end loop;

  if changed_count <> 10 then
    raise exception 'expected 10 Hope/Jose v5 Thursday revisions, wrote %',changed_count;
  end if;

  -- Hope's latest public study is the athlete-specific authority:
  -- race pace 6:45–7:00/mi; threshold about 6:20–6:25/mi.
  --
  -- Resolve those numbers only into her future W5-W15 occurrence versions.
  -- The underlying public Plan stays athlete-relative/generic, and W1-W4 evidence
  -- is untouched. Explicit coach overrides remain authoritative and are skipped.
  select m.id into mark_id
    from public.athlete_marks m
    join public.athletes a on a.id=m.athlete_id
   where a.slug='hope' and m.active and m.is_primary
   limit 1;

  if mark_id is null then
    raise exception 'Hope primary race-pace mark is missing';
  end if;

  update public.athlete_marks m
     set current_question='How far can you hold 6:45–7:00 without it coming apart?',
         updated_at=now()
    from public.athletes a
   where a.id=m.athlete_id and a.slug='hope' and m.active and m.is_primary;

  for r in
    select ps.id occurrence_id,
           ps.override_reason,
           s.id plan_session_id,
           s.title,s.intent,s.details,s.prescribed_distance,s.distance_unit,
           w.week_number,s.day_of_week
      from public.planned_sessions ps
      join public.athletes a on a.id=ps.athlete_id and a.slug='hope'
      join public.training_weeks aw on aw.id=ps.week_id
      join public.training_plan_sessions s on s.id=ps.plan_session_id and s.version_id=v5
      join public.training_plan_weeks w on w.id=s.plan_week_id
     where ps.state<>'cancelled'
       and aw.week_number=w.week_number
       and w.week_number between 5 and 15
     order by w.week_number,s.position
  loop
    if r.override_reason is not null then
      continue;
    end if;

    -- Only write a new athlete occurrence version when this session contains a
    -- race-pace mark component or is one of the v5 threshold-spine Thursdays.
    if not exists (
      select 1 from public.training_plan_components c
       where c.plan_session_id=r.plan_session_id and c.counts_toward_mark
    ) and not (
      r.day_of_week='THU' and r.week_number in (5,8,10,13)
    ) then
      continue;
    end if;

    select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
      'role',c.role,
      'shape',c.shape,
      'position',c.position,
      'distance',c.distance,
      'distanceUnit',c.distance_unit,
      'durationSeconds',c.duration_seconds,
      'repeatCount',c.repeat_count,
      -- Hope race-pace work: 6:45–7:00.
      -- Hope threshold-spine work: 6:20–6:25.
      'paceLowSeconds',case
        when c.counts_toward_mark then 405
        when r.day_of_week='THU' and r.week_number in (5,8,10,13) and c.role='work' then 380
        else c.pace_low_seconds
      end,
      'paceHighSeconds',case
        when c.counts_toward_mark then 420
        when r.day_of_week='THU' and r.week_number in (5,8,10,13) and c.role='work' then 385
        else c.pace_high_seconds
      end,
      'rpeLow',c.rpe_low,
      'rpeHigh',c.rpe_high,
      'recoveryKind',c.recovery_kind,
      'recoverySeconds',c.recovery_seconds,
      'countsTowardMarkId',case when c.counts_toward_mark then mark_id end
    )) order by c.position),'[]'::jsonb)
    into parts
    from public.training_plan_components c
    where c.plan_session_id=r.plan_session_id;

    perform public.write_session_version(
      r.occurrence_id,
      r.title,
      r.intent,
      r.prescribed_distance,
      r.distance_unit,
      null,
      null,
      null,
      'Hope study canon effective W5: race pace 6:45–7:00/mi; threshold 6:20–6:25/mi. Earlier evidence remains unchanged.',
      parts,
      r.details
    );
    hope_target_count := hope_target_count + 1;
  end loop;

  if hope_target_count = 0 then
    raise exception 'Hope v5 cutover wrote no study-canon future targets';
  end if;

  -- Proofs: both assignments are v5, W4 remains v4, W5 Thursday is 3 × 10,
  -- and no active future occurrence points at a pre-v5 plan session.
  if exists (
    select 1
      from public.plan_assignments pa
      join public.athletes a on a.id=pa.athlete_id
      join public.training_plan_versions v on v.id=pa.plan_version_id
     where a.slug in ('hope','jose') and v.version_number<>5
  ) then raise exception 'Hope/Jose assignment did not move to v5'; end if;

  if exists (
    select 1
      from public.planned_sessions ps
      join public.athletes a on a.id=ps.athlete_id
      join public.training_weeks aw on aw.id=ps.week_id
      join public.training_plan_sessions s on s.id=ps.plan_session_id
      join public.training_plan_versions v on v.id=s.version_id
     where a.slug in ('hope','jose')
       and ps.state<>'cancelled'
       and aw.week_number between 5 and 15
       and v.version_number<>5
  ) then raise exception 'active W5-W15 occurrence still points before v5'; end if;

  if exists (
    select 1
      from public.planned_sessions ps
      join public.athletes a on a.id=ps.athlete_id
      join public.training_weeks aw on aw.id=ps.week_id
      join public.training_plan_sessions s on s.id=ps.plan_session_id
      join public.training_plan_versions v on v.id=s.version_id
     where a.slug in ('hope','jose')
       and ps.state<>'cancelled'
       and aw.week_number=4
       and v.version_number<>4
  ) then raise exception 'W4 history was rewritten during v5 cutover'; end if;

  if (
    select count(*)
      from public.planned_sessions ps
      join public.athletes a on a.id=ps.athlete_id
      join public.training_weeks aw on aw.id=ps.week_id
      join lateral (
        select v.*
          from public.planned_session_versions v
         where v.planned_session_id=ps.id
         order by v.version_number desc limit 1
      ) lv on true
     where a.slug in ('hope','jose')
       and ps.state<>'cancelled'
       and aw.week_number=5
       and ps.day_label='THU'
       and lv.title='Threshold 3 × 10 min'
  ) <> 2 then
    raise exception 'W5 Thursday did not resolve to Threshold 3 × 10 for both athletes';
  end if;

  if (
    select count(*)
      from public.planned_sessions ps
      join public.athletes a on a.id=ps.athlete_id
      join public.training_weeks aw on aw.id=ps.week_id
      join lateral (
        select v.*
          from public.planned_session_versions v
         where v.planned_session_id=ps.id
         order by v.version_number desc limit 1
      ) lv on true
      join public.planned_session_components c on c.version_id=lv.id and c.role='work'
     where a.slug in ('hope','jose')
       and ps.state<>'cancelled'
       and aw.week_number=5
       and ps.day_label='THU'
       and c.repeat_count=3
       and c.duration_seconds=600
       and c.recovery_seconds=180
  ) <> 2 then
    raise exception 'W5 Thursday v5 3 × 10 / 3 min anatomy missing';
  end if;

  if not exists (
    select 1
      from public.planned_sessions ps
      join public.athletes a on a.id=ps.athlete_id and a.slug='hope'
      join public.training_weeks aw on aw.id=ps.week_id and aw.week_number=5
      join lateral (
        select v.* from public.planned_session_versions v
         where v.planned_session_id=ps.id order by v.version_number desc limit 1
      ) lv on true
      join public.planned_session_components c on c.version_id=lv.id
     where ps.state<>'cancelled'
       and ps.day_label='TUE'
       and c.role='work'
       and c.repeat_count=5
       and c.distance=1
       and c.distance_unit='mi'
       and c.pace_low='6:45'
       and c.pace_high='7:00'
       and c.recovery_seconds=120
       and c.recovery_kind='float'
  ) then raise exception 'Hope W5 Tuesday does not carry study-canon 6:45–7:00 / 2 min float'; end if;

  if not exists (
    select 1
      from public.planned_sessions ps
      join public.athletes a on a.id=ps.athlete_id and a.slug='hope'
      join public.training_weeks aw on aw.id=ps.week_id and aw.week_number=5
      join lateral (
        select v.* from public.planned_session_versions v
         where v.planned_session_id=ps.id order by v.version_number desc limit 1
      ) lv on true
      join public.planned_session_components c on c.version_id=lv.id
     where ps.state<>'cancelled'
       and ps.day_label='THU'
       and lv.title='Threshold 3 × 10 min'
       and c.role='work'
       and c.repeat_count=3
       and c.duration_seconds=600
       and c.pace_low='6:20'
       and c.pace_high='6:25'
       and c.recovery_seconds=180
  ) then raise exception 'Hope W5 Thursday does not carry study-canon threshold 6:20–6:25'; end if;

  if not exists (
    select 1
      from public.athlete_marks m
      join public.athletes a on a.id=m.athlete_id
     where a.slug='hope' and m.active and m.is_primary
       and m.current_question='How far can you hold 6:45–7:00 without it coming apart?'
  ) then raise exception 'Hope primary mark still carries the stale race-pace band'; end if;
end $$;
