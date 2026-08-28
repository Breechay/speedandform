-- The splits audit was discarding every correction it recorded.
--
-- audit_piece_change is a BEFORE UPDATE trigger and it ended with `return old`. In
-- Postgres the row a BEFORE row trigger returns is the row that gets written, so
-- returning OLD writes the old values back: the update becomes a silent no-op. The
-- revision was logged faithfully, the caller got no error and reported success, and
-- the correction never landed.
--
-- Found by trying to file Hope's rep tenths through it. Six corrections logged, six
-- values unchanged, no error anywhere.
--
-- On DELETE, returning OLD is correct and the delete proceeds. Only the UPDATE path
-- was wrong, which is why nothing about the table looked broken.

create or replace function public.audit_piece_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.completion_revisions (athlete_id, completion_id, previous_value, changed_by)
  values (old.athlete_id, old.completion_id, to_jsonb(old), auth.uid());
  -- The row that continues. OLD on a delete lets it proceed; NEW on an update is
  -- the correction actually being applied, which is the whole point of the write.
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.audit_piece_change() from public;

-- Now Hope's tenths, for real this time. The corrections were already recorded in
-- session_piece_corrections by the previous migration; this applies the values that
-- ledger says were applied, so the two stop disagreeing.
do $$
declare
  target uuid := '1201fdf0-7ae8-458f-84ae-7b82a1f15114';
  exact_values numeric[] := array[250.1, 252.6, 242.3, 242.7, 243.6, 244.0];
  piece record;
  i integer := 0;
  spread numeric;
begin
  for piece in
    select id from public.session_pieces
     where completion_id = target and kind = 'rep' order by position
  loop
    i := i + 1;
    update public.session_pieces
       set duration_seconds_exact = exact_values[i]
     where id = piece.id;
  end loop;

  select max(duration_seconds_exact) - min(duration_seconds_exact) into spread
    from public.session_pieces where completion_id = target and kind = 'rep';

  -- `is distinct from` rather than `<>`, because a null spread compared with `<>`
  -- yields null and an `if` on null does nothing at all. That is exactly how the
  -- previous migration's guard let a completely failed backfill pass.
  if spread is distinct from 10.3 then
    raise exception 'backfilled spread is % seconds, not the measured 10.3', coalesce(spread::text, 'null');
  end if;

  update public.session_completions set updated_at = now() where id = target;
  raise notice 'Hope 2026-08-27: % reps now carry their measured tenths, spread %', i, spread;
end $$;
