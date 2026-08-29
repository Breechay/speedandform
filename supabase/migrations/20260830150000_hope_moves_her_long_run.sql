-- Hope's long run moves to Saturday and becomes twelve strictly easy.
--
-- A version records what a session says. Nothing recorded when it says it, because
-- the date lives on planned_sessions and moving it is a mutation — so a session that
-- moved left no trace of having moved, and "why is the long run on Saturday" had no
-- answer in the record.
--
-- This is an authored change, not evidence. Hope has not run it. Twelve easy miles
-- support durability; they say nothing yet about how far she can hold race pace, so
-- no rung moves and no confidence is touched.

create table if not exists public.planned_session_moves (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  planned_session_id uuid not null references public.planned_sessions(id) on delete cascade,
  from_date date,
  to_date date,
  from_day_label text,
  to_day_label text,
  -- Kept apart on purpose. The athlete asked for something and the coach decided
  -- something, and a single "reason" field would blur which was which.
  athlete_reason text,
  coach_decision text,
  moved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.planned_session_moves enable row level security;

create policy session_moves_member_read on public.planned_session_moves
  for select to authenticated
  using (public.is_athlete_member(athlete_id) or public.is_coach_member(athlete_id));
create policy session_moves_coach_insert on public.planned_session_moves
  for insert to authenticated with check (public.is_coach_member(athlete_id));

create trigger planned_session_moves_immutable
  before update or delete on public.planned_session_moves
  for each row execute function public.prevent_immutable_change();

comment on table public.planned_session_moves is
  'Append-only record of a prescribed session changing date. The version history says what a session asked for; this says when it was asked for, and why it moved.';

do $$
declare
  target uuid := '8e7785dc-20ec-4402-b661-b885152737e6';
  latest record;
  new_version uuid;
  hope uuid;
begin
  select * into latest from public.planned_session_versions
   where planned_session_id = target order by version_number desc limit 1;
  if latest.id is null then raise exception 'Hope''s long run is not where it was'; end if;
  select athlete_id into hope from public.planned_sessions where id = target;

  -- The move, recorded before the row changes, so the ledger cannot end up
  -- describing a state that was never written.
  insert into public.planned_session_moves
    (athlete_id, planned_session_id, from_date, to_date, from_day_label, to_day_label,
     athlete_reason, coach_decision)
  select hope, target, ps.scheduled_on, date '2026-08-29', ps.day_label, 'SAT',
         'To hit 45 for the week.',
         'Go for 12. Rest Sunday.'
    from public.planned_sessions ps where ps.id = target;

  update public.planned_sessions
     set scheduled_on = date '2026-08-29',
         day_label = 'SAT',
         -- CHANGED is a disclosure, not an alarm: the athlete should see that the
         -- week was rewritten and by whom, without it reading as a warning.
         state = 'changed',
         updated_at = now()
   where id = target;

  -- Twelve, strictly easy. A new version; version 1 keeps saying nine on a Sunday.
  insert into public.planned_session_versions
    (athlete_id, planned_session_id, version_number, title, prescribed_distance,
     distance_unit, intent, details, change_reason, authored_by)
  values (hope, target, latest.version_number + 1, 'Long run', 12.00, 'mi',
          latest.intent,
          'All easy. Nothing at pace, and nothing firmer at the end.',
          'Moved from Sunday 30 August and lengthened from nine to twelve. Hope asked: "To hit 45 for the week." Brice decided: "Go for 12. Rest Sunday." Sunday is rest; no second session was added to make up the distance.',
          latest.authored_by)
  returning id into new_version;

  -- Strictly easy, authored explicitly. This is not the quality-session default
  -- inherited from effort_defaults; a long run carries its own target and an
  -- authored effort always wins.
  insert into public.planned_session_components
    (athlete_id, version_id, position, role, shape, distance, distance_unit,
     rpe_low, rpe_high, rpe_source)
  values (hope, new_version, 1, 'work', 'continuous', 12.00, 'mi', 5, 6, 'authored');

  raise notice 'Hope: long run moved to 2026-08-29, version %', latest.version_number + 1;
end $$;

do $$
declare bad integer;
begin
  -- Version 1 must still say nine miles on a Sunday.
  select count(*) into bad from public.planned_session_versions
   where planned_session_id = '8e7785dc-20ec-4402-b661-b885152737e6'
     and version_number = 1 and prescribed_distance = 9.00;
  if bad <> 1 then raise exception 'the superseded nine-mile prescription was not preserved'; end if;

  select count(*) into bad from public.planned_session_moves
   where planned_session_id = '8e7785dc-20ec-4402-b661-b885152737e6'
     and from_date = date '2026-08-30' and to_date = date '2026-08-29';
  if bad <> 1 then raise exception 'the move was not recorded'; end if;

  -- Nothing else in Hope's week may have appeared.
  select count(*) into bad from public.planned_sessions ps
    join public.athletes a on a.id = ps.athlete_id
   where a.slug = 'hope' and ps.scheduled_on = date '2026-08-30';
  if bad <> 0 then raise exception 'Sunday is not rest: % session(s) remain', bad; end if;
end $$;
