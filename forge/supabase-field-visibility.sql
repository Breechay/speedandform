-- ============================================================
-- FORM FIELD VISIBILITY (MIAMI COHORT + PUBLIC RECORD MODEL)
-- Run after invite/session SQL migrations
-- ============================================================

-- 1) Extend athlete profile visibility model
alter table athlete_profiles
  add column if not exists is_public boolean not null default false,
  add column if not exists share_sessions text not null default 'none'
    check (share_sessions in ('none', 'key', 'all')),
  add column if not exists share_pace boolean not null default false,
  add column if not exists share_weights boolean not null default false,
  add column if not exists field_cohort text,
  add column if not exists field_record_visibility text not null default 'private'
    check (field_record_visibility in ('private', 'profile', 'cohort_public')),
  add column if not exists field_stream_visibility text not null default 'private'
    check (field_stream_visibility in ('private', 'public'));

-- 2) Public record access for running sessions (factual cards)
--    - Explicit profile public + record visibility
--    - Session sharing gate
--    - Pace gate
drop policy if exists "Public field running records" on running_sessions;
create policy "Public field running records"
  on running_sessions for select
  using (
    exists (
      select 1
      from athlete_profiles ap
      where ap.id = running_sessions.athlete_id
        and ap.is_public = true
        and ap.field_record_visibility in ('profile', 'cohort_public')
        and (
          ap.share_sessions = 'all'
          or (ap.share_sessions = 'key' and running_sessions.session_type in ('threshold', 'long_run'))
        )
    )
  );

-- 3) Public record access for strength sessions
drop policy if exists "Public field strength records" on strength_sessions;
create policy "Public field strength records"
  on strength_sessions for select
  using (
    exists (
      select 1
      from athlete_profiles ap
      where ap.id = strength_sessions.athlete_id
        and ap.is_public = true
        and ap.field_record_visibility in ('profile', 'cohort_public')
        and ap.share_sessions in ('key', 'all')
    )
  );

-- 4) Public set log visibility only when strength session is visible
drop policy if exists "Public field set logs" on set_logs;
create policy "Public field set logs"
  on set_logs for select
  using (
    exists (
      select 1
      from strength_sessions ss
      join athlete_profiles ap on ap.id = ss.athlete_id
      where ss.id = set_logs.session_id
        and ap.is_public = true
        and ap.field_record_visibility in ('profile', 'cohort_public')
        and ap.share_sessions in ('key', 'all')
    )
  );

-- 5) Helpful index for cohort pages
create index if not exists athlete_profiles_field_cohort_idx
  on athlete_profiles(field_cohort);
