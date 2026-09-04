-- Eligibility is authored, never inferred.
--
-- `athlete_continuous_owned` answered "what is the longest continuous piece this
-- athlete has ever run inside any two-sided pace band", and every surface read
-- it as "what has this athlete established against their coaching question".
-- Those are different statements, and for José and Hope they happened to
-- coincide because their active experiment IS a continuous race-pace distance
-- question.
--
-- Simon proved they are not the same. One filing on 4 September — a threshold
-- rep, 1.66 miles uninterrupted at 6:02 inside a 6:00–6:08 band — put him in the
-- view at 1.66 continuous miles owned. He has no mark and no checkpoints. His
-- question is duration and economy at threshold; distance ownership is not even
-- his instrument. The number was arithmetically true and semantically meaningless.
--
-- Every heuristic that could replace it is the same mistake with better manners:
-- pace bounds, session titles, component shapes, whether a band has an upper
-- bound, what kind of athlete this is. All of them guess at intention from
-- structure. So the model stops guessing.
--
--     component  →  eligibility  →  filed evidence  →  established value
--
-- ELIGIBILITY IS NOT ESTABLISHMENT. `counts_toward_mark_id` says "evidence from
-- this component is allowed to answer this mark". It does not say the component
-- established anything; that only becomes true when a filed piece qualifies.
-- The distinction is what lets one evidence system serve completely different
-- questions — Simon's duration, Natalie's continuous running, a strength
-- athlete's capacity — without any of them contaminating the others.

-- ── 1 · the link ────────────────────────────────────────────────────────────

alter table public.planned_session_components
  add column if not exists counts_toward_mark_id uuid
    references public.athlete_marks(id) on delete set null;

create index if not exists components_counts_toward_mark_idx
  on public.planned_session_components (counts_toward_mark_id)
  where counts_toward_mark_id is not null;

comment on column public.planned_session_components.counts_toward_mark_id is
  'Which mark evidence from this component is allowed to answer. Authored, never inferred: a component may carry a pace band and count toward nothing. Eligibility, not establishment — a component establishes nothing until a filed piece qualifies against it.';

-- Component grain, and that is the whole point. W12 Saturday is twelve easy
-- miles and four at race pace in one session; only the four can establish
-- anything, and `planned_sessions.establishes_checkpoint_id` cannot say that.
-- It keeps its own meaning — this session is the one aiming at that rung — which
-- is a coaching intention rather than an eligibility test. Both survive.

-- ── 2 · a revision must not silently drop it ────────────────────────────────
--
-- Components belong to versions. Neither branch of write_session_version carried
-- this column, so the first revise of an eligible session would have quietly
-- un-eligible it and nobody would see the number move until a rung failed to
-- land. Carried on the copy-forward path, and accepted on the wire.

create or replace function public.component_wire_keys()
returns table (key text, kind text)
language sql immutable
as $$
  values
    ('role',                'canonical'),
    ('shape',               'canonical'),
    ('repeatCount',         'canonical'),
    ('distance',            'canonical'),
    ('distanceUnit',        'canonical'),
    ('durationSeconds',     'canonical'),
    ('recoverySeconds',     'canonical'),
    ('recoveryKind',        'canonical'),
    ('paceLowSeconds',      'canonical'),
    ('paceHighSeconds',     'canonical'),
    ('rpeLow',              'canonical'),
    ('rpeHigh',             'canonical'),
    ('rpeSource',           'canonical'),
    ('rpeDefaultVersion',   'carried'),
    ('repeatMinimum',       'carried'),
    ('repeatTarget',        'carried'),
    ('repeatProgression',   'carried'),
    ('repeatCeiling',       'carried'),
    ('position',            'carried'),
    ('countsTowardMarkId',  'carried');
$$;
create or replace function public.write_session_version(
  p_planned_session_id uuid, p_title text, p_intent text, p_prescribed_distance numeric,
  p_distance_unit text, p_prescribed_duration_minutes integer, p_rpe_low smallint,
  p_rpe_high smallint, p_change_reason text, p_components jsonb, p_details text
) returns uuid
language plpgsql security definer set search_path = public, pg_temp
as $fn$
declare
  owner_id uuid;
  previous_id uuid;
  previous_intent text;
  effective_intent text;
  next_number integer;
  created_id uuid;
  bad text;
