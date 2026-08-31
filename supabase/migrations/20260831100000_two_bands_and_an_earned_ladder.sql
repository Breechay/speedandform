-- Two bands, and a ladder where every rung is earned by the one before it.
--
-- GOAL PACE is derived from the goal clock and never authored. PRESCRIBED BAND is
-- what Brice wrote and it stands: 6:30-6:45 against a 6:52 goal is deliberately
-- fast, a buffer, and the screen was implying the two were the same number.
-- Ownership measures against the prescribed band, which makes it conservative on
-- purpose -- a mile owned at 6:30 is worth more than a mile at goal pace.
--
-- Nothing re-derives the authored band. An earlier instruction to move it to
-- 6:45-6:52 was withdrawn.

alter table public.athletes
  add column if not exists goal_seconds integer,
  add column if not exists goal_pace_seconds integer;

comment on column public.athletes.goal_pace_seconds is
  'Derived from the goal clock over the target distance. Never authored and never editable: it is arithmetic, and an editable derivation is a second opinion waiting to disagree with the first.';

update public.athletes
   set goal_seconds = case
         when goal_label ~* 'sub-?1:(\d\d)' then 3600 + (regexp_match(goal_label, 'sub-?1:(\d\d)', 'i'))[1]::integer * 60
         else null end
 where goal_seconds is null;

update public.athletes
   set goal_pace_seconds = round(goal_seconds / 13.1094)
 where goal_seconds is not null and target_event ~* 'half';

-- ── Two CARRY sessions, so 6 -> 8 and 8 -> 10 are earned ────────────────────
--
-- W7 and W11 repeated a reach the athlete had already made. Repeating six taught
-- nothing the first six didn't. Broken race-pace work at the same band carries the
-- volume that makes the next reach lawful, which is what CARRY is for.
--
-- Forward only. W1 and W2 are untouched.
do $$
declare
  target record;
  latest record;
  new_version uuid;
  spec record;
begin
  for spec in
    select * from (values
      (7,  2, 4.00, '2 x 4 mi at race pace'),
      (11, 2, 5.00, '2 x 5 mi at race pace')
    ) as t(week_no, reps, each_mi, title)
  loop
    for target in
      select ps.id, ps.athlete_id
        from public.planned_sessions ps
        join public.athletes a on a.id = ps.athlete_id
        join public.training_weeks w on w.id = ps.week_id
        join public.training_blocks b on b.id = w.block_id and b.status = 'active'
        join lateral (select * from public.planned_session_versions pv
                       where pv.planned_session_id = ps.id
                       order by version_number desc limit 1) v on true
        join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
       where a.slug in ('hope','jose','marcus')
         and w.week_number = spec.week_no
         and k.shape = 'continuous'
         and k.pace_low_seconds is not null
    loop
      select * into latest from public.planned_session_versions
       where planned_session_id = target.id order by version_number desc limit 1;

      -- The version carries the band too: a guard already holds the work component
      -- to its own version's authored band, and it is right to. A component whose
      -- band disagrees with the version above it is two prescriptions in one row.
      insert into public.planned_session_versions
        (athlete_id, planned_session_id, version_number, title, prescribed_distance,
         distance_unit, intent, details, change_reason, authored_by,
         pace_low, pace_high)
      values (target.athlete_id, target.id, latest.version_number + 1, spec.title,
              spec.reps * spec.each_mi, 'mi', latest.intent,
              'Broken at the same band. The float resets what is being measured, so this carries volume and does not attempt a reach.',
              'Replaced a repeat of a reach already made. Repeating a distance teaches nothing the first attempt did not; this carries the race-pace volume that makes the next reach lawful.',
              latest.authored_by, latest.pace_low, latest.pace_high)
      returning id into new_version;

      insert into public.planned_session_components
        (athlete_id, version_id, position, role, shape, repeat_count, distance, distance_unit,
         pace_low, pace_high, pace_low_seconds, pace_high_seconds,
         recovery_seconds, recovery_kind, rpe_low, rpe_high, rpe_source)
      select target.athlete_id, new_version, 1, 'work', 'repetitions', spec.reps, spec.each_mi, 'mi',
             k.pace_low, k.pace_high, k.pace_low_seconds, k.pace_high_seconds,
             180, 'float', k.rpe_low, k.rpe_high, k.rpe_source
        from public.planned_session_components k
       where k.version_id = latest.id and k.role = 'work';
    end loop;
  end loop;
end $$;

-- ── Marcus: the rungs sit one week earlier than race day warrants ───────────
--
-- His W1 is already blank, but every rung is one week further from Dec 13 than
-- Hope's is from Dec 5 -- his ten-mile reach lands four weeks out against her
-- three. Reaches are placed relative to race day, so his sessions move one week
-- later and the spare week lands at the front as base. No rung added, none
-- repeated, and the back half becomes identical in distance-to-race.
do $$
declare
  moved record;
  marcus uuid;
  parked integer := 1000;
begin
  select id into marcus from public.athletes where slug = 'marcus';

  -- (week_id, position) is unique and every destination week is already occupied,
  -- so shifting in place trips the constraint on the first week that already holds
  -- a session at that seat -- which is most of them. Park every position somewhere
  -- nothing can collide, move, then renumber from the dates.
  --
  -- Parked HIGH, not negative: position also carries a check that it is positive,
  -- and a parking space that violates a constraint is not a parking space.
  for moved in select id from public.planned_sessions where athlete_id = marcus order by id
  loop
    update public.planned_sessions set position = parked where id = moved.id;
    parked := parked + 1;
  end loop;

  for moved in
    select ps.id, ps.scheduled_on, ps.day_label, w.week_number,
           (select w2.id from public.training_weeks w2
             join public.training_blocks b2 on b2.id = w2.block_id and b2.status='active'
            where w2.athlete_id = marcus and w2.week_number = w.week_number + 1) as next_week
      from public.planned_sessions ps
      join public.training_weeks w on w.id = ps.week_id
      join public.training_blocks b on b.id = w.block_id and b.status = 'active'
     where ps.athlete_id = marcus
     order by w.week_number desc, ps.scheduled_on desc
  loop
    continue when moved.next_week is null;

    insert into public.planned_session_moves
      (athlete_id, planned_session_id, from_date, to_date, from_day_label, to_day_label,
       athlete_reason, coach_decision)
    values (marcus, moved.id, moved.scheduled_on, moved.scheduled_on + 7,
            moved.day_label, moved.day_label, null,
            'Marcus races a week later than Hope and Jose. Rungs are placed relative to race day, so the campaign shifts one week and the spare week becomes base at the front.');

    update public.planned_sessions
       set week_id = moved.next_week,
           scheduled_on = scheduled_on + 7,
           updated_at = now()
     where id = moved.id;
  end loop;

  -- Position is the order inside the week, so it is rebuilt from the dates rather
  -- than carried across the move.
  for moved in
    select ps.id, row_number() over (partition by ps.week_id order by ps.scheduled_on, ps.id) as seat
      from public.planned_sessions ps where ps.athlete_id = marcus
  loop
    update public.planned_sessions set position = moved.seat where id = moved.id;
  end loop;
end $$;

do $$
declare bad integer;
begin
  select count(*) into bad from public.athletes
   where slug in ('hope','jose','marcus') and goal_pace_seconds is distinct from 412;
  if bad > 0 then raise exception '% athletes did not derive a 6:52 goal pace', bad; end if;
end $$;
