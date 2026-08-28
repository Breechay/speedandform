-- What holds the number down, kept with the number.
--
-- confidence_v2 returns `limiting` and `next_evidence` and the proposal stored
-- neither, so the review surface had a score and a list of factors and nothing
-- saying what would move it. A confidence that names nothing that could change it is
-- a verdict rather than a coaching position — the same rule mark_confidence_reads
-- has enforced since it was written.

alter table public.mark_confidence_proposals
  add column if not exists limiting text,
  add column if not exists next_evidence text;

-- Gathered first, so no cursor is open over the table while it is altered.
create temporary table proposal_words on commit drop as
select p.id,
       case when p.rule_version = 'v2' then (select limiting from public.confidence_v2(p.mark_id))
            else (select limiting from public.confidence_v1(p.mark_id)) end as limiting,
       case when p.rule_version = 'v2' then (select next_evidence from public.confidence_v2(p.mark_id))
            else (select next_evidence from public.confidence_v1(p.mark_id)) end as next_evidence
  from public.mark_confidence_proposals p
 where p.limiting is null;

-- These two columns did not exist when the rows were written. Filling a column that
-- was never there is not a revision of what the rule said, which is why this is the
-- one place the immutability guard steps aside — briefly, and never again.
alter table public.mark_confidence_proposals disable trigger confidence_proposals_immutable;

update public.mark_confidence_proposals p
   set limiting = w.limiting, next_evidence = w.next_evidence
  from proposal_words w
 where w.id = p.id;

alter table public.mark_confidence_proposals enable trigger confidence_proposals_immutable;

do $$
declare bare integer;
begin
  select count(*) into bare from public.mark_confidence_proposals where limiting is null;
  if bare > 0 then raise exception '% proposals still name nothing that would move them', bare; end if;
end $$;
