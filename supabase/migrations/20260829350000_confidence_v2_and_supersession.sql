-- Hope 55 and José 50 were computed before the effort target existed. They stay in
-- the record and stop being answerable.
--
-- A proposal is an argument about a specific set of evidence. Both of these were
-- made when the two 1 km prescriptions carried no effort target and Hope's reps were
-- whole seconds. Accepting one now would write a standing confidence that no longer
-- follows from the evidence printed beside it. decide_confidence already refuses a
-- stale proposal by fingerprint; this makes the supersession explicit and visible
-- rather than something a coach discovers by being told no.
--
-- Deleting them was never an option. What the rule believed before the record was
-- complete is the most interesting thing in this table.

create table public.mark_confidence_proposal_supersessions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.mark_confidence_proposals(id) on delete cascade,
  reason text not null check (length(btrim(reason)) > 0),
  superseded_by_version text,
  created_at timestamptz not null default now()
);

alter table public.mark_confidence_proposal_supersessions enable row level security;
create policy proposal_supersessions_coach_read on public.mark_confidence_proposal_supersessions
  for select to authenticated using (exists (
    select 1 from public.mark_confidence_proposals p
     where p.id = proposal_id and public.is_coach_member(p.athlete_id)));

create trigger proposal_supersessions_immutable
  before update or delete on public.mark_confidence_proposal_supersessions
  for each row execute function public.prevent_immutable_change();

-- What the session cost, beside what it was designed to cost. Recorded, not scored:
-- the ratified factor table names no points for effort, and inventing some so the
-- number moves is the exact failure this design exists to prevent.
alter table public.mark_confidence_proposals
  add column if not exists effort_observations jsonb not null default '[]'::jsonb;

comment on column public.mark_confidence_proposals.effort_observations is
  'How each qualifying session was reported to feel against the effort it asked for, with the reading from Brice''s interpretation table. Context for the coach, deliberately unscored: no factor in confidence.v1 or v2 awards points for effort, and none will until Brice names one.';

-- Brice's reading of a reported RPE.
create or replace function public.rpe_reading(reported smallint, asked_low smallint, asked_high smallint)
returns text
language sql
immutable
as $$
  select case
    when reported is null then 'awaiting'
    when reported <= 5 then 'substantially cheaper than designed; verify execution'
    when reported = 6 then 'outstanding, the work was achieved with headroom'
    when reported between 7 and 8 then 'cost matched the session design'
    when reported = 9 then 'more costly than designed; coach attention'
    else 'maximal; immediate review'
  end;
$$;

comment on function public.rpe_reading(smallint, smallint, smallint) is
  'A 6 is excellent evidence, not an instruction. One does not accelerate a plan; three comparable 6s inside six weeks say the paces may have gone stale, and even then the Console recommends a review and never moves a pace on its own.';

-- confidence.v2 — the same seven scored factors, now reading the corrected record.
--
-- Nothing was added to the table to make a number move. The scored rows are exactly
-- the ratified ones. What is new is that each proposal carries what the session cost
-- against what it asked, because the prescriptions finally say what they asked.
create or replace function public.confidence_v2(p_mark_id uuid)
returns table (
  score smallint,
  factors jsonb,
  effort_observations jsonb,
  evidence_completion_ids uuid[],
  evidence_key text,
  limiting text,
  next_evidence text
)
language sql
stable
security invoker
as $$
with mark as (select * from public.athlete_marks where id = p_mark_id),
owned_rung as (
  select c.source, c.evidence_completion_id
    from public.mark_checkpoints c, mark m
   where c.mark_id = m.id and c.state = 'reached'
   order by c.position desc limit 1
),
qualifying as (
  select c.id as completion_id, c.updated_at, c.rpe, c.athlete_note,
         c.knee_during, c.knee_after,
         ps.scheduled_on as on_date, v.id as version_id
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
  select q.*, k.repeat_target, k.repeat_progression, k.repeat_ceiling,
         k.rpe_low as asked_low, k.rpe_high as asked_high, k.rpe_source,
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
    (select md5(coalesce(string_agg(
        completion_id::text || ':' || updated_at::text || ':' ||
        coalesce(asked_low::text,'-') || coalesce(asked_high::text,'-'), ',' order by completion_id), ''))
       from per) as key
),
fired as (
  select 1 as ord, 'qualifying_evidence_legacy_proof' as factor, 40 as points,
         'Qualifying evidence against a rung carried in from the old records and never yet answered by a filing here' as says
    from rolled where evidence_count > 0 and legacy_rung
  union all select 2, 'target_completed', 5, 'Completed the authored target' from rolled where hit_target
  union all select 3, 'progression_completed', 3, 'Completed the authored progression' from rolled where hit_progression
  union all select 4, 'ceiling_completed', 2, 'Completed the authored ceiling' from rolled where hit_ceiling
  union all select 5, 'reps_within_5_seconds', 5, 'Equal-length reps held inside 5 seconds' from rolled where tightest_spread <= 5
  union all select 6, 'reps_within_15_seconds', 2, 'Equal-length reps held inside 15 seconds' from rolled where tightest_spread > 5 and tightest_spread <= 15
  union all select 7, 'corroborated_separate_day', 3, 'Corroborated by work on a separate day' from rolled where distinct_days >= 2
)
select
  (select sum(points) from fired)::smallint,
  coalesce((select jsonb_agg(jsonb_build_object('factor', factor, 'points', points, 'says', says) order by ord) from fired), '[]'::jsonb),
  coalesce((select jsonb_agg(jsonb_build_object(
      'on', on_date, 'reported', rpe, 'asked_low', asked_low, 'asked_high', asked_high,
      'effort_source', rpe_source,
      'reading', public.rpe_reading(rpe, asked_low, asked_high),
      'exception', (rpe is not null and asked_high is not null and rpe > asked_high),
      'symptoms', nullif(btrim(coalesce(knee_during,'') || ' ' || coalesce(knee_after,'')), ''),
      'said', athlete_note) order by on_date) from per), '[]'::jsonb),
  (select ids from rolled),
  (select key from rolled),
  'Strong interval-volume evidence, but not yet continuous race-distance proof.',
  'Longer authored race-specific work completed with controlled reported effort.'
 where (select evidence_count from rolled) > 0
   and (select legacy_rung from rolled)
   and (select proof_state from rolled) <> 'unknown';
