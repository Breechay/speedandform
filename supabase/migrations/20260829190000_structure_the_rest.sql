-- The rest of the program, structured only as far as an authored source allows.
--
-- An earlier draft of this migration read the shape line and encoded threshold as
-- 4 x 1 mi with 90 seconds easy, and speed as 8 x 400 m with equal recovery. That
-- was prose turned into doctrine at migration time, which is the same mistake as
-- parsing it at runtime with a longer delay before anyone notices. It is removed.
--
-- What stays is what a typed authored column already says. Easy, long run and
-- race week are continuous work at prescribed_distance, a column Brice authored
-- directly. No warm up or cool down is invented for them, because none was ever
-- written down.
--
-- Threshold and speed get schema support and no components. FORM-iOS authors its
-- own threshold and speed sessions, but not the per week variants this block uses
-- (4 x 1, 5 x 1 and 6 x 1 across different weeks), so mapping them would be a
-- choice rather than a reading. They stay unauthored until Brice types them, and
-- the console shows them honestly without a dose.

-- A speed session recovers for as long as the repetition took. That is a real
-- instruction and it is not a number of seconds, so the kind carries it.
alter table public.planned_session_components
  drop constraint planned_session_components_recovery_kind_check;
alter table public.planned_session_components
  add constraint planned_session_components_recovery_kind_check
  check (recovery_kind in ('float', 'easy', 'jog', 'standing', 'equal'));

alter table public.planned_session_components
  drop constraint components_recovery_is_named;
alter table public.planned_session_components
  add constraint components_recovery_is_named check (
    -- equal means "as long as the repetition", so it carries no second count.
    (recovery_kind = 'equal' and recovery_seconds is null)
    or (recovery_seconds is null and recovery_kind is null)
    or (recovery_seconds is not null and recovery_kind is not null));

alter table public.planned_session_components
  drop constraint components_recovery_needs_repetitions;
alter table public.planned_session_components
  add constraint components_recovery_needs_repetitions check (
    (recovery_seconds is null and recovery_kind is null) or shape = 'repetitions');

do $$
declare
  r record;
  v_id uuid;
  a_id uuid;
  pos smallint;
begin
  for r in
    select * from (values
      -- title match, warm up sec, shape, reps, distance, unit, recovery sec,
      -- recovery kind, pace low, pace high, cool down sec. RPE is not listed:
      -- it is read from the version's own authored rpe_low and rpe_high.
      ('Easy',       null, 'continuous', null, null, null, null, null,  null, null, 4, 5, null),
      ('Easy week',  null, 'continuous', null, null, null, null, null,  null, null, 4, 5, null),
      ('Long run',   null, 'continuous', null, null, null, null, null,  null, null, 5, 6, null),
      ('Race week',  null, 'continuous', null, null, null, null, null,  null, null, 4, 5, null)
    ) as t(match, wu, shp, reps, dist, unit, rec, reck, plo, phi, rlo, rhi, cd)
    -- rlo and rhi remain in the tuple shape but are unused for continuous work.
  loop
    for v_id, a_id in
      select v.id, v.athlete_id
        from public.planned_session_versions v
        join public.planned_sessions ps on ps.id = v.planned_session_id
        join public.athletes a on a.id = ps.athlete_id
       where a.slug in ('hope', 'jose', 'marcus')
         and v.title = r.match
         and not exists (select 1 from public.planned_session_components c where c.version_id = v.id)
    loop
      pos := 1;
      if r.wu is not null then
        insert into public.planned_session_components
          (athlete_id, version_id, position, role, shape, duration_seconds, rpe_low, rpe_high)
        values (a_id, v_id, pos, 'warm_up', 'continuous', r.wu, 4, 5);
        pos := pos + 1;
      end if;

      -- Repetition work carries its own dose. Continuous work is the whole
      -- prescribed distance, which is the only number the plan actually stated.
      if r.shp = 'repetitions' then
        insert into public.planned_session_components
          (athlete_id, version_id, position, role, shape, repeat_count, distance, distance_unit,
           recovery_seconds, recovery_kind, pace_low, pace_high, rpe_low, rpe_high)
        values (a_id, v_id, pos, 'work', 'repetitions', r.reps, r.dist, r.unit,
                r.rec, r.reck, r.plo, r.phi, r.rlo, r.rhi);
      else
        insert into public.planned_session_components
          (athlete_id, version_id, position, role, shape, distance, distance_unit, rpe_low, rpe_high)
        select a_id, v_id, pos, 'work', 'continuous', v.prescribed_distance, 'mi', v.rpe_low, v.rpe_high
          from public.planned_session_versions v where v.id = v_id and v.prescribed_distance is not null;
      end if;
      pos := pos + 1;

      if r.cd is not null then
        insert into public.planned_session_components
          (athlete_id, version_id, position, role, shape, duration_seconds, rpe_low, rpe_high)
        values (a_id, v_id, pos, 'cool_down', 'continuous', r.cd, 4, 5);
      end if;
    end loop;
  end loop;
end $$;

do $$
declare bad integer; total integer;
begin
  -- Threshold and speed are deliberately unauthored. Prove that the sessions
  -- without a dose are only those, so a silent gap somewhere else fails here.
  select count(*) into bad
    from public.planned_session_versions v
    join public.planned_sessions ps on ps.id = v.planned_session_id
    join public.athletes a on a.id = ps.athlete_id
   where a.slug in ('hope', 'jose', 'marcus')
     and v.title not in ('Threshold', 'Speed')
     and not exists (select 1 from public.planned_session_components c where c.version_id = v.id);
  if bad > 0 then raise exception '% sessions outside threshold and speed have no dose', bad; end if;

  -- Every session has exactly one work component, because two would make the
  -- proof-bearing dose ambiguous.
  select count(*) into bad from (
    select version_id from public.planned_session_components
     where role = 'work' group by version_id having count(*) <> 1) as t;
  if bad > 0 then raise exception '% versions do not have exactly one work component', bad; end if;

  -- Continuous work still equals the distance the plan prescribed.
  select count(*) into bad
    from public.planned_session_components c
    join public.planned_session_versions v on v.id = c.version_id
   where c.role = 'work' and c.shape = 'continuous'
     and v.prescribed_distance is not null and c.distance <> v.prescribed_distance;
  if bad > 0 then raise exception '% continuous doses disagree with the plan', bad; end if;

  -- Components are ordered from one with no gaps.
  select count(*) into bad from (
    select version_id from public.planned_session_components
     group by version_id
    having min(position) <> 1 or max(position) <> count(*)) as t;
  if bad > 0 then raise exception '% versions have a broken component order', bad; end if;

  select count(*) into total from public.planned_session_components;
  raise notice 'structured components: %', total;
end $$;