begin
  select athlete_id into owner_id from public.planned_sessions where id = p_planned_session_id;
  if owner_id is null then raise exception 'no such session'; end if;
  if not public.is_coach_member(owner_id) then
    raise exception 'only a coach on this athlete may author their work';
  end if;
  if coalesce(btrim(p_title), '') = '' then raise exception 'a session needs a title'; end if;

  select id, intent, version_number + 1 into previous_id, previous_intent, next_number
    from public.planned_session_versions
   where planned_session_id = p_planned_session_id
   order by version_number desc limit 1;
  next_number := coalesce(next_number, 1);

  -- Blank means unchanged. A revision carries the previous sentence forward, and
  -- where there never was one it stays silent rather than inventing prose to get
  -- past a validation. Authoring is the moment a session has to say why it
  -- exists, and that requirement stays exactly where it was.
  effective_intent := coalesce(nullif(btrim(p_intent), ''), previous_intent);
  if next_number = 1 and coalesce(btrim(effective_intent), '') = '' then
    raise exception 'a session needs an intent. It is the part that reaches them.';
  end if;

  if next_number > 1 and coalesce(btrim(p_change_reason), '') = '' then
    raise exception 'a revision needs a reason. It is the part that is still legible in six weeks.';
  end if;

  if p_components is not null then
    if jsonb_typeof(p_components) <> 'array' then
      raise exception 'components must be an array';
    end if;
    if exists (select 1 from jsonb_array_elements(p_components) as part
                where part ? 'paceLow' or part ? 'paceHigh') then
      raise exception 'pace travels in seconds. Send paceLowSeconds and paceHighSeconds.';
    end if;
    select string_agg(k, ', ') into bad
      from (select distinct jsonb_object_keys(part) as k
              from jsonb_array_elements(p_components) as part) candidate
     where k not in (select key from public.component_wire_keys());
    if bad is not null then
      raise exception 'unknown component key(s): %. The accepted set is component_wire_keys().', bad;
    end if;
  end if;

  insert into public.planned_session_versions (
    athlete_id, planned_session_id, version_number, title,
    prescribed_distance, distance_unit, prescribed_duration_minutes,
    intent, details, change_reason, rpe_low, rpe_high, authored_by
  ) values (
    owner_id, p_planned_session_id, next_number, btrim(p_title),
    p_prescribed_distance,
    case when p_prescribed_distance is null then null else coalesce(p_distance_unit, 'mi') end,
    p_prescribed_duration_minutes,
    effective_intent, nullif(btrim(coalesce(p_details, '')), ''),
    nullif(btrim(coalesce(p_change_reason, '')), ''), p_rpe_low, p_rpe_high, auth.uid()
  ) returning id into created_id;

  if p_components is null then
    -- Carried forward, not restated. The previous version's anatomy is the
    -- anatomy until someone says otherwise.
    insert into public.planned_session_components (
      athlete_id, version_id, position, role, shape, repeat_count,
      distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
      pace_low, pace_high, pace_low_seconds, pace_high_seconds,
      rpe_low, rpe_high, rpe_source, rpe_default_version,
      repeat_minimum, repeat_target, repeat_progression, repeat_ceiling,
      counts_toward_mark_id
    )
    select athlete_id, created_id, position, role, shape, repeat_count,
           distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
           pace_low, pace_high, pace_low_seconds, pace_high_seconds,
           rpe_low, rpe_high, rpe_source, rpe_default_version,
           repeat_minimum, repeat_target, repeat_progression, repeat_ceiling,
           counts_toward_mark_id
      from public.planned_session_components
     where version_id = previous_id;
  else
    insert into public.planned_session_components (
      athlete_id, version_id, position, role, shape, repeat_count,
      distance, distance_unit, duration_seconds, recovery_seconds, recovery_kind,
      pace_low, pace_high, pace_low_seconds, pace_high_seconds,
      rpe_low, rpe_high, rpe_source, rpe_default_version,
      repeat_minimum, repeat_target, repeat_progression, repeat_ceiling,
      counts_toward_mark_id
    )
    select
      owner_id, created_id, ordinality::smallint,
      part->>'role',
      part->>'shape',
      (part->>'repeatCount')::smallint,
      (part->>'distance')::numeric,
      case when part->>'distance' is null then null else coalesce(part->>'distanceUnit', 'mi') end,
      (part->>'durationSeconds')::integer,
      (part->>'recoverySeconds')::integer,
      part->>'recoveryKind',
      public.clock_from_seconds((part->>'paceLowSeconds')::integer),
      public.clock_from_seconds((part->>'paceHighSeconds')::integer),
      (part->>'paceLowSeconds')::integer,
      (part->>'paceHighSeconds')::integer,
      (part->>'rpeLow')::smallint,
      (part->>'rpeHigh')::smallint,
      part->>'rpeSource',
      part->>'rpeDefaultVersion',
      (part->>'repeatMinimum')::smallint,
      (part->>'repeatTarget')::smallint,
      (part->>'repeatProgression')::smallint,
      (part->>'repeatCeiling')::smallint,
      nullif(part->>'countsTowardMarkId','')::uuid
    from jsonb_array_elements(p_components) with ordinality as t(part, ordinality);
  end if;

  return created_id;
