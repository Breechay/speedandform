-- FORM endurance doctrine: replace 3 x 10-minute work and mile-repeat workouts
-- in the eight CURRENT reusable plan versions. Completed and historical versions
-- remain immutable; athlete assignments remain pinned to their authored version.
-- This is intentionally data-only and atomic. It may be rerun safely.

do $$
declare
  plan_row record;
  source_version uuid;
  destination_version uuid;
  source_week record;
  source_session record;
  destination_week uuid;
  destination_session uuid;
  publication_row public.plan_publications%rowtype;
  target_count integer;
  changed_count integer := 0;
  source_count integer;
  destination_count integer;
  version_note constant text := 'Nov 6 FORM endurance doctrine: continuous tempo, steady durability and hybrid-specific run intervals; no 3x10 or mile-repeat work.';
begin
  create temporary table _form_doctrine_targets (
    slug text not null,
    week_number integer not null,
    day_of_week text not null,
    new_title text not null,
    work_seconds integer,
    work_distance numeric,
    work_unit text,
    work_repetitions integer,
    details text not null,
    primary key (slug, week_number, day_of_week),
    check ((work_seconds is not null and work_distance is null and work_repetitions is null)
        or (work_seconds is null and work_distance is not null and work_repetitions is not null))
  ) on commit drop;

  insert into _form_doctrine_targets values
  ('anthony-the-long-game-miami-marathon-2027',5,'THU','30 min continuous threshold',1800,null,null,null,'15 min easy warm-up; 30 min continuous controlled threshold at the existing pace band; 10 min easy cool-down. Maintain even form and effort.'),
  ('anthony-the-long-game-miami-marathon-2027',5,'TUE','35 min race-pace durability',2100,null,null,null,'20 min easy warm-up; 35 min sustained at the prescribed controlled race-specific pace; 10 min easy cool-down. No speeding up below the prescribed band.'),
  ('anthony-the-long-game-miami-marathon-2027',11,'TUE','25 min steady',1500,null,null,null,'20 min easy warm-up; 25 min continuous steady running at the existing pace band; 10 min easy cool-down.'),
  ('anthony-the-long-game-miami-marathon-2027',14,'TUE','30 min steady',1800,null,null,null,'20 min easy warm-up; 30 min continuous steady running at the existing pace band; 10 min easy cool-down.'),
  ('anthony-the-long-game-miami-marathon-2027',15,'TUE','18 min steady',1080,null,null,null,'20 min easy warm-up; 18 min continuous steady running at the existing pace band; 10 min easy cool-down. Preserve freshness.'),
  ('anthony-the-long-game-miami-marathon-2027',18,'TUE','30 min continuous threshold',1800,null,null,null,'20 min easy warm-up; 30 min continuous controlled threshold at RPE 6–7; 10 min easy cool-down.'),

  ('elijah-nov11-half',6,'TUE','22 min controlled tempo',1320,null,null,null,'20 min easy warm-up; 22 min continuous controlled tempo at 6:20–6:25/mi; 10 min easy cool-down. Keep effort consistent.'),
  ('elijah-nov11-half',8,'TUE','35 min controlled tempo',2100,null,null,null,'20 min easy warm-up; 35 min continuous controlled tempo at 6:18–6:24/mi; 10 min easy cool-down. Stay smooth.'),
  ('elijah-nov11-half',10,'TUE','22 min race-specific tempo',1320,null,null,null,'20 min easy warm-up; 22 min continuous race-specific tempo at 6:12–6:18/mi; 10 min easy cool-down. Finish with control.'),

  ('hyrox-run-reserve-franklin-mi-20261026',5,'TUE','22 min steady run',1320,null,null,null,'1 mi easy warm-up; 22 min continuous steady running at RPE 6–7; 2 mi easy cool-down. Preserve running economy.'),
  ('hyrox-run-reserve-franklin-mi-20261026',6,'THU','Row → 1 km run × 3',null,1,'km',3,'800 m easy warm-up. Three rounds of 250 m RowErg at RPE 5 then 1 km controlled run at RPE 5–6, with easy walking recovery between rounds. Cool down easy. Retain HYROX station-to-run transition practice.'),

  ('race-pace-durability',1,'TUE','28 min race-pace durability',1680,null,null,null,'20 min easy warm-up; 28 min continuous controlled race-specific running at the existing prescribed pace; 10 min easy cool-down.'),
  ('race-pace-durability',5,'THU','30 min continuous threshold · if Tuesday absorbed',1800,null,null,null,'15 min easy warm-up; 30 min continuous controlled threshold; 10 min easy cool-down. Run this only if Tuesday was absorbed; otherwise use easy running and strides.'),
  ('race-pace-durability',5,'TUE','35 min race-pace durability',2100,null,null,null,'20 min easy warm-up; 35 min continuous controlled race-specific running at the existing prescribed pace; 10 min easy cool-down.'),
  ('race-pace-durability',10,'THU','30 min continuous threshold · if Tuesday absorbed',1800,null,null,null,'15 min easy warm-up; 30 min continuous controlled threshold; 10 min easy cool-down. Run this only if Tuesday was absorbed; otherwise use easy running and strides.'),
  ('race-pace-durability',11,'TUE','28 min race-pace durability',1680,null,null,null,'20 min easy warm-up; 28 min continuous controlled race-specific running at the existing prescribed pace; 10 min easy cool-down.'),
  ('race-pace-durability',12,'TUE','25 min race-pace durability',1500,null,null,null,'20 min easy warm-up; 25 min continuous controlled race-specific running at the existing prescribed pace; 10 min easy cool-down.'),
  ('race-pace-durability',14,'TUE','25 min race-pace durability',1500,null,null,null,'20 min easy warm-up; 25 min continuous controlled race-specific running at the existing prescribed pace; 10 min easy cool-down.'),
  ('race-pace-durability',15,'TUE','18 min race-pace rehearsal',1080,null,null,null,'20 min easy warm-up; 18 min continuous race-pace rehearsal at the existing prescribed pace; 10 min easy cool-down. Preserve freshness.'),

  ('race-pace-durability-km',5,'THU','30 min continuous threshold',1800,null,null,null,'15 min easy warm-up; 30 min continuous controlled threshold at the established pace; 10 min easy cool-down.'),
  ('race-pace-durability-km',10,'THU','30 min continuous threshold',1800,null,null,null,'15 min easy warm-up; 30 min continuous controlled threshold at the established pace; 10 min easy cool-down.'),
  ('race-pace-durability-tinius-restart-20260928',5,'THU','30 min continuous threshold',1800,null,null,null,'15 min easy warm-up; 30 min continuous controlled threshold at the established pace; 10 min easy cool-down. Heart rate is context, not a live cap.'),
  ('race-pace-durability-tinius-restart-20260928',10,'THU','30 min continuous threshold',1800,null,null,null,'15 min easy warm-up; 30 min continuous controlled threshold at the established pace; 10 min easy cool-down. Heart rate is context, not a live cap.'),

  ('simon-ceiling-durability-01',11,'TUE','30 min continuous steady',1800,null,null,null,'2 km easy warm-up; 30 min continuous steady running at the established pace band; 2 km easy cool-down. Record RPE and pacing evenness.'),
  ('simon-ceiling-durability-01',15,'TUE','30 min continuous steady',1800,null,null,null,'2 km easy warm-up; 30 min continuous steady running at the established pace band; 2 km easy cool-down. Record RPE and pacing evenness.'),
  ('simon-ceiling-durability-01',29,'TUE','30 min continuous steady',1800,null,null,null,'2 km easy warm-up; 30 min continuous steady running at the established pace band; 2 km easy cool-down. Record RPE and pacing evenness.'),

  ('wesley-amar-miami-half-2027',7,'TUE','18 min controlled steady',1080,null,null,null,'15 min easy warm-up; 18 min continuous steady running at 7:30–7:40/mi; 10 min easy cool-down.'),
  ('wesley-amar-miami-half-2027',8,'TUE','25 min controlled steady',1500,null,null,null,'15 min easy warm-up; 25 min continuous steady running at 7:25–7:35/mi; 10 min easy cool-down.'),
  ('wesley-amar-miami-half-2027',11,'TUE','30 min race-specific steady',1800,null,null,null,'15 min easy warm-up; 30 min continuous race-specific steady running at 7:20–7:25/mi; 10 min easy cool-down.');

  select count(*) into target_count from _form_doctrine_targets;
  if target_count <> 29 or (select count(distinct slug) from _form_doctrine_targets) <> 8 then
    raise exception 'Unexpected FORM target roster: % sessions', target_count;
  end if;

  for plan_row in
    select p.id, p.slug, max(v.version_number) as latest_number
    from public.training_plans p join public.training_plan_versions v on v.plan_id=p.id
    where p.slug in (select distinct slug from _form_doctrine_targets)
    group by p.id,p.slug order by p.slug
  loop
    -- An existing target version means the migration has already run for this plan.
    if exists (select 1 from public.training_plan_versions where plan_id=plan_row.id and summary=version_note) then
      continue;
    end if;

    if plan_row.latest_number <> (case plan_row.slug
      when 'anthony-the-long-game-miami-marathon-2027' then 1
      when 'elijah-nov11-half' then 7
      when 'hyrox-run-reserve-franklin-mi-20261026' then 2
      when 'race-pace-durability' then 10
      when 'race-pace-durability-km' then 1
      when 'race-pace-durability-tinius-restart-20260928' then 1
      when 'simon-ceiling-durability-01' then 6
      when 'wesley-amar-miami-half-2027' then 1
      end) then
      raise exception 'Plan % has a newer version; re-audit before applying',plan_row.slug;
    end if;

    select id into strict source_version from public.training_plan_versions
      where plan_id=plan_row.id and version_number=plan_row.latest_number;

    select count(*) into source_count
    from _form_doctrine_targets t
    join public.training_plan_weeks w on w.version_id=source_version and w.week_number=t.week_number
    join public.training_plan_sessions s on s.plan_week_id=w.id and s.day_of_week=t.day_of_week
    where t.slug=plan_row.slug;
    if source_count <> (select count(*) from _form_doctrine_targets where slug=plan_row.slug) then
      raise exception 'Expected target sessions missing or duplicated for %: %', plan_row.slug,source_count;
    end if;
    select count(*) into destination_count
    from _form_doctrine_targets t
    join public.training_plan_weeks w on w.version_id=source_version and w.week_number=t.week_number
    join public.training_plan_sessions s on s.plan_week_id=w.id and s.day_of_week=t.day_of_week
    join public.training_plan_components c on c.plan_session_id=s.id and c.role='work'
    where t.slug=plan_row.slug and
      ((c.duration_seconds=600 and c.repeat_count=3)
       or (c.distance=1 and c.distance_unit='mi' and c.repeat_count>=2));
    if destination_count <> source_count then
      raise exception 'Source workout anatomy changed for %: % forbidden work segments vs % expected',plan_row.slug,destination_count,source_count;
    end if;

    insert into public.training_plan_versions(plan_id,version_number,summary)
    values (plan_row.id,plan_row.latest_number+1,version_note) returning id into destination_version;

    for source_week in select * from public.training_plan_weeks where version_id=source_version order by week_number loop
      insert into public.training_plan_weeks(plan_id,version_id,week_number,phase,total_distance,intent)
      values(plan_row.id,destination_version,source_week.week_number,source_week.phase,source_week.total_distance,source_week.intent)
      returning id into destination_week;

      for source_session in select * from public.training_plan_sessions where plan_week_id=source_week.id order by position loop
        insert into public.training_plan_sessions
          (plan_id,version_id,plan_week_id,day_of_week,role,position,title,intent,details,prescribed_distance,distance_unit,asks_rung_value,label)
        values (plan_row.id,destination_version,destination_week,source_session.day_of_week,source_session.role,source_session.position,
          source_session.title,source_session.intent,source_session.details,source_session.prescribed_distance,
          source_session.distance_unit,source_session.asks_rung_value,source_session.label)
        returning id into destination_session;

        insert into public.training_plan_components
          (plan_session_id,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark)
        select destination_session,position,role,shape,distance,distance_unit,duration_seconds,repeat_count,
          pace_low_seconds,pace_high_seconds,rpe_low,rpe_high,recovery_kind,recovery_seconds,counts_toward_mark
        from public.training_plan_components where plan_session_id=source_session.id;
      end loop;
    end loop;

    update public.training_plan_sessions s
      set title=t.new_title,details=t.details,
          -- A reduced HYROX station circuit must not retain the old 4-mile total.
          prescribed_distance=case when t.slug='hyrox-run-reserve-franklin-mi-20261026' and t.week_number=6 then 3 else s.prescribed_distance end
    from public.training_plan_weeks w, _form_doctrine_targets t
    where s.plan_week_id=w.id and w.version_id=destination_version and w.week_number=t.week_number
      and s.day_of_week=t.day_of_week and t.slug=plan_row.slug;
    get diagnostics destination_count = row_count;
    changed_count := changed_count + destination_count;

    update public.training_plan_components c
      set shape=case when t.work_seconds is not null then 'continuous' else 'repetitions' end,
          distance=t.work_distance,distance_unit=case when t.work_distance is null then null else t.work_unit end,
          duration_seconds=t.work_seconds,repeat_count=t.work_repetitions,
          recovery_kind=null,recovery_seconds=null
    from public.training_plan_sessions s,public.training_plan_weeks w,_form_doctrine_targets t
    where c.plan_session_id=s.id and c.role='work' and s.plan_week_id=w.id
      and w.version_id=destination_version and w.week_number=t.week_number
      and s.day_of_week=t.day_of_week and t.slug=plan_row.slug;
    get diagnostics destination_count = row_count;
    if destination_count <> source_count then
      raise exception 'Work components not one-to-one for %: % vs %',plan_row.slug,destination_count,source_count;
    end if;

    -- Only replace a currently active reusable publication. Never repoint the
    -- athlete's plan_assignments or mutate historical version rows.
    for publication_row in select * from public.plan_publications
      where plan_id=plan_row.id and plan_version_id=source_version and published_at is not null and revoked_at is null
    loop
      insert into public.plan_publications
        (plan_id,plan_version_id,slug,starts_on,race_on,race_name,published_at,published_by,effective_on)
      values (plan_row.id,destination_version,publication_row.slug,publication_row.starts_on,
        publication_row.race_on,publication_row.race_name,now(),publication_row.published_by,publication_row.effective_on);
      update public.plan_publications set revoked_at=now() where id=publication_row.id;
    end loop;
  end loop;

  if changed_count <> target_count then
    raise exception 'Expected % cloned template edits, applied %',target_count,changed_count;
  end if;
end $$;
