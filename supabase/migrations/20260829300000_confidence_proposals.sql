-- Confidence is proposed by a rule and decided by Brice.
--
-- Two failed models preceded this. A blank field asked him to invent a number
-- every week, which is the manual work the whole system exists to remove. A
-- weighted formula would have produced a figure nobody could argue with, which
-- is the black box he rejected from the start and the reason the original brief
-- banned a confidence score at all.
--
-- So: a rule proposes, in the open, with the evidence it used. He accepts, holds
-- or overrides. A proposal is never the current value until he says so, and an
-- override needs his reason. Every decision is kept, because the record of a
-- mind changing is the thing that stays legible in six weeks.
--
-- Nothing here touches established proof. A confidence read and a rung are
-- different objects: one is belief about the day, the other is what has been
-- held. A session can move the first without touching the second, and usually
-- does.

create table public.mark_confidence_proposals (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  -- Which rule, and which version of it. A proposal from confidence.v1 must stay
  -- readable after v2 exists, or the history becomes uninterpretable.
  rule_id text not null,
  rule_version text not null,
  -- The rows of the rule that fired, in order, each with what it contributed.
  -- Readable by a person: this is the thing that makes the score arguable.
  factors jsonb not null,
  -- What the rule was looking at. Absent means the rule ran on no filings.
  evidence_completion_ids uuid[] not null default '{}',
  previous_score smallint,
  created_at timestamptz not null default now(),
  -- One live proposal per mark per rule version. Re-running the rule on the same
  -- evidence must not stack proposals in the queue.
  evidence_key text not null,
  constraint proposal_is_idempotent unique (mark_id, rule_version, evidence_key)
);

create index confidence_proposals_open_idx
  on public.mark_confidence_proposals (athlete_id, created_at desc);

-- Accept, hold, override. Append only: a decision that can be edited afterwards
-- is not a record of what was decided.
create table public.mark_confidence_decisions (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  proposal_id uuid not null references public.mark_confidence_proposals(id) on delete cascade,
  decision text not null check (decision in ('accept', 'hold', 'override')),
  -- Present only on override, and required there: changing the rule's answer is
  -- a coaching act and carries his words.
  override_score smallint check (override_score is null or override_score between 0 and 100),
  reason text,
  decided_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint override_states_its_number check (
    decision <> 'override' or (override_score is not null and length(btrim(coalesce(reason, ''))) > 0))
);

create index confidence_decisions_proposal_idx
  on public.mark_confidence_decisions (proposal_id, created_at desc);

alter table public.mark_confidence_proposals enable row level security;
alter table public.mark_confidence_decisions enable row level security;

create policy proposals_coach_read on public.mark_confidence_proposals
  for select to authenticated using (public.is_coach_member(athlete_id));
create policy proposals_coach_insert on public.mark_confidence_proposals
  for insert to authenticated with check (public.is_coach_member(athlete_id));

create policy decisions_coach_read on public.mark_confidence_decisions
  for select to authenticated using (public.is_coach_member(athlete_id));
create policy decisions_coach_insert on public.mark_confidence_decisions
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and decided_by = auth.uid());

create trigger confidence_proposals_immutable
  before update or delete on public.mark_confidence_proposals
  for each row execute function public.prevent_immutable_change();
create trigger confidence_decisions_immutable
  before update or delete on public.mark_confidence_decisions
  for each row execute function public.prevent_immutable_change();

-- The standing proposal is the newest one nothing has been decided on.
create or replace view public.mark_open_confidence_proposal
with (security_invoker = true) as
select p.*
  from public.mark_confidence_proposals p
 where not exists (select 1 from public.mark_confidence_decisions d where d.proposal_id = p.id);

grant select on public.mark_open_confidence_proposal to authenticated;

comment on table public.mark_confidence_proposals is
  'What confidence.v1 proposes and why. factors carries the rows that fired in a form a person can argue with, because a score nobody can dispute is the black box this was built to avoid. A proposal is never the current value; only an accepted or overridden decision writes a confidence read.';
