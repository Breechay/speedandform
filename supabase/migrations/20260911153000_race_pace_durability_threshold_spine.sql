-- Race Pace Durability · revision after W3 evidence
-- The method is shared; pace is athlete-relative.
-- W1-W3 are history. Future Thursday ceiling work is now explicit:
-- W5 3 × 10 threshold · W7 5 × 3 VO2 · W8 2 × 15 threshold
-- W10 3 × 10 threshold · W13 2 × 8 threshold.
-- This cuts a new public Plan Version. Existing athlete assignments stay pinned.

do $$
declare
  p_id uuid;
  old_v uuid;
  new_v uuid;
  old_pub public.plan_publications%rowtype;
  ow record;
  os record;
  nw uuid;
  ns uuid;
  next_version integer;
begin
  select id into p_id
    from public.training_plans
   where slug = 'race-pace-durability';

  if p_id is null then
    raise exception 'race-pace-durability plan not found';
  end if;

  select id into new_v
    from public.training_plan_versions
   where plan_id = p_id
     and summary = 'W3 evidence revision: athlete-relative public pace language; threshold spine 2x10 -> 3x10 -> 2x15 -> 3x10 -> 2x8; W7 VO2 5x3 preserved.'
   limit 1;

  if new_v is not null then
    raise notice 'RPD W3 revision already exists: %', new_v;
    return;
  end if;

  select * into old_pub
    from public.plan_publications
   where plan_id = p_id
     and published_at is not null
     and revoked_at is null
   order by published_at desc
   limit 1;

  if old_pub.id is null then
    raise exception 'RPD has no live publication to revise';
  end if;

  old_v := old_pub.plan_version_id;

  select coalesce(max(version_number), 0) + 1 into next_version
    from public.training_plan_versions
   where plan_id = p_id;

  insert into public.training_plan_versions (plan_id, version_number, summary)
  values (
    p_id,
    next_version,
    'W3 evidence revision: athlete-relative public pace language; threshold spine 2x10 -> 3x10 -> 2x15 -> 3x10 -> 2x8; W7 VO2 5x3 preserved.'
  )
  returning id into new_v;

  for ow in
    select * from public.training_plan_weeks
     where version_id = old_v
     order by week_number
  loop
    insert into public.training_plan_weeks
      (plan_id, version_id, week_number, phase, total_distance, intent)
    values
      (p_id, new_v, ow.week_number, ow.phase, ow.total_distance, ow.intent)
    returning id into nw;

    for os in
      select * from public.training_plan_sessions
       where plan_week_id = ow.id
       order by position
    loop
      insert into public.training_plan_sessions
        (plan_id, version_id, plan_week_id, day_of_week, role, position,
         title, intent, details, prescribed_distance, distance_unit,
         asks_rung_value, label)
      values
        (p_id, new_v, nw, os.day_of_week, os.role, os.position,
         os.title, os.intent, os.details, os.prescribed_distance,
         os.distance_unit, os.asks_rung_value, os.label)
      returning id into ns;

      insert into public.training_plan_components
        (plan_session_id, position, role, shape, distance, distance_unit,
         duration_seconds, repeat_count, pace_low_seconds, pace_high_seconds,
         rpe_low, rpe_high, recovery_kind, recovery_seconds,
         counts_toward_mark)
      select
        ns, position, role, shape, distance, distance_unit,
        duration_seconds, repeat_count, pace_low_seconds, pace_high_seconds,
        rpe_low, rpe_high, recovery_kind, recovery_seconds,
        counts_toward_mark
      from public.training_plan_components
      where plan_session_id = os.id
      order by position;
    end loop;
  end loop;

  update public.training_plans
     set question = 'How far can you carry your race-pace band before it comes apart?',
         updated_at = now()
   where id = p_id;

  update public.training_plan_sessions s
     set title = 'Threshold 3 × 10 min', label = 'Threshold',
         intent = 'Add threshold time without turning the session into a race.',
         details = null
    from public.training_plan_weeks w
   where s.plan_week_id=w.id and w.version_id=new_v and w.week_number=5 and s.day_of_week='THU';

  update public.training_plan_sessions s
     set title = 'VO₂ 5 × 3 min', label = 'Aerobic power',
         intent = 'One controlled higher-ceiling session between threshold steps.',
         details = null
    from public.training_plan_weeks w
   where s.plan_week_id=w.id and w.version_id=new_v and w.week_number=7 and s.day_of_week='THU';

  update public.training_plan_sessions s
     set title = 'Threshold 2 × 15 min', label = 'Threshold',
         intent = 'Keep the same threshold volume with fewer escapes.',
         details = null
    from public.training_plan_weeks w
   where s.plan_week_id=w.id and w.version_id=new_v and w.week_number=8 and s.day_of_week='THU';

  update public.training_plan_sessions s
     set title = 'Threshold 3 × 10 min', label = 'Threshold',
         intent = 'Re-establish the ceiling after the eight-mile ask.',
         details = null
    from public.training_plan_weeks w
   where s.plan_week_id=w.id and w.version_id=new_v and w.week_number=10 and s.day_of_week='THU';

  update public.training_plan_sessions s
     set title = 'Threshold 2 × 8 min', label = 'Threshold',
         intent = 'Touch the threshold ceiling while reducing the cost into the taper.',
         details = null
    from public.training_plan_weeks w
   where s.plan_week_id=w.id and w.version_id=new_v and w.week_number=13 and s.day_of_week='THU';

  delete from public.training_plan_components c
   using public.training_plan_sessions s, public.training_plan_weeks w
   where c.plan_session_id=s.id and s.plan_week_id=w.id
     and c.role='work' and w.version_id=new_v
     and w.week_number in (5,7,8,10,13) and s.day_of_week='THU';

  insert into public.training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, repeat_count,
     pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds,
     counts_toward_mark)
  select s.id, 2, 'work', 'repetitions', 600, 3, 375, null, 'easy', 180, false
    from public.training_plan_sessions s join public.training_plan_weeks w on w.id=s.plan_week_id
   where w.version_id=new_v and w.week_number=5 and s.day_of_week='THU';

  insert into public.training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, repeat_count,
     pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds,
     counts_toward_mark)
  select s.id, 2, 'work', 'repetitions', 180, 5, 350, 360, 'easy', 180, false
    from public.training_plan_sessions s join public.training_plan_weeks w on w.id=s.plan_week_id
   where w.version_id=new_v and w.week_number=7 and s.day_of_week='THU';

  insert into public.training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, repeat_count,
     pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds,
     counts_toward_mark)
  select s.id, 2, 'work', 'repetitions', 900, 2, 375, null, 'easy', 180, false
    from public.training_plan_sessions s join public.training_plan_weeks w on w.id=s.plan_week_id
   where w.version_id=new_v and w.week_number=8 and s.day_of_week='THU';

  insert into public.training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, repeat_count,
     pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds,
     counts_toward_mark)
  select s.id, 2, 'work', 'repetitions', 600, 3, 375, null, 'easy', 180, false
    from public.training_plan_sessions s join public.training_plan_weeks w on w.id=s.plan_week_id
   where w.version_id=new_v and w.week_number=10 and s.day_of_week='THU';

  insert into public.training_plan_components
    (plan_session_id, position, role, shape, duration_seconds, repeat_count,
     pace_low_seconds, pace_high_seconds, recovery_kind, recovery_seconds,
     counts_toward_mark)
  select s.id, 2, 'work', 'repetitions', 480, 2, 375, null, 'easy', 180, false
    from public.training_plan_sessions s join public.training_plan_weeks w on w.id=s.plan_week_id
   where w.version_id=new_v and w.week_number=13 and s.day_of_week='THU';

  insert into public.plan_publications
    (plan_id, plan_version_id, slug, starts_on, race_on, race_name,
     published_at, published_by)
  values
    (p_id, new_v, old_pub.slug, old_pub.starts_on, old_pub.race_on,
     old_pub.race_name, now(), old_pub.published_by);

  update public.plan_publications set revoked_at=now() where id=old_pub.id;