$$;

-- Supersede everything v1 said, then let v2 speak.
do $$
declare p record; m record; r record;
begin
  for p in select id from public.mark_confidence_proposals where rule_version = 'v1' loop
    insert into public.mark_confidence_proposal_supersessions (proposal_id, reason, superseded_by_version)
    values (p.id,
            'Computed before the quality-session effort target was recorded on the prescriptions, and before Hope''s rep times carried their measured tenths. The evidence it argued from is no longer the evidence on file.',
            'v2');
  end loop;

  for m in select id, athlete_id from public.athlete_marks where active and is_primary loop
    select * into r from public.confidence_v2(m.id);
    continue when r.score is null;
    insert into public.mark_confidence_proposals
      (athlete_id, mark_id, score, rule_id, rule_version, factors, effort_observations,
       evidence_completion_ids, previous_score, evidence_key)
    values (m.athlete_id, m.id, r.score, 'confidence', 'v2', r.factors, r.effort_observations,
            r.evidence_completion_ids,
            (select score from public.mark_standing_confidence where mark_id = m.id limit 1),
            r.evidence_key)
    on conflict (mark_id, rule_version, evidence_key) do nothing;
  end loop;
end $$;

-- Open means: nobody decided it, and nothing superseded it.
create or replace view public.mark_open_confidence_proposal
with (security_invoker = true) as
select p.*
  from public.mark_confidence_proposals p
 where not exists (select 1 from public.mark_confidence_decisions d where d.proposal_id = p.id)
   and not exists (select 1 from public.mark_confidence_proposal_supersessions s where s.proposal_id = p.id);

grant select on public.mark_open_confidence_proposal to authenticated;

-- decide_confidence must refuse a superseded proposal outright, not merely fail its
-- fingerprint check. The two usually coincide; when they do not, the explicit
-- refusal is the one a coach can understand.
create or replace function public.decide_confidence(
  p_proposal_id uuid, p_decision text, p_score smallint default null, p_reason text default null)
returns uuid
language plpgsql security invoker as $$
declare
  proposal public.mark_confidence_proposals;
  current_key text; current_next text;
  decision_id uuid; read_id uuid; prior uuid; written_reason text;
begin
  if p_decision not in ('accept', 'hold', 'override') then
    raise exception 'a decision is accept, hold or override, not %', p_decision;
  end if;

  select * into proposal from public.mark_confidence_proposals where id = p_proposal_id;
  if proposal.id is null then raise exception 'no such proposal, or it is not yours to decide'; end if;

  if exists (select 1 from public.mark_confidence_proposal_supersessions where proposal_id = p_proposal_id) then
    raise exception 'this proposal was superseded; a newer one is waiting';
  end if;
  if exists (select 1 from public.mark_confidence_decisions where proposal_id = p_proposal_id) then
    raise exception 'this proposal was already decided';
  end if;

  execute format('select evidence_key, next_evidence from public.confidence_%I($1)', proposal.rule_version)
    into current_key, current_next using proposal.mark_id;
  if current_key is distinct from proposal.evidence_key then
    raise exception 'the evidence changed since this was proposed; a fresh proposal is waiting';
  end if;

  if p_decision = 'override' and (p_score is null or length(btrim(coalesce(p_reason, ''))) = 0) then
    raise exception 'an override carries your number and your reason';
  end if;

  insert into public.mark_confidence_decisions
    (athlete_id, proposal_id, decision, override_score, reason, decided_by)
  values (proposal.athlete_id, p_proposal_id, p_decision,
          case when p_decision = 'override' then p_score end,
          case when p_decision = 'override' then p_reason end, auth.uid())
  returning id into decision_id;

  if p_decision = 'hold' then return decision_id; end if;

  select id into prior from public.mark_standing_confidence where mark_id = proposal.mark_id limit 1;

  written_reason := case when p_decision = 'override' then p_reason
    else 'confidence.' || proposal.rule_version || ' · ' || coalesce(
      (select string_agg((f->>'says') || ' (+' || (f->>'points') || ')', '; ')
         from jsonb_array_elements(proposal.factors) f), 'no factors fired') end;

  insert into public.mark_confidence_reads
    (athlete_id, mark_id, score, reason, next_evidence, supersedes, authored_by)
  values (proposal.athlete_id, proposal.mark_id,
          case when p_decision = 'override' then p_score else proposal.score end,
          written_reason,
          coalesce(current_next, 'Longer authored race-specific work completed with controlled reported effort.'),
          prior, auth.uid())
  returning id into read_id;

  insert into public.mark_confidence_completions (read_id, completion_id)
  select read_id, unnest(proposal.evidence_completion_ids) on conflict do nothing;

  return decision_id;
end $$;

revoke all on function public.decide_confidence(uuid, text, smallint, text) from public, anon;
grant execute on function public.decide_confidence(uuid, text, smallint, text) to authenticated;
