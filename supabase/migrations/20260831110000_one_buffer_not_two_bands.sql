-- Race pace moves to goal pace. Threshold keeps the buffer, because it is the buffer.
--
-- Hope's campaign prescribed race pace at 6:30-6:45 and threshold at 6:25-6:30.
-- Five seconds apart. Those are the same run, prescribed twice a week, with one of
-- them called race pace -- and the athlete arrives on race day having never
-- rehearsed the rhythm she has to hold for 13.1 miles.
--
-- Brice's own campaign is the reference and it already gets this right: goal 1:15,
-- race pace 5:41-5:43 sitting AT goal pace, threshold 5:13-5:23 sitting 28 seconds
-- under it. One buffer, two bands with genuinely different jobs.
--
-- These are re-derivations, not reclassifications. The sessions were authored as
-- race pace; the intent was right and the number was computed wrong. Volume does
-- not collapse -- the sessions move with the band, W2 stays 6.0, the ladder holds.
--
-- Where the buffer belongs is the goal. If she holds eight continuous miles at
-- 6:45-6:52 and reports RPE 6, the goal is wrong and moves with a receipt behind it.

-- A published prescription is append-only, and the database said so when this tried
-- to update in place. That law is the reason Hope's superseded nine-mile Sunday still
-- exists, so the re-derivation goes through versions like every other change: the old
-- band keeps saying what was published, and the new version says what is asked now.
do $$
declare
  target record;
  latest record;
  new_version uuid;
  n integer := 0;
begin
  for target in
    select ps.id, ps.athlete_id
      from public.planned_sessions ps
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id and k.role = 'work'
     where k.pace_low_seconds = 390 and k.pace_high_seconds = 405
  loop
    select * into latest from public.planned_session_versions
     where planned_session_id = target.id order by version_number desc limit 1;

    insert into public.planned_session_versions
      (athlete_id, planned_session_id, version_number, title, prescribed_distance,
       distance_unit, prescribed_duration_minutes, intent, details, change_reason,
       authored_by, pace_low, pace_high)
    values (target.athlete_id, target.id, latest.version_number + 1, latest.title,
            latest.prescribed_distance, latest.distance_unit,
            latest.prescribed_duration_minutes, latest.intent, latest.details,
            'Race pace re-derived from 6:30-6:45 to goal pace 6:45-6:52. The old band sat five seconds from the authored threshold band, which made the two sessions the same run prescribed twice and left no session rehearsing the rhythm the race actually asks for. Authoring intent unchanged: this was always the race-pace session.',
            latest.authored_by, '6:45', '6:52')
    returning id into new_version;

    insert into public.planned_session_components
      (athlete_id, version_id, position, role, shape, repeat_count, distance, distance_unit,
       duration_seconds, recovery_seconds, recovery_kind,
       pace_low, pace_high, pace_low_seconds, pace_high_seconds,
       rpe_low, rpe_high, rpe_source, rpe_default_version,
       repeat_minimum, repeat_target, repeat_progression, repeat_ceiling)
    select athlete_id, new_version, position, role, shape, repeat_count, distance, distance_unit,
           duration_seconds, recovery_seconds, recovery_kind,
           case when pace_low_seconds = 390 then '6:45' else pace_low end,
           case when pace_high_seconds = 405 then '6:52' else pace_high end,
           case when pace_low_seconds = 390 then 405 else pace_low_seconds end,
           case when pace_high_seconds = 405 then 412 else pace_high_seconds end,
           rpe_low, rpe_high, rpe_source, rpe_default_version,
           repeat_minimum, repeat_target, repeat_progression, repeat_ceiling
      from public.planned_session_components
     where version_id = latest.id;

    n := n + 1;
  end loop;
  raise notice 're-derived % sessions to race pace 6:45-6:52', n;
end $$;

-- ── The guard ───────────────────────────────────────────────────────────────
--
-- Two bands within ten seconds of each other are one stimulus wearing two names.
-- Reports; never repairs. A campaign that trips this needs a coaching decision,
-- not a migration quietly moving somebody's training.
create or replace function public.band_collisions()
returns table (slug text, race_band text, threshold_band text, gap_seconds integer)
language sql stable as $$
  -- CURRENT prescriptions only. Superseded versions keep their old bands on purpose
  -- -- that is what append-only history is for -- and a guard that reads them would
  -- report a collision with a prescription nobody is being asked to run.
  with current_bands as (
    select distinct a.slug, k.pace_low, k.pace_high, k.pace_low_seconds, k.pace_high_seconds
      from public.planned_sessions ps
      join public.athletes a on a.id = ps.athlete_id
      join lateral (select * from public.planned_session_versions pv
                     where pv.planned_session_id = ps.id
                     order by pv.version_number desc limit 1) v on true
      join public.planned_session_components k on k.version_id = v.id
     where k.pace_low_seconds is not null
  ),
  bands as (
    select slug, pace_low, pace_high, pace_low_seconds, pace_high_seconds,
           -- The slower band is race pace; anything meaningfully faster is buffer work.
           rank() over (partition by slug order by pace_low_seconds desc) as slowest
      from current_bands
  ),
  paired as (
    select r.slug,
           r.pace_low || '-' || r.pace_high as race_band,
           t.pace_low || '-' || t.pace_high as threshold_band,
           (r.pace_low_seconds - t.pace_high_seconds) as gap
      from bands r join bands t on t.slug = r.slug
     where r.slowest = 1 and t.slowest > 1
  )
  select slug, race_band, threshold_band, gap from paired where gap < 10;
$$;

comment on function public.band_collisions is
  'Campaigns prescribing two pace bands within ten seconds of each other. That is one stimulus with two names, and it costs the athlete the only session where they learn what goal pace feels like. Reports; never repairs.';

do $$
declare
  bad text;
  -- Brice's own campaign, as the reference the guard has to accept.
  brice_gap integer := 341 - 323;   -- race 5:41 fast edge, threshold 5:23 slow edge
begin
  if brice_gap < 10 then
    raise exception 'the guard rejects Brice''s own campaign, so the guard is wrong';
  end if;

  select string_agg(slug || ' (' || race_band || ' vs ' || threshold_band || ', ' || gap_seconds || 's)', '; ')
    into bad from public.band_collisions();
  if bad is not null then
    raise exception 'band collision survives re-derivation: %', bad;
  end if;
end $$;
