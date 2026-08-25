-- Goal confidence, authored.
--
-- This document prohibited a confidence figure, for a good reason: a computed one
-- hides its reasoning, becomes a number to chase, and eventually gets optimised
-- instead of the next useful proof. Brice asked for one anyway, and an authored
-- figure is a different object. It is his judgment that the athlete achieves the
-- named goal on the named date if the current path continues. Nothing calculates
-- it, nothing derives it, and no filing, correction, judgment or checkpoint write
-- may produce one.
--
-- What makes it honest is that it never travels alone. A read carries the reason,
-- the evidence it rests on, and what would change it next. Amending writes a new
-- row naming the one it replaces, so the earlier reading stays legible and the
-- history is a record of a mind changing rather than a line that moved.
--
-- Distinct from proof coverage, which is not stored here. Coverage is the highest
-- established checkpoint over the mark's target, derived at read time from
-- authored checkpoint state. Five of 13.1 miles is 38 per cent proven and says
-- nothing about whether Brice believes in the race.

create table public.mark_confidence_reads (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  score smallint not null check (score between 0 and 100),
  -- Required. A percentage without a reason is the black box this was meant to
  -- avoid, wearing a coach's name.
  reason text not null check (length(btrim(reason)) > 0),
  -- Required. A confidence that names nothing that could change it is a verdict,
  -- not a coaching position.
  next_evidence text not null check (length(btrim(next_evidence)) > 0),
  intervene_if text,
  supersedes uuid references public.mark_confidence_reads(id) on delete set null,
  authored_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- A read may rest on several filed sessions, following the same join-table shape
-- judgments already use rather than an unvalidated array.
create table public.mark_confidence_completions (
  read_id uuid not null references public.mark_confidence_reads(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  primary key (read_id, completion_id)
);

create index mark_confidence_reads_mark_idx on public.mark_confidence_reads (mark_id, created_at desc);

alter table public.mark_confidence_reads enable row level security;
alter table public.mark_confidence_completions enable row level security;

-- Coach only, both ways. An athlete session can never write a confidence read,
-- and there is no update or delete policy at all.
create policy confidence_coach_read on public.mark_confidence_reads
  for select to authenticated using (public.is_coach_member(athlete_id));
create policy confidence_coach_write on public.mark_confidence_reads
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and authored_by = auth.uid());

create policy confidence_completions_read on public.mark_confidence_completions
  for select to authenticated using (exists (
    select 1 from public.mark_confidence_reads r
    where r.id = read_id and public.is_coach_member(r.athlete_id)));
create policy confidence_completions_write on public.mark_confidence_completions
  for insert to authenticated with check (exists (
    select 1 from public.mark_confidence_reads r
    where r.id = read_id and public.is_coach_member(r.athlete_id)));

create trigger mark_confidence_reads_immutable
  before update or delete on public.mark_confidence_reads
  for each row execute function public.prevent_immutable_change();

-- The standing read is the newest one nothing has superseded.
create or replace view public.mark_standing_confidence
with (security_invoker = true) as
select r.*
  from public.mark_confidence_reads r
 where not exists (select 1 from public.mark_confidence_reads later where later.supersedes = r.id);

grant select on public.mark_standing_confidence to authenticated;
