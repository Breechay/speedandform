-- Hope and José stop being two plans that agree.
--
-- Until now Race Pace Durability was a name on two independently authored
-- blocks. From Monday 7 September their future prescription comes from the plan
-- object, and every session they run points at the plan session it came from.
--
-- W1 and W2 are history and are not touched. They hold eight sessions and four
-- filed completions each, and the block they were run under is the block they
-- were run under. W3 onward holds zero filed completions — checked before
-- choosing this boundary — so nothing is orphaned by superseding it.
--
-- Marcus is untouched. His accidental appearance in the first ask migration was
-- the overly broad scope, and whether he runs this method is a coaching question
-- that a migration must not answer.
--
-- Easy-day placement is a recommendation, not a contract. The plan says where
-- the easy miles sit; an athlete moving them is not an override and must never
-- be recorded as one.

set local search_path = public, pg_temp;
select set_config('request.jwt.claims', '{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}', true);

do $$
declare
  v_plan uuid; v_ver uuid;
  a record; ck record; ps record; pw record; s record;
  v_wk uuid; v_new uuid; v_comps jsonb; v_mark uuid; v_base integer;
  moved integer := 0; withdrawn integer := 0; made integer := 0;
begin
  select p.id, v.id into v_plan, v_ver
    from training_plans p
    join training_plan_versions v on v.plan_id = p.id and v.version_number = 1
   where p.slug = 'race-pace-durability';

  -- ── 1 · the provisional asks are released ────────────────────────────────
  -- They point at sessions this migration withdraws, and one points at rung 10
  -- which is about to become 12. No ask has been answered, so nothing is lost.
  update planned_sessions set asks_checkpoint_id = null where asks_checkpoint_id is not null;

  for a in
    select ath.id, ath.slug, b.id block_id
      from athletes ath
      join training_blocks b on b.athlete_id = ath.id
                            and b.status = 'active'
                            and b.name = 'Race Pace Durability'
     where ath.slug in ('jose', 'hope')
     order by case ath.slug when 'jose' then 1 else 2 end
  loop
    select id into v_mark from athlete_marks
     where athlete_id = a.id and is_primary and active;

    -- ── 2 · the ladder ─────────────────────────────────────────────────────
    -- 10 was dropped from the method because 10 and 12 could not both be asked
    -- with absorption between them. It moves through the movement ledger rather
    -- than an UPDATE, so the change carries provenance like every other ruling.
    for ck in select id, state from mark_checkpoints
               where mark_id = v_mark and value = 10 and state <> 'reached'
    loop
      insert into mark_checkpoint_movements
        (athlete_id, mark_id, checkpoint_id, source, decision,
         previous_state, resulting_state, reason, moved_by)
      values (a.id, v_mark, ck.id, 'coach', 'replace', ck.state, ck.state,
        'Race Pace Durability v1 asks 5, 6, 8 and 12. Ten and twelve could not both be asked with an absorption week between them, so ten is replaced by twelve as the block''s closing question.',
        auth.uid());
      update mark_checkpoints set value = 12, label = '12 mi', moved_at = now(),
             source = 'coach', moved_by = auth.uid()
       where id = ck.id;
      moved := moved + 1;
    end loop;

    -- ── 3 · the assignment ─────────────────────────────────────────────────
    insert into plan_assignments
      (plan_id, plan_version_id, athlete_id, block_id, starts_at_plan_week, starts_on, notes, assigned_by)
    values (v_plan, v_ver, a.id, a.block_id, 3, date '2026-09-07',
      'Joined at W3. W1 and W2 were run under the block''s own authoring and stay as history.',
      auth.uid());
    update training_blocks set plan_id = v_plan, plan_version_id = v_ver where id = a.block_id;

    -- ── 4 · the old future prescription is superseded ──────────────────────
    for ps in
      -- aliased `old`, not `s`: `s` is a declared record here and PL/pgSQL
      -- resolves the name to the variable before the table.
      select old.id from planned_sessions old
        join training_weeks w on w.id = old.week_id
       where old.athlete_id = a.id and w.week_number >= 3 and old.state <> 'cancelled'
    loop
      perform withdraw_session(ps.id,
        'Superseded by the Race Pace Durability v1 assignment. This week now comes from the plan.');
      withdrawn := withdrawn + 1;
    end loop;

    -- ── 5 · and regenerated from the plan ──────────────────────────────────
    for pw in select * from training_plan_weeks
               where version_id = v_ver and week_number >= 3 order by week_number
    loop
      select id into v_wk from training_weeks
       where athlete_id = a.id and week_number = pw.week_number;

      -- (week_id, position) is unique and the withdrawn rows keep theirs — a
      -- superseded session is still a row. New days are numbered after them.
      select coalesce(max(position), 0) into v_base
        from planned_sessions where week_id = v_wk;

      for s in select * from training_plan_sessions
                where plan_week_id = pw.id order by position
      loop
        select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                 'role', c.role, 'shape', c.shape, 'position', c.position,
                 'distance', c.distance, 'distanceUnit', c.distance_unit,
                 'durationSeconds', c.duration_seconds,
                 'repeatCount', c.repeat_count,
                 'paceLowSeconds', c.pace_low_seconds,
                 'paceHighSeconds', c.pace_high_seconds,
                 'rpeLow', c.rpe_low, 'rpeHigh', c.rpe_high,
                 'recoveryKind', c.recovery_kind, 'recoverySeconds', c.recovery_seconds,
                 -- the plan's boolean resolves to THIS athlete's mark
                 'countsTowardMarkId', case when c.counts_toward_mark then v_mark end))
               order by c.position), '[]'::jsonb)
          into v_comps
          from training_plan_components c where c.plan_session_id = s.id;

        v_new := author_session(
          a.id, v_wk, s.day_of_week, s.title, s.intent,
          (select starts_on + (array_position(array['MON','TUE','WED','THU','FRI','SAT','SUN'], s.day_of_week) - 1)
             from training_weeks where id = v_wk),
          -- the plan orders days from zero; planned_sessions.position is 1-based
          (v_base + s.position + 1)::smallint, s.prescribed_distance, s.distance_unit,
          null, null, null, v_comps, s.details);

        update planned_sessions
           set plan_session_id = s.id, role = s.role,
               asks_checkpoint_id = (select id from mark_checkpoints
                                      where mark_id = v_mark and value = s.asks_rung_value)
         where id = v_new;
        made := made + 1;
      end loop;
    end loop;
  end loop;

  raise notice 'ladder movements %, withdrawn %, generated %', moved, withdrawn, made;
end $$;
