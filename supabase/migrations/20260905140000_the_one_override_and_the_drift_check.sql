-- The only place Hope differs from the plan, and the instrument that proves it.
--
-- Hope's race-week Tuesday carries her own instruction. On 25 August she ran
-- three of four reps under her band, and race week is where that costs the most,
-- so hers says settle rather than touch. That is a coaching decision about one
-- athlete with a cause behind it, which is exactly what an override is.
--
-- Her missing W15 Friday is NOT one. The only record of it was a sentence in a
-- migration header; no decision row, no reason, and an absent session cannot
-- carry provenance. Easy-day placement is a recommendation — the plan says where
-- the easy miles sit and the athlete may move them — so it is not an override
-- even when a coach suggests moving them. She gets the canonical Friday.

set local search_path = public, pg_temp;
select set_config('request.jwt.claims', '{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}', true);

do $$
declare v_session uuid; v_ver uuid;
begin
  select ps.id into v_session
    from planned_sessions ps
    join athletes a on a.id = ps.athlete_id and a.slug = 'hope'
    join training_weeks w on w.id = ps.week_id and w.week_number = 15
    join training_plan_sessions pls on pls.id = ps.plan_session_id
   where ps.state <> 'cancelled' and pls.day_of_week = 'TUE';
  if v_session is null then raise exception 'Hope has no race-week Tuesday to override'; end if;

  -- All eleven arguments, positionally, and change_reason comes BEFORE components
  -- — passing them the other way round puts a sentence where jsonb belongs.
  -- Everything except the intent is read from the current version and passed
  -- through, so this revision changes one thing and says so.
  select write_session_version(
    v_session,
    cur.title,
    'Settle at 6:45. Do not chase faster. Finish wanting another rep.',
    cur.prescribed_distance, cur.distance_unit, cur.prescribed_duration_minutes,
    cur.rpe_low, cur.rpe_high,
    'Athlete-specific: on 25 August she ran three of four reps under her band, and race week is where that costs the most.',
    cur.components,
    cur.details)
    into v_ver
    from (
      select v.title, v.prescribed_distance, v.distance_unit, v.prescribed_duration_minutes,
             v.rpe_low, v.rpe_high, v.details,
             coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
               'role', c.role, 'shape', c.shape, 'position', c.position,
               'distance', c.distance, 'distanceUnit', c.distance_unit,
               'durationSeconds', c.duration_seconds, 'repeatCount', c.repeat_count,
               'paceLowSeconds', c.pace_low_seconds, 'paceHighSeconds', c.pace_high_seconds,
               'rpeLow', c.rpe_low, 'rpeHigh', c.rpe_high,
               'recoveryKind', c.recovery_kind, 'recoverySeconds', c.recovery_seconds,
               'countsTowardMarkId', c.counts_toward_mark_id))
               order by c.position) filter (where c.id is not null), '[]'::jsonb) components
        from planned_session_versions v
        left join planned_session_components c on c.version_id = v.id
       where v.planned_session_id = v_session
         and v.version_number = (select max(v2.version_number) from planned_session_versions v2
                                  where v2.planned_session_id = v_session)
       group by v.title, v.prescribed_distance, v.distance_unit, v.prescribed_duration_minutes,
                v.rpe_low, v.rpe_high, v.details) cur;

  update planned_sessions
     set override_reason = 'Her own instruction for race-week race pace. On 25 August she ran three of four reps under her band; hers says settle where José''s says touch.'
   where id = v_session;
end $$;

-- ── the instrument that makes this one source rather than two copies ────────
--
-- Without it, an inherited row and its plan session can drift apart silently and
-- nobody finds out until an athlete runs the wrong session. With it, divergence
-- is a row in a view, and every row must be either an override or a bug.

create or replace view public.assignment_drift as
select a.slug athlete, w.week_number, pls.day_of_week, ps.id session_id,
       ps.override_reason,
       v.title, pls.title plan_title,
       v.prescribed_distance, pls.prescribed_distance plan_distance,
       v.intent, pls.intent plan_intent
  from planned_sessions ps
  join athletes a on a.id = ps.athlete_id
  join training_weeks w on w.id = ps.week_id
  join training_plan_sessions pls on pls.id = ps.plan_session_id
  join planned_session_versions v on v.planned_session_id = ps.id
   and v.version_number = (select max(v2.version_number) from planned_session_versions v2
                            where v2.planned_session_id = ps.id)
 where ps.state <> 'cancelled'
   and ps.override_reason is null
   and (v.title is distinct from pls.title
     or v.prescribed_distance is distinct from pls.prescribed_distance
     or v.intent is distinct from pls.intent);

comment on view public.assignment_drift is
  'Inherited sessions that no longer match the plan session they came from. Every row is either an override missing its reason, or a bug. An empty view is the claim that the plan is the source of truth, made checkable.';

grant select on public.assignment_drift to authenticated;

-- ── what must be true now ───────────────────────────────────────────────────
do $$
declare n integer; jose_t numeric[]; hope_t numeric[]; asks numeric[];
begin
  select count(*) into n from public.assignment_drift;
  if n <> 0 then raise exception '% inherited sessions have drifted from the plan', n; end if;

  -- W1 and W2 are history: nothing there may point at a plan.
  select count(*) into n from planned_sessions ps
    join training_weeks w on w.id = ps.week_id
   where w.week_number < 3 and ps.plan_session_id is not null;
  if n <> 0 then raise exception 'history was linked to the plan'; end if;

  -- Every live W3+ session is an instance of a plan session.
  select count(*) into n from planned_sessions ps
    join training_weeks w on w.id = ps.week_id
    join training_blocks b on b.id = w.block_id and b.name = 'Race Pace Durability'
   where w.week_number >= 3 and ps.state <> 'cancelled' and ps.plan_session_id is null;
  if n <> 0 then raise exception '% live future sessions are not linked to the plan', n; end if;

  -- Marcus is untouched.
  select count(*) into n from planned_sessions ps
    join athletes a on a.id = ps.athlete_id and a.slug = 'marcus'
   where ps.plan_session_id is not null or ps.asks_checkpoint_id is not null
      or ps.override_reason is not null;
  if n <> 0 then raise exception 'Marcus was modified'; end if;

  -- Four asks each, at 5, 6, 8 and 12.
  select array_agg(ck.value order by ck.value) into asks
    from planned_sessions ps
    join athletes a on a.id = ps.athlete_id and a.slug = 'jose'
    join mark_checkpoints ck on ck.id = ps.asks_checkpoint_id
   where ps.state <> 'cancelled';
  if asks is distinct from array[5,6,8,12]::numeric[] then
    raise exception 'José asks %, expected 5,6,8,12', asks; end if;

  -- Exactly one override, and it is Hope's race-week Tuesday.
  select count(*) into n from planned_sessions
   where override_reason is not null and state <> 'cancelled';
  if n <> 1 then raise exception 'expected exactly one override, found %', n; end if;

  raise notice 'assignment clean: no drift, history intact, Marcus untouched, one override';
end $$;
