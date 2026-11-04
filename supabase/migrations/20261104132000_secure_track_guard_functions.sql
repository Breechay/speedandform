-- Internal trigger guards must not be callable via the public RPC surface.
-- The trigger remains usable by PostgreSQL when a session is versioned.
revoke all on function public.form_guard_track_pace_unit() from public, anon, authenticated;
revoke all on function public.form_guard_session_title() from public, anon, authenticated;

-- Coach screenshot / filed session deduplication uses planned_session_id;
-- also cover the new table's otherwise unindexed foreign key.
create index if not exists athlete_track_sessions_planned_session_idx
  on public.athlete_track_sessions(planned_session_id)
  where planned_session_id is not null;
