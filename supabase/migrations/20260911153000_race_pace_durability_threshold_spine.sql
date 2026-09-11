-- Race Pace Durability · revision after W3 evidence
--
-- The method is shared; pace is athlete-relative.
-- Public notation says "your race-pace band" / "your current threshold".
-- This migration changes the METHOD's Thursday ceiling progression without
-- rewriting an already-published Plan Version in place.
--
-- W1-W3 are history. From W5 forward the threshold spine becomes:
--   W3  2 × 10  (already completed in the study)
--   W5  3 × 10
--   W8  2 × 15
--   W10 3 × 10
--   W13 2 × 8   (taper touch)
-- W7 remains the controlled VO2 session. Major RP asks stay protected.
--
-- This cuts a new Plan Version and republishes the public METHOD only.
-- Existing athlete assignments remain pinned to the version they were assigned
-- against; moving an athlete to this revision is a separate coaching decision.

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

  -- If this exact revision already exists, leave it alone.
  select id into new_v
    from public.training_plan_versions
   where plan_id = p_id
     and summary = 'W3 evidence revision: athlete-relative public pace language; threshold spine 2x10 -> 3x10 -> 2x15 -> 3x10 -> 2x8.'
   limit 1;

  if new_v is not null then
    raise notice 'RPD threshold-spine revision already exists: %', new_v;
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
    'W3 evidence revision: athlete-relative public pace language; threshold spine 2x10 -> 3x10 -> 2x15 -> 3x10 -> 2x8.'
  )
  returning id into new_v;

  -- Clone the currently published version exactly before changing anything.
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

  -- The plan question is method-level, not athlete-number-level.
  update public.training_plans
     set question = 'How far can you carry your race-pace band before it comes apart?',
         updated_at = now()
   where id = p_id;

  -- W5 · 3 × 10 threshold
  update public.training_plan_sessions s
     set title = 'Threshold 3 × 10 min',
         label = 'Threshold',
         intent = 'Add threshold time without turning the session into a race.'
    from public.training_plan_weeks w
   where s.plan_week_id = w.id
     and w.version_id = new_v
     and w.week_number = 5
     and s.day_of_week = 'THU';

  update public.training_plan_components c
     set shape = 'repetitions', distance = null, distance_unit = 'mi',
         duration_seconds = 600, repeat_count = 3,
         pace_low_seconds = 375, pace_high_seconds = null,
         rpe_low = null, rpe_high = null,
         recovery_kind = 'easy', recovery_seconds = 180
    from public.training_plan_sessions s
    join public.training_plan_weeks w on w.id = s.plan_week_id
   where c.plan_session_id = s.id
     and c.role = 'work'
     and w.version_id = new_v
     and w.week_number = 5
     and s.day_of_week = 'THU';

  -- W8 · 2 × 15 threshold: same 30 minutes, fewer resets.
  update public.training_plan_sessions s
     set title = 'Threshold 2 × 15 min',
         label = 'Threshold',
         intent = 'Keep the same threshold volume with fewer escapes.'
    from public.training_plan_weeks w
   where s.plan_week_id = w.id
     and w.version_id = new_v
     and w.week_number = 8
     and s.day_of_week = 'THU';

  update public.training_plan_components c
     set shape = 'repetitions', distance = null, distance_unit = 'mi',
         duration_seconds = 900, repeat_count = 2,
         pace_low_seconds = 375, pace_high_seconds = null,
         rpe_low = null, rpe_high = null,
         recovery_kind = 'easy', recovery_seconds = 180
    from public.training_plan_sessions s
    join public.training_plan_weeks w on w.id = s.plan_week_id
   where c.plan_session_id = s.id
     and c.role = 'work'
     and w.version_id = new_v
     and w.week_number = 8
     and s.day_of_week = 'THU';

  -- W10 · replace hills with a threshold re-establishment after the W9 ask.
  update public.training_plan_sessions s
     set title = 'Threshold 3 × 10 min',
         label = 'Threshold',
         intent = 'Re-establish the ceiling after the eight-mile ask.'
    from public.training_plan_weeks w
   where s.plan_week_id = w.id
     and w.version_id = new_v
     and w.week_number = 10
     and s.day_of_week = 'THU';

  -- W10 used to be hills. Collapse whatever its work component shape was into
  -- the authored threshold repetition without touching warm-up/cool-down rows.
  update public.training_plan_components c
     set shape = 'repetitions', distance = null, distance_unit = 'mi',
         duration_seconds = 600, repeat_count = 3,
         pace_low_seconds = 375, pace_high_seconds = null,
         rpe_low = null, rpe_high = null,
         recovery_kind = 'easy', recovery_seconds = 180
    from public.training_plan_sessions s
    join public.training_plan_weeks w on w.id = s.plan_week_id
   where c.plan_session_id = s.id
     and c.role = 'work'
     and w.version_id = new_v
     and w.week_number = 10
     and s.day_of_week = 'THU';

  -- W13 remains 2 × 8, now explicitly the taper touch of the same spine.
  update public.training_plan_sessions s
     set intent = 'Touch the threshold ceiling while reducing the cost into the taper.'
    from public.training_plan_weeks w
   where s.plan_week_id = w.id
     and w.version_id = new_v
     and w.week_number = 13
     and s.day_of_week = 'THU';

  -- Publish the new method version on the same dates, then retire the previous
  -- public projection. Athlete assignments are intentionally untouched.
  insert into public.plan_publications
    (plan_id, plan_version_id, slug, starts_on, race_on, race_name,
     published_at, published_by)
  values
    (p_id, new_v, old_pub.slug, old_pub.starts_on, old_pub.race_on,
     old_pub.race_name, now(), old_pub.published_by);

  update public.plan_publications
     set revoked_at = now()
   where id = old_pub.id;

  raise notice 'RPD Plan Version % published from prior version %', next_version, old_v;
end $$;

-- Proofs: one live publication, fifteen weeks, and the new Thursday spine.
do $$
declare
  payload jsonb;
  live_count integer;
  spine_count integer;
begin
  select count(*) into live_count
    from public.plan_publications pub
    join public.training_plans p on p.id = pub.plan_id
   where p.slug = 'race-pace-durability'
     and pub.published_at is not null
     and pub.revoked_at is null;

  if live_count <> 1 then
    raise exception 'expected exactly one live RPD publication, found %', live_count;
  end if;

  select public.public_plan('race-pace-durability') into payload;
  if payload is null or jsonb_array_length(payload->'weeks') <> 15 then
    raise exception 'RPD public payload did not return fifteen weeks';
  end if;

  select count(*) into spine_count
    from jsonb_array_elements(payload->'weeks') w,
         jsonb_array_elements(w->'sessions') s
   where (w->>'week_number')::int in (5,8,10,13)
     and s->>'day' = 'THU'
     and s->>'label' = 'Threshold';

  if spine_count <> 4 then
    raise exception 'threshold spine did not publish cleanly; found % expected 4', spine_count;
  end if;
end $$;