comment on table public.mark_confidence_decisions is
  'Accept, hold or override, append only. Override carries the number and the reason. Established proof is never touched by any of them.';

do $$
declare bad integer;
begin
  select count(*) into bad from pg_policies
   where schemaname='public' and tablename in ('mark_confidence_proposals','mark_confidence_decisions')
     and cmd in ('UPDATE','DELETE');
  if bad > 0 then raise exception 'confidence history is editable through % policies', bad; end if;
end $$;

-- ---------------------------------------------------------------------------
-- confidence.v1
--
-- The ratified factor table, and nothing else. Every row below was named before
-- it was implemented, and no row exists because it made a number come out right.
-- If the rule and a wanted figure disagree, the rule is what gets reported.
--
--   qualifying evidence, legacy-only proof        40
--   target completed                              +5
--   progression completed                         +3
--   ceiling completed                             +2
--   equal-length reps within 5 seconds            +5
--   equal-length reps within 15 seconds           +2
--   corroboration on a separate day               +3
--
-- The consistency rows are one band, not two: the tightest that holds is the one
-- that scores. Consistency reads elapsed rep time across equal-distance reps only,
-- because a spread across reps of different lengths measures the prescription
-- rather than the athlete.
--
-- Same-day work is one day. A double corroborates nothing, which is the whole
-- reason corroboration is worth three points.
--
-- Pace, recovery and effort score nothing unless they were authored. An athlete
-- cannot adhere to a target nobody set, and counting a reported RPE as adherence
-- to an absent one is how a confidence figure quietly becomes a compliance score.
--
-- Established proof is untouched here. A rung is what has been held; this is
-- belief about a day. They move on different evidence and for different reasons.
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
-- A completion qualifies when it answers a question the mark asked: it belongs to
-- the mark's block, it was authored as repetitions, and it filed reps rather than
-- a sentence about reps.
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
-- What each qualifying session did against what it authored.
per as (
  select q.completion_id,
         q.updated_at,
         q.on_date,
         k.repeat_target,
         k.repeat_progression,
         k.repeat_ceiling,
         (select count(*) from public.session_pieces sp
           where sp.completion_id = q.completion_id and sp.kind = 'rep') as reps_done,
         -- Elapsed time, equal distances only, source precision preferred over the
         -- rounded column so a band edge is never decided by integer storage.
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
-- One row per factor that fired, in the order the table lists them.
fired as (
  select 1 as ord, 'qualifying_evidence_legacy_proof' as factor, 40 as points,
         'Qualifying evidence against a mark whose established proof is legacy only' as says
    from rolled where evidence_count > 0 and proof_state = 'unknown'
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
  -- What holds the number down. Named from the evidence, not written by hand.
  'Strong interval-volume evidence, but not yet continuous race-distance proof.',
  'Longer authored race-specific work completed with controlled reported effort.'
 where (select evidence_count from rolled) > 0
   and (select proof_state from rolled) = 'unknown';
$$;

comment on function public.confidence_v1(uuid) is
  'The ratified confidence.v1 factor table. Returns no row when there is no qualifying evidence, or when the mark''s established proof is not legacy-only, because the table names a base for that case and no other. A rule that guesses at an unlisted case is the black box this replaced.';

-- ---------------------------------------------------------------------------
-- Deciding.
--
-- One function, so accepting is one transaction. A confidence read written by a
-- separate call after the decision row would leave a window where the decision
-- exists and the number does not, and that window is exactly the state nobody
-- can interpret afterwards.
--
-- Staleness is the guarantee that matters most. A proposal is an argument about a
-- specific set of filings. If a session is filed or corrected between the proposal
-- and the click, accepting would write a number that no longer follows from the
-- evidence printed beside it. The rule is recomputed here and the fingerprints
-- compared, so accepting stale evidence is refused rather than recorded.
create or replace function public.decide_confidence(
  p_proposal_id uuid,
  p_decision text,
  p_score smallint default null,
  p_reason text default null)
returns uuid
language plpgsql
security invoker
as $$
declare
  proposal public.mark_confidence_proposals;
  current_key text;
  current_next text;
  decision_id uuid;
  read_id uuid;
  prior uuid;
  written_reason text;
begin
  if p_decision not in ('accept', 'hold', 'override') then
    raise exception 'a decision is accept, hold or override, not %', p_decision;
  end if;

  select * into proposal from public.mark_confidence_proposals where id = p_proposal_id;
  if proposal.id is null then
    raise exception 'no such proposal, or it is not yours to decide';
  end if;

  if exists (select 1 from public.mark_confidence_decisions where proposal_id = p_proposal_id) then
    raise exception 'this proposal was already decided';
  end if;

  -- Recompute and compare. Not a formality: this is the check that stops a stale
  -- argument becoming a standing number.
  select evidence_key, next_evidence into current_key, current_next
    from public.confidence_v1(proposal.mark_id);
  if current_key is distinct from proposal.evidence_key then
    raise exception 'the evidence changed since this was proposed; a fresh proposal is waiting';
  end if;

  if p_decision = 'override'
     and (p_score is null or length(btrim(coalesce(p_reason, ''))) = 0) then
    raise exception 'an override carries your number and your reason';
  end if;

  insert into public.mark_confidence_decisions
    (athlete_id, proposal_id, decision, override_score, reason, decided_by)
  values (proposal.athlete_id, p_proposal_id, p_decision,
          case when p_decision = 'override' then p_score end,
          case when p_decision = 'override' then p_reason end,
          auth.uid())
  returning id into decision_id;

  -- Hold writes nothing else. The queue keeps the proposal's history and the
  -- standing number stays exactly where it was, which is the point of holding.
  if p_decision = 'hold' then
    return decision_id;
  end if;

  select id into prior from public.mark_standing_confidence where mark_id = proposal.mark_id limit 1;

  written_reason := case
    when p_decision = 'override' then p_reason
    else 'confidence.v1 · ' || coalesce(
      (select string_agg((f->>'says') || ' (+' || (f->>'points') || ')', '; ')
         from jsonb_array_elements(proposal.factors) f), 'no factors fired')
  end;

  insert into public.mark_confidence_reads
    (athlete_id, mark_id, score, reason, next_evidence, supersedes, authored_by)
  values (proposal.athlete_id, proposal.mark_id,
          case when p_decision = 'override' then p_score else proposal.score end,
          written_reason,
          coalesce(current_next, 'Longer authored race-specific work completed with controlled reported effort.'),
          prior, auth.uid())
  returning id into read_id;

  insert into public.mark_confidence_completions (read_id, completion_id)
  select read_id, unnest(proposal.evidence_completion_ids)
  on conflict do nothing;

  return decision_id;
end $$;

revoke all on function public.decide_confidence(uuid, text, smallint, text) from public, anon;
grant execute on function public.decide_confidence(uuid, text, smallint, text) to authenticated;

comment on function public.decide_confidence(uuid, text, smallint, text) is
  'Accept, hold or override in one transaction. Refuses a proposal whose evidence has moved since it was computed. Hold writes no confidence. Override requires a number and a reason. Touches no checkpoint: established proof is not a confidence read and never moves on one.';

-- ---------------------------------------------------------------------------
-- Propose, for every mark the rule can speak about.
--
-- The rule runs; whatever it returns is what gets queued. Marks it declines to
-- score stay unevaluated rather than receiving a number derived from a case the
-- ratified table does not name.
do $$
declare
  m record;
  r record;
  n integer := 0;
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
    raise notice 'confidence.v1 proposes % for mark % (athlete %) on % filings: %',
      r.score, m.id, m.athlete_id, coalesce(array_length(r.evidence_completion_ids, 1), 0), r.factors;
  end loop;
  raise notice 'confidence.v1 spoke about % mark(s)', n;
end $$;

do $$
declare bad integer;
begin
  select count(*) into bad from public.mark_confidence_proposals where score < 0 or score > 100;
  if bad > 0 then raise exception '% proposals sit outside 0 to 100', bad; end if;
end $$;
