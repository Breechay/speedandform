-- A filed measurement can only be corrected through the path that records it.
--
-- session_pieces had one policy, `for all`, so a coach client could update a rep
-- time directly. The audit trigger would snapshot the old row, but nothing captured
-- WHY, nothing captured what the new value rested on, and the correction ledger
-- built for exactly that could be walked straight past.
--
-- So the client loses UPDATE and DELETE on pieces, and gets a function that does
-- both halves at once: record the correction with its source and reason, then apply
-- it. One transaction, so a value can never exist in the table without the row that
-- explains it.
--
-- Insert stays open. Filing a session is not correcting one.

drop policy if exists pieces_coach_write on public.session_pieces;

create policy pieces_coach_insert on public.session_pieces
  for insert to authenticated with check (public.is_coach_member(athlete_id));

comment on table public.session_pieces is
  'Filed reps, floats, warmups and cooldowns. Insertable by a coach; NOT updatable or deletable from a client. Corrections go through correct_piece_measurement, which records what changed and why in the same transaction as the change.';

create or replace function public.correct_piece_measurement(
  p_piece_id uuid,
  p_field text,
  p_value numeric,
  p_source text,
  p_reason text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  piece public.session_pieces;
  previous numeric;
  correction_id uuid;
begin
  select * into piece from public.session_pieces where id = p_piece_id;
  if piece.id is null then raise exception 'no such filed piece'; end if;

  -- security definer, so authorisation is checked here rather than assumed.
  if not public.is_coach_member(piece.athlete_id) then
    raise exception 'not yours to correct';
  end if;

  if p_field not in ('duration_seconds', 'duration_seconds_exact', 'distance', 'pace_seconds') then
    raise exception 'a piece has no measurement called %', p_field;
  end if;
  if length(btrim(coalesce(p_source, ''))) = 0 then
    raise exception 'a corrected measurement carries where the new number came from';
  end if;
  if length(btrim(coalesce(p_reason, ''))) = 0 then
    raise exception 'a corrected measurement carries why it changed';
  end if;

  execute format('select ($1).%I::numeric', p_field) into previous using piece;

  insert into public.session_piece_corrections
    (athlete_id, piece_id, completion_id, field, previous_value, corrected_value,
     source, reason, corrected_by)
  values (piece.athlete_id, p_piece_id, piece.completion_id, p_field, previous, p_value,
          p_source, p_reason, auth.uid())
  returning id into correction_id;

  execute format('update public.session_pieces set %I = $1 where id = $2', p_field)
    using p_value, p_piece_id;

  -- The evidence moved, so every proposal computed from it goes stale by fingerprint.
  update public.session_completions set updated_at = now() where id = piece.completion_id;

  return correction_id;
end $$;

revoke all on function public.correct_piece_measurement(uuid, text, numeric, text, text) from public, anon;
grant execute on function public.correct_piece_measurement(uuid, text, numeric, text, text) to authenticated;

do $$
declare writable integer;
begin
  select count(*) into writable from pg_policies
   where schemaname = 'public' and tablename = 'session_pieces' and cmd in ('UPDATE', 'DELETE', 'ALL');
  if writable > 0 then
    raise exception 'session_pieces still has % client-writable policies', writable;
  end if;
end $$;