end $$;

-- Transactional proofs.
do $$
declare
  payload jsonb;
  live_count integer;
  week_count integer;
  threshold_count integer;
  vo2_count integer;
  changed_work_count integer;
begin
  select count(*) into live_count
    from public.plan_publications pub join public.training_plans p on p.id=pub.plan_id
   where p.slug='race-pace-durability' and pub.published_at is not null and pub.revoked_at is null;
  if live_count <> 1 then raise exception 'expected one live RPD publication, found %',live_count; end if;

  select public.public_plan('race-pace-durability') into payload;
  select jsonb_array_length(payload->'weeks') into week_count;
  if payload is null or week_count <> 15 then raise exception 'expected 15 public weeks, found %',week_count; end if;

  select count(*) into threshold_count
    from jsonb_array_elements(payload->'weeks') w, jsonb_array_elements(w->'sessions') s
   where (w->>'week_number')::int in (5,8,10,13) and s->>'day'='THU' and s->>'label'='Threshold';
  if threshold_count <> 4 then raise exception 'expected 4 threshold-spine sessions, found %',threshold_count; end if;

  select count(*) into vo2_count
    from jsonb_array_elements(payload->'weeks') w, jsonb_array_elements(w->'sessions') s
   where (w->>'week_number')::int=7 and s->>'day'='THU' and s->>'title'='VO₂ 5 × 3 min';
  if vo2_count <> 1 then raise exception 'expected W7 VO2 5x3, found %',vo2_count; end if;

  select count(*) into changed_work_count
    from public.training_plan_components c
    join public.training_plan_sessions s on s.id=c.plan_session_id
    join public.training_plan_weeks w on w.id=s.plan_week_id
    join public.plan_publications pub on pub.plan_version_id=w.version_id
    join public.training_plans p on p.id=pub.plan_id
   where p.slug='race-pace-durability' and pub.revoked_at is null
     and w.week_number in (5,7,8,10,13) and s.day_of_week='THU' and c.role='work';
  if changed_work_count <> 5 then raise exception 'expected exactly 5 changed Thursday work components, found %',changed_work_count; end if;
end $$;
