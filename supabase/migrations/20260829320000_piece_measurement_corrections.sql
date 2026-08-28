-- Correcting a measurement is a record, not an edit.
--
-- Hope's six reps were filed as whole seconds because that is the only shape the
-- column had. The stopwatch read tenths, and the difference is a rep spread of 10.3
-- seconds rather than 11 — the same consistency band today, and a band edge on some
-- future session where it decides something.
--
-- Writing the tenths in silently would leave a database whose numbers had changed
-- with nothing to say when or why. So the correction goes through a ledger first,
-- naming the old value, the new one, what it rests on and who did it, exactly as a
-- rung movement does. Append only, and no update or delete policy anywhere.
--
-- This does not overwrite the integers. Every existing reader keeps reading them,
-- they stay within a second of the source by constraint, and the precise value sits
-- beside them for anything that measures a spread.

create table public.session_piece_corrections (
  id uuid primary key default gen_random_uuid(),
  athlete_id uuid not null references public.athletes(id) on delete cascade,
  piece_id uuid not null references public.session_pieces(id) on delete cascade,
  completion_id uuid not null references public.session_completions(id) on delete cascade,
  -- Which measurement moved. One row per field, so a correction is never a blob
  -- that has to be diffed to be understood.
  field text not null check (field in ('duration_seconds', 'duration_seconds_exact', 'distance', 'pace_seconds')),
  previous_value numeric(10,2),
  corrected_value numeric(10,2),
  -- Where the corrected number came from. Required: a measurement with no stated
  -- source is the thing this table exists to stop.
  source text not null check (length(btrim(source)) > 0),
  reason text not null check (length(btrim(reason)) > 0),
  corrected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index session_piece_corrections_completion_idx
  on public.session_piece_corrections (completion_id, created_at desc);

alter table public.session_piece_corrections enable row level security;

create policy piece_corrections_coach_read on public.session_piece_corrections
  for select to authenticated using (public.is_coach_member(athlete_id));
create policy piece_corrections_coach_insert on public.session_piece_corrections
  for insert to authenticated with check (public.is_coach_member(athlete_id));

create trigger session_piece_corrections_immutable
  before update or delete on public.session_piece_corrections
  for each row execute function public.prevent_immutable_change();

comment on table public.session_piece_corrections is
  'Append-only history of measurement corrections on filed pieces. A corrected number without a stated source and reason is indistinguishable from a number somebody made up, which is why both are required and neither can be edited afterwards.';

-- Hope's 2026-08-27 reps, as the stopwatch read them.
--
-- 250.1, 252.6, 242.3, 242.7, 243.6, 244.0 — a spread of 10.3 seconds. The stored
-- integers were 250, 253, 242, 243, 244, 244, whose spread is 11. Both remain; the
-- integers are now explicitly a rounding of these.
do $$
declare
  target uuid := '1201fdf0-7ae8-458f-84ae-7b82a1f15114';
  athlete uuid;
  exact_values numeric[] := array[250.1, 252.6, 242.3, 242.7, 243.6, 244.0];
  piece record;
  i integer := 0;
  spread numeric;
begin
  select athlete_id into athlete from public.session_completions where id = target;
  if athlete is null then raise exception 'Hope''s 2026-08-27 completion is not present'; end if;

  for piece in
    select id, position, duration_seconds from public.session_pieces
     where completion_id = target and kind = 'rep' order by position
  loop
    i := i + 1;
    if i > array_length(exact_values, 1) then
      raise exception 'more filed reps than measured values; refusing to guess at rep %', i;
    end if;

    insert into public.session_piece_corrections
      (athlete_id, piece_id, completion_id, field, previous_value, corrected_value, source, reason)
    values (athlete, piece.id, target, 'duration_seconds_exact',
            null, exact_values[i],
            'Stopwatch screenshots of the 2026-08-27 session, supplied by Brice',
            'The measurement was taken to a tenth and the column stored whole seconds, so the filed rep spread read 11 seconds against a measured 10.3.');

    update public.session_pieces
       set duration_seconds_exact = exact_values[i]
     where id = piece.id;
  end loop;

  if i <> array_length(exact_values, 1) then
    raise exception 'measured % values against % filed reps', array_length(exact_values, 1), i;
  end if;

  -- The evidence moved, so anything computed from it is now stale by construction.
  -- confidence.v1's fingerprint is built from these completions' updated_at, which
  -- is exactly how a proposal made before this correction stops being acceptable.
  update public.session_completions set updated_at = now() where id = target;

  select max(duration_seconds_exact) - min(duration_seconds_exact) into spread
    from public.session_pieces where completion_id = target and kind = 'rep';
  if spread <> 10.3 then
    raise exception 'backfilled spread is % seconds, not the measured 10.3', spread;
  end if;
  raise notice 'Hope 2026-08-27: % reps corrected, spread %s', i, spread;
end $$;
