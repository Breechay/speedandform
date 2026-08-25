-- A rung records what moved it.
--
-- The system is coach governed, not coach gated. The whole fifteen or sixteen
-- week program is authored in advance and the paces are set, so an authored rule
-- may advance a checkpoint on structured evidence without waiting for a review.
-- Brice decides by conversation and exception, not by approving every clean
-- Tuesday.
--
-- The earlier rule that no automated process may mutate a checkpoint is replaced,
-- not preserved. It came out of agent discussion rather than from Brice, in the
-- same way the prohibition on a confidence figure did, and it contradicted both
-- the roadmap and the FORMV3ProgressionDecision engine FORM-iOS already ships.
--
-- What the erasure actually cost was not automation. It was provenance: rows
-- moved with nothing recording what moved them, so a ladder with no outdoor
-- evidence read 61 per cent proven and there was no way to tell which numerals
-- were earned. These columns are that record.

alter table public.mark_checkpoints
  add column if not exists source text,
  add column if not exists moved_at timestamptz,
  add column if not exists moved_by uuid references auth.users(id) on delete set null,
  add column if not exists evidence_completion_id uuid references public.session_completions(id) on delete set null;

-- Everything that exists predates the record. It is marked as such rather than
-- given a provenance it never had: legacy means nobody can say what moved it.
update public.mark_checkpoints set source = 'legacy' where source is null;

alter table public.mark_checkpoints
  alter column source set default 'coach';

alter table public.mark_checkpoints
  add constraint checkpoint_source_known
  check (source in ('automatic', 'coach', 'override', 'legacy'));

alter table public.mark_checkpoints
  alter column source set not null;

-- An automatic advance must be able to point at the evidence that earned it.
-- Without this an automatic source is just a word.
alter table public.mark_checkpoints
  add constraint checkpoint_automatic_cites_evidence
  check (source <> 'automatic' or evidence_completion_id is not null);

comment on column public.mark_checkpoints.source is
  'What moved this rung: automatic (an authored progression rule fired on structured evidence), coach (Brice decided), override (Brice corrected an automatic result), legacy (moved before provenance was recorded, and not to be trusted as earned).';
comment on column public.mark_checkpoints.evidence_completion_id is
  'The filing an automatic advance rests on. Required when source is automatic, so an earned rung can always be traced back to the run that earned it.';

do $$
declare bad integer;
begin
  select count(*) into bad from public.mark_checkpoints where source is null;
  if bad > 0 then raise exception '% checkpoints have no source', bad; end if;

  select count(*) into bad from public.mark_checkpoints
   where source = 'automatic' and evidence_completion_id is null;
  if bad > 0 then raise exception '% automatic advances cite no evidence', bad; end if;

  select count(*) into bad from public.mark_checkpoints where source = 'legacy';
  raise notice '% checkpoints carry legacy provenance and cannot be read as earned', bad;
end $$;
