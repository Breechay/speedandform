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

create policy proposals_member_read on public.mark_confidence_proposals
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy proposals_coach_insert on public.mark_confidence_proposals
  for insert to authenticated with check (public.is_coach_member(athlete_id));

create policy decisions_member_read on public.mark_confidence_decisions
  for select to authenticated using (public.can_read_athlete(athlete_id));
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
