-- FORM 44.7/44.8 generic regression checks; no private athlete fixtures.
-- Run after the Speed integrity migration on a test database populated with
-- coach-imported, pinned work-rep, easy/long, Strava and partial fixtures.

do $test$
declare violations integer;
begin
  -- A signed overlay must belong to the same athlete as the immutable piece.
  select count(*) into violations
  from public.speed_piece_distance_corrections d
  join public.session_pieces p on p.id=d.piece_id
  where d.athlete_id<>p.athlete_id;
  if violations<>0 then
    raise exception 'Cross-athlete signed overlay: %',violations;
  end if;

  -- No track-mark rows should derive from Strava-only or non-repetition
  -- native receipts. Legacy coach-imports remain source-specific exceptions.
  select count(*) into violations
  from public.athlete_track_sessions t
  join public.session_completions c on c.id=t.completion_id
  where t.source_kind='filed'
    and (c.timing_source='strava' or
      (c.source in ('form','athlete') and not exists (
        select 1 from public.planned_session_components pc
        where pc.version_id=c.planned_session_version_id
          and pc.athlete_id=c.athlete_id
          and pc.role='work' and pc.shape='repetitions'
      )));
  if violations<>0 then
    raise exception 'Non-track receipt polluted athlete track marks: %',violations;
  end if;

  if not exists (
    select 1 from pg_trigger t
    where t.tgname='track_distance_correction_refresh' and t.tgenabled='O'
  ) then
    raise exception 'Correction-to-stat refresh trigger is absent';
  end if;
end;
$test$;

-- Signed-in acceptance is required separately:
-- * Coach can reconcile only their own athlete's exact pinned repetitions.
-- * Athlete/other coach/anon cannot call reconciliation successfully.
-- * Partial/mixed/continuous/unknown-distance work is rejected (no guesses).
-- * Corrected 9+ rep filings render every time, without prefix truncation.
-- * New native distance-defined filings update Speed automatically on commit.
-- * A raw GPS estimate stays a reference, never a timed track best.
