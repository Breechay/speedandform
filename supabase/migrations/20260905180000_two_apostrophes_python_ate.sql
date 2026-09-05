-- Two apostrophes, lost between Python and SQL.
--
-- The canonical plan was generated rather than typed, which caught every
-- arithmetic error and introduced a typographic one: in Python, 'the block''s'
-- is not an escaped apostrophe, it is two adjacent strings concatenated. So
-- "the block's closing statement" became "the blocks closing statement", in the
-- plan and in both athletes' copies of it.
--
-- The plan is the source and has no history, so it is corrected in place. The
-- athletes' copies are published prescriptions and the append-only trigger
-- refused a direct update — correctly. They go through write_session_version
-- like any other change, and the ledger says what it was for. A typo is a poor
-- reason to open a hole in append-only.

set local search_path = public, pg_temp;
select set_config('request.jwt.claims', '{"sub":"79d1520c-7c7c-4cd2-bd31-229a3cc56158"}', true);

update public.training_plan_sessions
   set intent = replace(replace(intent, 'the blocks ', 'the block''s '),
                        'The blocks ', 'The block''s ')
 where intent like '%he blocks %';

do $$
declare r record; fixed integer := 0;
begin
  for r in
    select ps.id,
           v.title, v.prescribed_distance, v.distance_unit, v.prescribed_duration_minutes,
           v.rpe_low, v.rpe_high, v.details,
           replace(replace(v.intent, 'the blocks ', 'the block''s '),
                   'The blocks ', 'The block''s ') as intent,
           coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
             'role', c.role, 'shape', c.shape, 'position', c.position,
             'distance', c.distance, 'distanceUnit', c.distance_unit,
             'durationSeconds', c.duration_seconds, 'repeatCount', c.repeat_count,
             'paceLowSeconds', c.pace_low_seconds, 'paceHighSeconds', c.pace_high_seconds,
             'rpeLow', c.rpe_low, 'rpeHigh', c.rpe_high,
             'recoveryKind', c.recovery_kind, 'recoverySeconds', c.recovery_seconds,
             'countsTowardMarkId', c.counts_toward_mark_id))
             order by c.position) filter (where c.id is not null), '[]'::jsonb) as components
      from planned_sessions ps
      join planned_session_versions v on v.planned_session_id = ps.id
       and v.version_number = (select max(v2.version_number) from planned_session_versions v2
                                where v2.planned_session_id = ps.id)
      left join planned_session_components c on c.version_id = v.id
     where ps.state <> 'cancelled' and v.intent like '%he blocks %'
     group by ps.id, v.title, v.prescribed_distance, v.distance_unit,
              v.prescribed_duration_minutes, v.rpe_low, v.rpe_high, v.details, v.intent
  loop
    perform write_session_version(
      r.id, r.title, r.intent, r.prescribed_distance, r.distance_unit,
      r.prescribed_duration_minutes, r.rpe_low, r.rpe_high,
      'Typographic correction: an apostrophe lost when the plan was generated. The prescription is unchanged.',
      r.components, r.details);
    fixed := fixed + 1;
  end loop;
  raise notice 'revised % session(s) for punctuation', fixed;
end $$;

do $$
declare n integer;
begin
  select count(*) into n from public.training_plan_sessions where intent like '%he blocks %';
  if n <> 0 then raise exception '% plan sessions still say "the blocks"', n; end if;

  select count(*) into n from public.planned_session_versions v
   join public.planned_sessions ps on ps.id = v.planned_session_id
   where ps.state <> 'cancelled' and v.intent like '%he blocks %'
     and v.version_number = (select max(v2.version_number) from public.planned_session_versions v2
                              where v2.planned_session_id = ps.id);
  if n <> 0 then raise exception '% current athlete versions still say "the blocks"', n; end if;

  -- History is intact: the old wording survives on the superseded versions.
  select count(*) into n from public.planned_session_versions where intent like '%he blocks %';
  if n = 0 then raise exception 'the earlier versions were rewritten rather than superseded'; end if;

  select count(*) into n from public.assignment_drift;
  if n <> 0 then raise exception 'fixing the copy put % sessions out of step with the plan', n; end if;
end $$;
