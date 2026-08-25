-- Correcting a session must not destroy the splits it used to have.
--
-- session_completions has been audited since the foundation: audit_completion_change
-- snapshots the whole previous row into completion_revisions before every update.
-- session_pieces never was, and the correction path replaces pieces wholesale,
-- because a re-read of a screenshot is a new reading of the session rather than an
-- edit to one figure. So the completion was safe and its splits were not.
--
-- This matters exactly where corrections matter. Hope's floats were entered as
-- "3:00 each, run hard" and are in fact 10:01, 12:12, 12:12. If that correction
-- had been made through this path, the wrong reading would have vanished with no
-- trace that the record ever said something else.
--
-- Pieces snapshot into the same log as their completion, because a revision to a
-- split is a revision to that session.

create or replace function public.audit_piece_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.completion_revisions (athlete_id, completion_id, previous_value, changed_by)
  values (old.athlete_id, old.completion_id, to_jsonb(old), auth.uid());
  return old;
end;
$$;

revoke all on function public.audit_piece_change() from public;

create trigger session_pieces_audit
  before update or delete on public.session_pieces
  for each row execute function public.audit_piece_change();

-- Why a correction was made, which the log had no room for. Nullable, because the
-- audit fires on every write and cannot demand a sentence the caller did not send.
alter table public.completion_revisions add column if not exists reason text;
