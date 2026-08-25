-- Editing a filed session.
--
-- Everything for this already existed: completion_revisions snapshots the old
-- values, session_completion_audit writes the snapshot, and the identity guard
-- refuses to let the athlete, the session, the source or the filer change. The
-- only missing piece was a policy letting the coach update at all.
--
-- This matters more now than it did. Sessions are read from screenshots, and a
-- reading can be wrong: Hope's recoveries were entered backwards once and the
-- page told the opposite story for two days. Correcting a number has to be
-- ordinary, and the previous value has to survive the correction.

create policy completions_coach_update on public.session_completions
  for update to authenticated
  using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));
