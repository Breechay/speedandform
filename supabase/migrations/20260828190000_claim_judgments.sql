-- What a session did to the claim, judged by Brice.
--
-- The system already computes three mechanical verdicts: were the reps inside the
-- band, did the floats stay near the athlete's own easy pace, was the effort
-- inside the asked range. Those are facts. They are not a judgment. Hope's floats
-- read 0 of 3 and Jose's 3 of 3, but only Brice can say whether that means the
-- claim got more believable, less believable, or was left exactly where it was.
--
-- This is the honest alternative to a confidence score. A score compresses the
-- reasoning into a number that gets chased. A judgment names the session, states
-- the direction, and carries the sentence, so the reasoning stays inspectable.
--
-- Three directions, and the third is the one that matters most:
--   supports        readable evidence that makes the claim more believable
--   against         readable evidence that makes it less believable
--   does_not_answer the session happened but cannot speak to the claim
--
-- An unreadable session changes nothing. It is recorded as does_not_answer, which
-- is different from absence and different from failure. Hope's August 25 belongs
-- here: she ran it, she ran it well by some measures, and it still cannot tell us
-- how far she can hold race pace, because she rested instead of floating.

create table public.mark_judgments (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  direction text not null check (direction in ('supports', 'against', 'does_not_answer')),
  -- Brice's words. Never generated, never defaulted. A judgment without a reason
  -- is a score with extra steps.
  reason text not null check (length(btrim(reason)) > 0),
  -- Amending means writing a new judgment that names the one it replaces, so the
  -- earlier reading stays legible instead of disappearing.
  supersedes uuid references public.mark_judgments(id) on delete set null,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- A judgment can rest on more than one session. Jose's claim is a good example:
-- one morning shows he went hard cleanly, and it takes a later session to show
-- the cost. One row per session the judgment actually used.
create table public.mark_judgment_completions (
  judgment_id uuid not null references public.mark_judgments(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  primary key (judgment_id, completion_id)
);

create index mark_judgments_mark_idx on public.mark_judgments (mark_id, created_at desc);

alter table public.mark_judgments enable row level security;
alter table public.mark_judgment_completions enable row level security;

create policy judgments_member_read on public.mark_judgments
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy judgments_coach_write on public.mark_judgments
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and authored_by = auth.uid());

create policy judgment_completions_read on public.mark_judgment_completions
  for select to authenticated using (exists (
    select 1 from public.mark_judgments j
    where j.id = judgment_id and public.can_read_athlete(j.athlete_id)));
create policy judgment_completions_write on public.mark_judgment_completions
  for insert to authenticated with check (exists (
    select 1 from public.mark_judgments j
    where j.id = judgment_id and public.is_coach_member(j.athlete_id)));

-- Same rule as published history: a judgment is a record of what was thought at
-- the time. Amending writes a new one.
create trigger mark_judgments_immutable
  before update or delete on public.mark_judgments
  for each row execute function public.prevent_immutable_change();

-- The standing judgment is the newest one nothing has superseded.
create or replace view public.mark_standing_judgments
with (security_invoker = true) as
select j.*
  from public.mark_judgments j
 where not exists (select 1 from public.mark_judgments later where later.supersedes = j.id);

grant select on public.mark_standing_judgments to authenticated;
