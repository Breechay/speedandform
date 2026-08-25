-- Coach authoring from the desk.
--
-- Until now a session could only be authored by a migration: planned_sessions and
-- planned_session_versions carried read policies and no write policies, so the
-- browser was never allowed to create one. Filing on an athlete's behalf was
-- blocked the same way, since the only insert policy demanded source = 'athlete'.
--
-- These policies open exactly those three doors and nothing else. The coach still
-- cannot rewrite history: planned_session_versions_immutable rejects update and
-- delete, so a revision has to arrive as a new version.

create policy sessions_coach_write on public.planned_sessions
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and created_by = auth.uid());

-- Rescheduling or cancelling is a change to the session, not to its history.
create policy sessions_coach_update on public.planned_sessions
  for update to authenticated
  using (public.is_coach_member(athlete_id))
  with check (public.is_coach_member(athlete_id));

create policy versions_coach_write on public.planned_session_versions
  for insert to authenticated
  with check (public.is_coach_member(athlete_id) and authored_by = auth.uid());

-- A coach filing for an athlete is marked coach_import, so where a number came
-- from is never ambiguous. Filing as though the athlete did it stays impossible.
create policy completions_coach_insert on public.session_completions
  for insert to authenticated
  with check (
    public.is_coach_member(athlete_id)
    and filed_by = auth.uid()
    and source = 'coach_import'
  );
