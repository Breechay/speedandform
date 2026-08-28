-- The base factor was reading the wrong column, so the rule said nothing at all.
--
-- confidence.v1's first row is "qualifying evidence with legacy-only proof — 40".
-- It was gated on `athlete_marks.established_proof_state = 'unknown'`, which is a
-- different fact: that column says whether Brice has DISOWNED a rung, and it reads
-- 'derived' for Hope and José. So the rule declined to speak about either of them
-- and the queue came back empty.
--
-- Legacy-only proof is a property of the rung, not of the mark. It lives in
-- `mark_checkpoints.source = 'legacy'` with no `evidence_completion_id` — a rung
-- carried in from the old records, never yet answered by a filing in this system.
-- That is exactly what the ratified row means, and it is true of both athletes.
--
-- A disowned mark still gets no proposal. Nothing in the table names a base for a
-- rung Brice has said he does not believe, and inventing one to fill the silence is
-- the failure mode this whole design exists to avoid.

create or replace function public.confidence_v1(p_mark_id uuid)
returns table (
  score smallint,
  factors jsonb,
  evidence_completion_ids uuid[],
  evidence_key text,
  limiting text,
  next_evidence text
)
language sql
stable
security invoker
as $$
with mark as (
  select * from public.athlete_marks where id = p_mark_id
),
-- The rung the mark currently stands on, and where it came from.
owned_rung as (
  select c.source, c.evidence_completion_id
    from public.mark_checkpoints c, mark m
   where c.mark_id = m.id and c.state = 'reached'
   order by c.position desc
   limit 1
),
qualifying as (
  select c.id as completion_id,
         c.updated_at,
         ps.scheduled_on as on_date,
         v.id as version_id
    from public.session_completions c
    join public.planned_sessions ps on ps.id = c.planned_session_id
    join public.training_weeks w on w.id = ps.week_id
    join mark m on m.athlete_id = c.athlete_id
                and (m.block_id is null or m.block_id = w.block_id)
    join lateral (
      select pv.id from public.planned_session_versions pv
       where pv.planned_session_id = ps.id
       order by pv.version_number desc limit 1) v on true
   where c.status = 'completed'
     and exists (select 1 from public.planned_session_components k
                  where k.version_id = v.id and k.role = 'work' and k.shape = 'repetitions')
     and exists (select 1 from public.session_pieces sp
                  where sp.completion_id = c.id and sp.kind = 'rep')
),
per as (
  select q.completion_id,
         q.updated_at,
         q.on_date,
         k.repeat_target,
         k.repeat_progression,
         k.repeat_ceiling,
         (select count(*) from public.session_pieces sp
           where sp.completion_id = q.completion_id and sp.kind = 'rep') as reps_done,
         (select case when count(distinct sp.distance) = 1 and count(*) > 1
                      then max(coalesce(sp.duration_seconds_exact, sp.duration_seconds::numeric))
                         - min(coalesce(sp.duration_seconds_exact, sp.duration_seconds::numeric))
                 end
            from public.session_pieces sp
           where sp.completion_id = q.completion_id and sp.kind = 'rep'
             and sp.distance is not null
             and coalesce(sp.duration_seconds_exact, sp.duration_seconds::numeric) is not null
         ) as rep_spread
    from qualifying q
    join lateral (
      select * from public.planned_session_components c2
       where c2.version_id = q.version_id and c2.role = 'work'
       order by c2.position limit 1) k on true
),
rolled as (
  select
    (select established_proof_state from mark) as proof_state,
    (select source = 'legacy' and evidence_completion_id is null from owned_rung) as legacy_rung,
    (select count(*) from per) as evidence_count,
    (select count(distinct on_date) from per where on_date is not null) as distinct_days,
    (select bool_or(repeat_target is not null and reps_done >= repeat_target) from per) as hit_target,
    (select bool_or(repeat_progression is not null and reps_done >= repeat_progression) from per) as hit_progression,
    (select bool_or(repeat_ceiling is not null and reps_done >= repeat_ceiling) from per) as hit_ceiling,
    (select min(rep_spread) from per where rep_spread is not null) as tightest_spread,
    (select coalesce(array_agg(completion_id order by completion_id), '{}') from per) as ids,
    (select md5(coalesce(string_agg(completion_id::text || ':' || updated_at::text, ',' order by completion_id), ''))
       from per) as key
),
fired as (
  select 1 as ord, 'qualifying_evidence_legacy_proof' as factor, 40 as points,
         'Qualifying evidence against a rung carried in from the old records and never yet answered by a filing here' as says
    from rolled where evidence_count > 0 and legacy_rung
  union all
  select 2, 'target_completed', 5, 'Completed the authored target' from rolled where hit_target
  union all
  select 3, 'progression_completed', 3, 'Completed the authored progression' from rolled where hit_progression
  union all
  select 4, 'ceiling_completed', 2, 'Completed the authored ceiling' from rolled where hit_ceiling
  union all
  select 5, 'reps_within_5_seconds', 5,
         'Equal-length reps held inside 5 seconds' from rolled where tightest_spread <= 5
  union all
  select 6, 'reps_within_15_seconds', 2,
         'Equal-length reps held inside 15 seconds' from rolled
   where tightest_spread > 5 and tightest_spread <= 15
  union all
  select 7, 'corroborated_separate_day', 3,
         'Corroborated by work on a separate day' from rolled where distinct_days >= 2
)
select
  (select sum(points) from fired)::smallint,
  coalesce((select jsonb_agg(jsonb_build_object(
      'factor', factor, 'points', points, 'says', says) order by ord) from fired), '[]'::jsonb),
  (select ids from rolled),
  (select key from rolled),
  'Strong interval-volume evidence, but not yet continuous race-distance proof.',
  'Longer authored race-specific work completed with controlled reported effort.'
 where (select evidence_count from rolled) > 0
   and (select legacy_rung from rolled)
   and (select proof_state from rolled) <> 'unknown';
$$;

do $$
declare m record; r record; n integer := 0;
begin
  for m in select id, athlete_id from public.athlete_marks where active and is_primary loop
    select * into r from public.confidence_v1(m.id);
    continue when r.score is null;
    insert into public.mark_confidence_proposals
      (athlete_id, mark_id, score, rule_id, rule_version, factors,
       evidence_completion_ids, previous_score, evidence_key)
    values (m.athlete_id, m.id, r.score, 'confidence', 'v1', r.factors,
            r.evidence_completion_ids,
            (select score from public.mark_standing_confidence where mark_id = m.id limit 1),
            r.evidence_key)
    on conflict (mark_id, rule_version, evidence_key) do nothing;
    n := n + 1;
  end loop;
  raise notice 'confidence.v1 spoke about % mark(s)', n;
end $$;
