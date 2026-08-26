-- Established proof can be unknown, and unknown is not a rung.
--
-- Marcus's ladder carries 1 mi as the current test with 2 mi and 8 mi both
-- reached, all of it legacy, none of it vouched for. Removing the 8 by setting
-- it to proposed does not produce the right answer: established proof is derived
-- as the highest reached rung, so the 2 immediately takes its place and the
-- screen quietly asserts a proof nobody chose. Every rung edit produces some
-- other number. There is no rung that means "we do not know".
--
-- So the question moves up a level. The mark says whether its established proof
-- is derived from the ladder at all. Set it to unknown and the console stops
-- claiming a distance while leaving every checkpoint exactly as it is: the 8 is
-- preserved, the 2 is preserved, the current test and the next rung are
-- untouched, and nothing has to be rewritten to stop the screen lying.
--
-- Going back to derived is a decision like any other and is recorded the same way.

alter table public.athlete_marks
  add column if not exists established_proof_state text not null default 'derived';

alter table public.athlete_marks
  add constraint mark_proof_state_known
  check (established_proof_state in ('derived', 'unknown'));

-- Append only, because "who decided we no longer trust this" is exactly the
-- thing the erasure destroyed and the thing worth keeping this time.
create table public.mark_proof_state_changes (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  mark_id uuid not null references public.athlete_marks(id) on delete cascade,
  previous_state text not null,
  resulting_state text not null check (resulting_state in ('derived', 'unknown')),
  reason text not null check (length(btrim(reason)) > 0),
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index mark_proof_state_changes_mark_idx
  on public.mark_proof_state_changes (mark_id, created_at desc);

alter table public.mark_proof_state_changes enable row level security;

create policy proof_state_member_read on public.mark_proof_state_changes
  for select to authenticated using (public.can_read_athlete(athlete_id));
create policy proof_state_coach_insert on public.mark_proof_state_changes
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and changed_by = auth.uid());

create trigger mark_proof_state_changes_immutable
  before update or delete on public.mark_proof_state_changes
  for each row execute function public.prevent_immutable_change();

comment on column public.athlete_marks.established_proof_state is
  'derived means established proof is the highest reached rung. unknown means the ladder is not trusted to answer the question yet, and the console shows no distance rather than promoting whatever rung sits below the one being doubted. Never inferred; changed only by an explicit coach correction, recorded in mark_proof_state_changes.';

do $$
declare bad integer;
begin
  select count(*) into bad from public.athlete_marks where established_proof_state is null;
  if bad > 0 then raise exception '% marks have no proof state', bad; end if;
  select count(*) into bad from public.athlete_marks where established_proof_state <> 'derived';
  raise notice 'marks not deriving established proof: %', bad;
end $$;
