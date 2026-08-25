-- Every movement of a rung, permanently, so any of them can be audited later.
--
-- Automatic advancement is now the default: the authored rule fires on structured
-- evidence and moves the rung outright, with no approval step and no routine
-- please-review flag. That only stays safe if the movement is a record rather
-- than an event. mark_checkpoints holds the current state; this holds how it got
-- there, append only, one row per movement.
--
-- Reprocessing is the danger. A filing that is retried, re-imported from FORM's
-- offline queue, or replayed after a correction must not advance a rung twice.
-- The unique index below makes a repeat a no-op at the database rather than a
-- convention somewhere in the client.

create table public.mark_checkpoint_movements (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  checkpoint_id uuid not null references public.mark_checkpoints(id) on delete cascade,
  source text not null check (source in ('automatic', 'coach', 'override')),
  -- The A/R/R/R vocabulary FORM-iOS already uses, so one word means one thing on
  -- both sides of the seam.
  decision text not null check (decision in ('advance', 'repeatDose', 'reduce', 'replace', 'hold')),
  previous_state text,
  resulting_state text not null,
  evidence_completion_id uuid references public.session_completions(id) on delete set null,
  -- Which authored rule fired, and which version of it. Without the version a
  -- replay after the rule changed looks identical to the original.
  rule_id text,
  rule_version text,
  reason text not null check (length(btrim(reason)) > 0),
  moved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  -- An automatic movement must be able to name its evidence and its rule. A
  -- source word with nothing behind it is not provenance.
  constraint movement_automatic_is_traceable check (
    source <> 'automatic'
    or (evidence_completion_id is not null and rule_id is not null and rule_version is not null)),
  -- A decision Brice made is his, and says so.
  constraint movement_coach_is_attributed check (
    source = 'automatic' or moved_by is not null)
);

-- Idempotency. The same filing, through the same rule version, may move the same
-- rung exactly once however many times it is reprocessed.
create unique index checkpoint_movement_idempotent
  on public.mark_checkpoint_movements (checkpoint_id, evidence_completion_id, rule_id, rule_version)
  where source = 'automatic';

create index checkpoint_movement_checkpoint_idx
  on public.mark_checkpoint_movements (checkpoint_id, created_at desc);
create index checkpoint_movement_evidence_idx
  on public.mark_checkpoint_movements (evidence_completion_id);

alter table public.mark_checkpoint_movements enable row level security;

create policy movements_member_read on public.mark_checkpoint_movements
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy movements_coach_insert on public.mark_checkpoint_movements
  for insert to authenticated with check (public.is_coach_member(athlete_id));

-- Append only. A movement that can be edited is not an audit trail.
create trigger mark_checkpoint_movements_immutable
  before update or delete on public.mark_checkpoint_movements
  for each row execute function public.prevent_immutable_change();

comment on table public.mark_checkpoint_movements is
  'Every movement of a rung, append only. Automatic movements name the filing and the authored rule version that produced them and are idempotent per filing, so replaying a completion cannot advance a rung twice. Coach and override movements name Brice. The current state lives on mark_checkpoints; this is how it got there.';
comment on column public.mark_checkpoint_movements.decision is
  'advance, repeatDose, reduce, replace or hold. The same A/R/R/R vocabulary FORMV3ProgressionDecision uses, so the app and the server mean the same thing by the same word.';

do $$
declare bad integer;
begin
  select count(*) into bad from pg_indexes
   where schemaname = 'public' and indexname = 'checkpoint_movement_idempotent';
  if bad <> 1 then raise exception 'the idempotency index is missing; a replayed filing could advance a rung twice'; end if;

  select count(*) into bad from pg_trigger
   where tgname = 'mark_checkpoint_movements_immutable' and not tgisinternal;
  if bad <> 1 then raise exception 'the movement ledger is not append only'; end if;
end $$;
