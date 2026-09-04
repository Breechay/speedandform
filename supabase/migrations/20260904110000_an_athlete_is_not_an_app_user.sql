-- An athlete is not an app user.
--
-- The hierarchy is ATHLETE → COACHING RECORD → optional delivery surfaces. The
-- FORM app is one of those surfaces, not the definition of the relationship.
-- Simon is coached in person and does not want the app; Marcus was invited and
-- has never opened it. Today those two states are identical — no membership —
-- so Labs would nag about both forever and be wrong about one of them.
--
-- A coach-delivered athlete is not a gap to be closed. It is a mode.

alter table public.athletes
  add column if not exists delivery text not null default 'app'
    check (delivery in ('app', 'coach'));

comment on column public.athletes.delivery is
  'How this athlete receives their coaching. app = the FORM app is the delivery surface and an unclaimed invite is a gap worth flagging. coach = delivered by the coach directly and the app is optional backup; no membership is expected and its absence is not a problem.';

-- ── The standing observation ────────────────────────────────────────────────
--
-- WHAT HELPS JOSÉ and WHAT I'M SEEING for Rod are the same object: a dated,
-- sourced, athlete-level observation that points at the evidence which produced
-- it. Built once, deliberately, because two standing-fact tables would become
-- two vocabularies inside a month.
--
-- The enum lives underneath so the system can compare across weeks. The sentence
-- is what a person reads. Same discipline as a judgment's required reason: the
-- structured field exists so the machine can reason, the words exist so the
-- human is not handed a score.
--
-- No "softer". Any vocabulary that only reads as bad on an athlete's body is an
-- evaluation wearing a measurement's clothes. The directions are neutral and
-- describe movement relative to intent, not worth.

create table if not exists public.athlete_observations (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,

  -- What kind of fact this is. Deliberately small and deliberately shared
  -- between a runner and a strength athlete.
  facet text not null check (facet in ('body', 'capacity', 'practice', 'helps', 'aspiration', 'means', 'pattern')),

  -- Whose fact it is. The same trichotomy session_exceptions already uses, so
  -- an athlete's report and a coach's read never flatten into one voice.
  source text not null check (source in ('athlete_reported', 'coach_observed', 'system_detected')),

  -- The sentence. This is what is shown, always.
  observation text not null check (length(btrim(observation)) > 0),

  -- The direction, underneath. Null is honest: not every observation moves.
  direction text check (direction in ('toward_intent', 'no_clear_change', 'away_from_intent')),

  -- What produced it. A read points at its evidence or it is an opinion.
  evidence_completion_ids uuid[] not null default '{}',
  read_id uuid references public.reads(id) on delete set null,

  observed_on date not null default current_date,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),

  -- Superseded, never overwritten. The model is mark_judgments.
  supersedes uuid references public.athlete_observations(id) on delete set null
);

create index athlete_observations_athlete_idx
  on public.athlete_observations (athlete_id, observed_on desc);

alter table public.athlete_observations enable row level security;
create policy observations_member_read on public.athlete_observations
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy observations_coach_write on public.athlete_observations
  for insert to authenticated with check (public.is_coach_member(athlete_id));

comment on table public.athlete_observations is
  'A dated, sourced, athlete-level observation pointing at the evidence that produced it. WHAT HELPS for a runner and WHAT I AM SEEING for a strength athlete are the same object. The direction enum exists so the system can compare; the sentence is what a person reads.';

-- The standing set: newest per facet that nothing has superseded.
create or replace view public.athlete_standing_observations
with (security_invoker = true) as
select o.*
  from public.athlete_observations o
 where not exists (
   select 1 from public.athlete_observations later
    where later.supersedes = o.id);

grant select on public.athlete_standing_observations to authenticated;

-- ── The rung a session establishes ──────────────────────────────────────────
--
-- Labs currently infers rung-ness from "one continuous work component in band
-- whose distance matches an unreached checkpoint". That is right today and it is
-- a guess. The column makes it a fact, and it is deliberately separate from
-- is_key: Hope's Tuesday is key and moves no rung.

alter table public.planned_sessions
  add column if not exists establishes_checkpoint_id uuid
    references public.mark_checkpoints(id) on delete set null;

comment on column public.planned_sessions.establishes_checkpoint_id is
  'The ladder rung this session would move if it lands. Separate from is_key: a session can be what the week asks without establishing anything.';