end $fn$;

-- ── 3 · connecting José and Hope, deliberately ──────────────────────────────
--
-- Their mark is `continuous at race pace`, ladder 1 · 2 · 5 · 6 · 8 · 10 · 13.1,
-- band 6:30–6:45. Only that band is connected, and only on the current version
-- of each session.
--
-- Repetitions are connected as well as continuous work, because each rep of
-- 3 × 2 mi IS two continuous miles. The frozen semantics are unaffected and are
-- enforced by the piece: the longest single qualifying piece, never the sum.
--
-- Not connected, and each for its own reason:
--   6:25–6:30   faster than race pace. Threshold-side work does not establish
--               race-pace durability by being quicker.
--   8:45+       the easy ceiling, on 94 components. This is the missing-upper-
--               bound hole closed by construction rather than by another guard.
--   warm-ups, cool-downs, jog and float recoveries — never `role = 'work'`.
--   Marcus and Natalie — different instruments, audited separately.
--   Simon — no continuous-distance mark exists to point at.

update public.planned_session_components c
   set counts_toward_mark_id = m.id
  from public.planned_session_versions v,
       public.planned_sessions s,
       public.athletes a,
       public.athlete_marks m,
       lateral (select max(version_number) mx from public.planned_session_versions x
                 where x.planned_session_id = s.id) latest
 where c.version_id = v.id
   and v.planned_session_id = s.id
   and s.athlete_id = a.id
   and m.athlete_id = a.id and m.active and m.is_primary
   and a.slug in ('jose', 'hope')
   and v.version_number = latest.mx
   and c.role = 'work'
   and c.pace_low_seconds = 390
   and c.pace_high_seconds = 405;

-- ── 4 · establishment, mark-scoped and evidence-backed ──────────────────────

drop view if exists public.athlete_continuous_owned;

create view public.mark_established_value
with (security_invoker = true) as
select m.id                          as mark_id,
       m.athlete_id,
       max(p.distance)               as established_value,
       max(sc.filed_at)              as established_at,
       count(*)                      as qualifying_segments
from public.planned_session_components c
join public.athlete_marks m           on m.id = c.counts_toward_mark_id
join public.planned_session_versions v on v.id = c.version_id
join public.planned_sessions s        on s.id = v.planned_session_id
join public.session_completions sc    on sc.planned_session_id = s.id
join public.session_pieces p          on p.completion_id = sc.id
where c.counts_toward_mark_id is not null
  -- A withdrawn prescription no longer defines what evidence was meant to
  -- establish. The run happened and the filing stays; it simply answers nothing.
  and s.state <> 'cancelled'
  and p.distance is not null
  and p.distance_unit = 'mi'
  and p.pace_seconds is not null
  -- The segment's own pace, inside the band its own prescription asked for.
  -- Both bounds required and both present by construction: an eligible component
  -- is one somebody connected, and nothing connects a ceiling.
  and c.pace_low_seconds is not null
  and c.pace_high_seconds is not null
  and p.pace_seconds >= c.pace_low_seconds
  and p.pace_seconds <= c.pace_high_seconds
group by m.id, m.athlete_id;

grant select on public.mark_established_value to authenticated;

comment on view public.mark_established_value is
  'What filed evidence has established against a mark. Reads only components explicitly connected by counts_toward_mark_id, never inferred from pace, title or shape, and never from a cancelled prescription. Evaluated per segment: the longest single uninterrupted qualifying piece, never the sum of broken work.';

-- The surfaces read the athlete's primary mark. Kept as a projection so the one
-- name they know keeps working, and so it is obvious this is a view OF the
-- mark-scoped answer rather than a second calculation.
create view public.athlete_continuous_owned
with (security_invoker = true) as
select e.athlete_id, e.established_value as owned_mi, e.established_at, e.qualifying_segments
from public.mark_established_value e
join public.athlete_marks m on m.id = e.mark_id
where m.active and m.is_primary;

grant select on public.athlete_continuous_owned to authenticated;

comment on view public.athlete_continuous_owned is
  'The primary mark''s established value, projected per athlete. A projection of mark_established_value, not a separate calculation. An athlete with no primary mark, or none whose eligible components have qualifying evidence, correctly appears nowhere.';
