-- decide_confidence declared p_score as smallint and nothing could call it.
--
-- PostgREST sends a JSON number as integer, and Postgres will not resolve
-- decide_confidence(uuid, text, integer, text) against a smallint parameter. So
-- every Override from the Console would have failed with "function does not exist"
-- — a dead control that looked alive, which is the exact thing the review surface
-- was rebuilt to stop being.
--
-- Caught by a proof run that passed for the wrong reason: the override was refused,
-- but for the signature rather than for the missing reason it was meant to test.

drop function if exists public.decide_confidence(uuid, text, smallint, text);

create or replace function public.decide_confidence(
  p_proposal_id uuid, p_decision text, p_score integer default null, p_reason text default null)
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
  if p_score is not null and (p_score < 0 or p_score > 100) then
    raise exception 'a confidence is between 0 and 100, not %', p_score;
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
          case when p_decision = 'override' then p_score::smallint end,
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
          case when p_decision = 'override' then p_score::smallint else proposal.score end,
          written_reason,
          coalesce(current_next, proposal.next_evidence,
                   'Longer authored race-specific work completed with controlled reported effort.'),
          prior, auth.uid())
  returning id into read_id;

  insert into public.mark_confidence_completions (read_id, completion_id)
  select read_id, unnest(proposal.evidence_completion_ids) on conflict do nothing;

  return decision_id;
end $$;

revoke all on function public.decide_confidence(uuid, text, integer, text) from public, anon;
grant execute on function public.decide_confidence(uuid, text, integer, text) to authenticated;
